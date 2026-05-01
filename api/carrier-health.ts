import type { VercelRequest, VercelResponse } from '@vercel/node';

const SAFER_SNAPSHOT_URL = 'https://safer.fmcsa.dot.gov/query.asp';
const DOT_NUMBER_RE = /^\d{1,8}$/;

const decodeHtml = (value: string) => value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#145;/gi, '’')
    .replace(/&#146;/gi, '’')
    .replace(/&#147;/gi, '“')
    .replace(/&#148;/gi, '”')
    .replace(/&rsquo;/gi, '’')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&rdquo;/gi, '”')
    .replace(/&ldquo;/gi, '“')
    .replace(/&deg;/gi, '°');

const stripTags = (value: string) => decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const cleanNumber = (value: string) => Number.parseFloat(value.replace(/[^\d.-]/g, ''));
const cleanInt = (value: string) => Number.parseInt(value.replace(/[^\d-]/g, ''), 10);
const cleanPercent = (value: string) => Number.parseFloat(value.replace(/[^\d.]/g, ''));
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const extractBetween = (html: string, startPattern: RegExp, endPattern: RegExp) => {
    const startMatch = html.match(startPattern);
    if (!startMatch || startMatch.index === undefined) return null;

    const slice = html.slice(startMatch.index);
    const endMatch = slice.match(endPattern);
    if (!endMatch || endMatch.index === undefined) return null;

    return slice.slice(0, endMatch.index + endMatch[0].length);
};

const extractLabelValue = (html: string, label: string) => {
    const labelPattern = new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:?<\\/A>?<\\/TH>\\s*<TD[^>]*>([\\s\\S]*?)<\\/TD>`, 'i');
    const match = html.match(labelPattern);
    if (match?.[1]) return stripTags(match[1]);

    const plainPattern = new RegExp(`<TH[^>]*>${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:<\\/TH>\\s*<TD[^>]*>([\\s\\S]*?)<\\/TD>`, 'i');
    const plainMatch = html.match(plainPattern);
    if (plainMatch?.[1]) return stripTags(plainMatch[1]);

    return null;
};

const extractRowCells = (html: string, rowLabel: string) => {
    const rowPattern = new RegExp(`<TH[^>]*>${rowLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/TH>([\\s\\S]*?)<\\/TR>`, 'i');
    const match = html.match(rowPattern);
    if (!match?.[1]) return [] as string[];

    return Array.from(match[1].matchAll(/<TD[^>]*>([\s\S]*?)<\/TD>/gi), (item) => stripTags(item[1]));
};

const extractTextWindow = (html: string, marker: string, endMarker?: string) => {
    const start = html.indexOf(marker);
    if (start < 0) return null;
    const slice = html.slice(start);
    if (!endMarker) return slice;
    const end = slice.indexOf(endMarker);
    if (end < 0) return slice;
    return slice.slice(0, end);
};

const parseInspectionSummary = (html: string) => {
    const usSection = extractTextWindow(html, 'US Inspection results for 24 months prior to:');
    const caSection = extractTextWindow(html, 'Canadian Inspection results for 24 months prior to:');
    const crashSection = extractTextWindow(html, '<!--  BEGIN: Crash Data -->', '<CENTER><IMG src="Images/SAFER_hr.jpg"');
    const safetySection = extractTextWindow(html, '<A class="querylabel" href="saferhelp.aspx#SafetyRating">Carrier Safety Rating:</A>', '<!-- BEGIN: End of display loop -->');

    const totalInspections = cleanInt(usSection?.match(/Total Inspections:\s*<FONT[^>]*>([\d,]+)/i)?.[1] ?? '0');
    const usInspectionCells = extractRowCells(usSection ?? html, 'Inspections');
    const usOutOfServiceCells = extractRowCells(usSection ?? html, 'Out of Service');
    const caInspectionCells = extractRowCells(caSection ?? html, 'Inspections');
    const caOutOfServiceCells = extractRowCells(caSection ?? html, 'Out of Service');
    const crashCells = extractRowCells(crashSection ?? html, 'Crashes');

    const sumCells = (cells: string[]) => cells.reduce((acc, cell) => acc + (Number.isFinite(cleanInt(cell)) ? cleanInt(cell) : 0), 0);
    const sumDecimalCells = (cells: string[]) => cells.reduce((acc, cell) => acc + (Number.isFinite(cleanPercent(cell)) ? cleanPercent(cell) : 0), 0);

    const usInspections = sumCells(usInspectionCells);
    const usOutOfService = sumCells(usOutOfServiceCells);
    const caInspections = sumCells(caInspectionCells);
    const caOutOfService = sumCells(caOutOfServiceCells);

    const crashTotals = {
        fatal: cleanInt(crashCells[0] ?? '0'),
        injury: cleanInt(crashCells[1] ?? '0'),
        tow: cleanInt(crashCells[2] ?? '0'),
        total: cleanInt(crashCells[3] ?? '0'),
    };

    const outOfServiceRate = totalInspections > 0
        ? Math.round(((usOutOfService + caOutOfService) / totalInspections) * 1000) / 10
        : 0;

    const safetyRatingAsOf = safetySection?.match(/current as of:\s*<FONT color="#0000C0">([^<]+)<\/FONT>/i)?.[1]?.trim();
    const safetyRating = stripTags(safetySection?.match(/<TH[^>]*>Rating:<\/TH>\s*<TD[^>]*>([\s\S]*?)<\/TD>/i)?.[1] ?? '');

    return {
        totalInspections,
        usInspections,
        caInspections,
        usOutOfService,
        caOutOfService,
        outOfServiceRate,
        crashes: crashTotals,
        safetyRating: safetyRating || 'None',
        safetyRatingAsOf,
    };
};

const buildDerivedCsaScores = (summary: ReturnType<typeof parseInspectionSummary>) => {
    const crashIntensity = summary.crashes.total * 18 + summary.crashes.fatal * 40 + summary.crashes.injury * 16;
    const inspectionPressure = summary.totalInspections * 2 + summary.outOfServiceRate * 0.8;
    return {
        unsafeDriving: clamp(Math.round(crashIntensity + summary.outOfServiceRate * 0.2)),
        hoursOfService: clamp(Math.round(inspectionPressure + summary.usInspections * 0.5)),
        driverFitness: clamp(Math.round(inspectionPressure * 0.8 + summary.caInspections * 1.5)),
        vehicleMaintenance: clamp(Math.round(summary.outOfServiceRate * 1.2 + summary.totalInspections * 1.8)),
        controlledSubstances: clamp(Math.round(summary.crashes.total * 6)),
        hazmat: clamp(Math.round(summary.usInspections * 0.4)),
        crashIndicator: clamp(Math.round(crashIntensity)),
    };
};

const buildCarrierHealthFromHtml = (dotNumber: string, html: string) => {
    const inspectionSummary = parseInspectionSummary(html);
    const legalName = extractLabelValue(html, 'Legal Name') ?? `DOT ${dotNumber}`;
    const dbaName = extractLabelValue(html, 'DBA Name') || undefined;
    const entityType = extractLabelValue(html, 'Entity Type') ?? 'UNKNOWN';
    const operatingStatus = extractLabelValue(html, 'Operating Authority Status') ?? extractLabelValue(html, 'USDOT Status') ?? 'UNKNOWN';
    const saferRating = extractLabelValue(html, 'Rating') ?? undefined;
    const outOfServiceDate = extractLabelValue(html, 'Out of Service Date') ?? undefined;
    const powerUnits = cleanInt(extractLabelValue(html, 'Power Units') ?? '0') || 0;
    const drivers = cleanInt(extractLabelValue(html, 'Drivers') ?? '0') || 0;
    const mcs150FormDate = extractLabelValue(html, 'MCS-150 Form Date') ?? undefined;
    const mcNumber = extractLabelValue(html, 'MC/MX Number') ?? undefined;

    return {
        dotNumber,
        mcNumber,
        legalName,
        dbaName,
        entityType,
        operatingStatus,
        saferRating,
        outOfServiceDate,
        powerUnits,
        drivers,
        mcs150FormDate,
        inspectionSummary: {
            ...inspectionSummary,
            derivedAt: new Date().toISOString(),
        },
        csaScores: buildDerivedCsaScores(inspectionSummary),
        lastUpdated: new Date().toISOString(),
        fmcsaAsOf: inspectionSummary.safetyRatingAsOf,
    };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const dot = String(req.query.dot ?? '').trim();
    if (!DOT_NUMBER_RE.test(dot)) {
        res.status(400).json({ error: 'A valid USDOT number is required.' });
        return;
    }

    const snapshotUrl = new URL(SAFER_SNAPSHOT_URL);
    snapshotUrl.searchParams.set('searchtype', 'ANY');
    snapshotUrl.searchParams.set('query_type', 'queryCarrierSnapshot');
    snapshotUrl.searchParams.set('query_param', 'USDOT');
    snapshotUrl.searchParams.set('query_string', dot);

    try {
        const response = await fetch(snapshotUrl.toString(), {
            headers: {
                'User-Agent': 'SafetySuite/1.0 (+https://safetyhubconnect.vercel.app)',
                'Accept': 'text/html,application/xhtml+xml',
            },
        });

        if (!response.ok) {
            res.status(502).json({ error: `FMCSA snapshot request failed with HTTP ${response.status}.` });
            return;
        }

        const html = await response.text();
        const health = buildCarrierHealthFromHtml(dot, html);
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ health });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown FMCSA lookup failure.';
        res.status(503).json({ error: `Unable to load FMCSA carrier snapshot: ${message}` });
    }
}
