import type { Driver } from '../types';

/**
 * Calculates the Risk Score for a driver based on:
 * - Base Score: 20
 * - Accidents: +20 each
 * - Citations: +10 each
 * - Safe Time: -1 per week since last incident (mocked logic for now, using hire date or arbitrary simplicity)
 * - Completed Coaching: -5 each
 * 
 * Min Score: 0, Max Score: 100
 */
export const calculateRiskScore = (driver: Driver): number => {
    let score = 20; // Base Score

    // 1. Add Event Points
    if (driver.riskEvents) {
        score += driver.riskEvents.reduce((sum, event) => sum + event.points, 0);
    }

    // Legacy Support: Add points for accidents/citations if no riskEvents (or in addition if needed)
    // To transition, migrating existing accidents/citations to riskEvents would be cleaner, but for now we sum them if they aren't duplicate.
    // For this implementation, let's assume riskEvents are the primary source of truth going forward, but we keeping accidents/citations for display.
    // If riskEvents is empty but accidents exist, we count them old way? 
    // Let's make it additive for now to support both during transition.
    if (!driver.riskEvents || driver.riskEvents.length === 0) {
        score += (driver.accidents?.length || 0) * 20;
        score += (driver.citations?.length || 0) * 10;
    }


    // 2. Subtract Offsets (Coaching Plans)
    // "Coaching Plan is -5"
    // Active or Completed? Usually Completed yields full credit, but user said "Coaching Plan is -5". 
    // Let's give credit for Active plans too as an incentive? Or only Completed. stick to Completed for logic solidity.
    // Actually, user said "offset sets the points received".

    // Logic: Active Plans might reduce risk slightly? 
    // Let's stick to: Completed Plan = -5 points.
    const completedPlans = driver.coachingPlans?.filter(p => p.status === 'Completed').length || 0;
    score -= completedPlans * 5;

    // 3. Safe Driving over time
    // "-2 points per year of service"
    score -= (driver.yearsOfService * 2);

    // Clamp score
    return Math.max(0, Math.min(100, score));
};

/**
 * Generates Weekly Check-in placeholders for a new Coaching Plan
 */
export const generateCheckIns = (startDate: string, weeks: number): any[] => {
    const checks = [];
    const start = new Date(startDate);

    for (let i = 0; i < weeks; i++) {
        const checkDate = new Date(start);
        checkDate.setDate(start.getDate() + (i * 7));
        // Use local date string for simplicity in display
        const dateStr = checkDate.toISOString().split('T')[0];

        checks.push({
            week: i + 1,
            assignedTo: 'Safety Manager', // Default assignment
            status: 'Pending',
            notes: '',
            date: dateStr
        });
    }
    return checks;
};
