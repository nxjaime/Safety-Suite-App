
interface CarrierHealth {
    dotNumber: string;
    mcNumber?: string;
    legalName: string;
    dbaName?: string;
    entityType: string;
    operatingStatus: string;
    saferRating?: string;
    outOfServiceDate?: string;
    powerUnits: number;
    drivers: number;
    mcs150FormDate?: string;
    csaScores?: {
        unsafeDriving?: number;
        hoursOfService?: number;
        driverFitness?: number;
        controlledSubstances?: number;
        vehicleMaintenance?: number;
        hazmat?: number;
        crashIndicator?: number;
    };
    csaDetails?: {
        [key: string]: {
            alert: boolean;
            violations?: number;
            measure?: string;
        }
    };
    lastUpdated: string;
}

const BASICS_MAP: Record<string, string> = {
    "UnsafeDriving": "unsafeDriving",
    "HOSCompliance": "hoursOfService",
    "DriverFitness": "driverFitness",
    "DrugsAlcohol": "controlledSubstances",
    "VehicleMaint": "vehicleMaintenance",
    "HMCompliance": "hazmat",
    "CrashIndicator": "crashIndicator",
};

async function scrapeCarrierData(dotNumber: string): Promise<CarrierHealth | null> {
    try {
        const overviewUrl = `https://ai.fmcsa.dot.gov/SMS/Carrier/${dotNumber}/Overview.aspx`;

        const response = await fetch(overviewUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch SAFER data:', response.status);
            return null;
        }

        const html = await response.text();

        // Regex Helpers
        const extractValue = (sourceVal: string, label: string): string => {
            const regex = new RegExp(`${label}[:\\s]*<\\/(?:th|td)>\\s*<td[^>]*>([^<]+)`, 'i');
            const match = sourceVal.match(regex);
            if (match) return match[1].trim();

            const regex2 = new RegExp(`${label}[^<]*<\\/(?:td|th|font)>\\s*<(?:td|th)[^>]*>(?:<font[^>]*>)?([^<]+)`, 'i');
            const match2 = sourceVal.match(regex2);
            if (match2) return match2[1].trim();

            return '';
        };

        const extractNumber = (sourceVal: string, label: string): number => {
            const value = extractValue(sourceVal, label);
            const cleanValue = value.replace(/[,a-zA-Z\s]/g, '');
            return parseInt(cleanValue) || 0;
        };

        // Extract Basic Info
        let legalName = extractValue(html, 'Legal Name');
        if (!legalName) legalName = extractValue(html, 'Entity Name');
        let operatingStatus = extractValue(html, 'Operating Status');
        if (!operatingStatus) operatingStatus = extractValue(html, 'Status');
        const entityType = extractValue(html, 'Entity Type') || extractValue(html, 'Operation Classification');
        const powerUnits = extractNumber(html, 'Power Units');
        const drivers = extractNumber(html, 'Drivers');

        // Extract SAFER rating
        let saferRating: string | undefined;
        if (html.includes('SATISFACTORY')) saferRating = 'SATISFACTORY';
        else if (html.includes('CONDITIONAL')) saferRating = 'CONDITIONAL';
        else if (html.includes('UNSATISFACTORY')) saferRating = 'UNSATISFACTORY';

        // Try to get MC number
        const mcMatch = html.match(/MC-?\d+/);
        const mcNumber = mcMatch ? mcMatch[0] : undefined;


        // Extract CSA Data (Alerts & Violations)
        const csaDetails: CarrierHealth['csaDetails'] = {};

        // 1. Alerts from Overview
        for (const [key, propName] of Object.entries(BASICS_MAP)) {
            // Regex for <li class=" UnsafeDriving Alert">
            const regex = new RegExp(`<li class="\\s*${key}([^"]*)"`, 'i');
            const match = html.match(regex);
            const isAlert = match ? match[1].includes("Alert") : false;

            csaDetails[propName] = { alert: isAlert };
        }

        // 2. Fetch Details for Violations (Parallel)
        // Only fetch a few major ones to avoid timeout? Let's try all.
        const detailPromises = Object.entries(BASICS_MAP).map(async ([key, propName]) => {
            if (key === 'CrashIndicator') return; // Crash often hidden or diff structure

            const detailUrl = `https://ai.fmcsa.dot.gov/SMS/Carrier/${dotNumber}/BASIC/${key}.aspx`;
            try {
                const r = await fetch(detailUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (!r.ok) return;
                const dHtml = await r.text();

                // Extract Violations Count
                // "Unsafe Driving Violations: 4" or just regex for "Violations: X" near headers
                const violRegex = /(?:Violations|Relevant Inspections)[:\s]*<[^>]+>\s*(\d+)/i;
                // Simplified regex based on observation "Unsafe Driving Violations: 4" text presence
                const textViolRegex = /Violations:?\s*(\d+)/i;

                const match = dHtml.match(textViolRegex);
                if (match && csaDetails[propName]) {
                    csaDetails[propName].violations = parseInt(match[1]);
                }
            } catch (e) {
                console.warn(`Failed to fetch detail for ${key}`, e);
            }
        });

        await Promise.all(detailPromises);

        return {
            dotNumber,
            mcNumber,
            legalName: legalName || `Carrier ${dotNumber}`,
            entityType: entityType || 'CARRIER',
            operatingStatus: operatingStatus.toUpperCase().includes('AUTHORIZED') ? 'AUTHORIZED' : operatingStatus,
            saferRating,
            powerUnits,
            drivers,
            csaScores: {}, // Returning empty scores as they are likely hidden. UI should fallback to csaDetails.
            csaDetails,
            lastUpdated: new Date().toISOString()
        };

    } catch (error) {
        console.error('Error scraping carrier data:', error);
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { dot } = req.query;

    if (!dot || typeof dot !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid DOT number' });
    }

    try {
        const carrierData = await scrapeCarrierData(dot);

        if (!carrierData) {
            return res.status(404).json({ error: 'Carrier not found or data unavailable' });
        }

        return res.status(200).json(carrierData);
    } catch (error) {
        console.error('Carrier health API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

