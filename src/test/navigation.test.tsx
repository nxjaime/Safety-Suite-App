import { describe, it, expect } from 'vitest';
import { navSections } from '../components/Layout/Sidebar';

describe('Navigation IA', () => {
  it('includes required top-level sections', () => {
    const labels = navSections.map(section => section.label);
    expect(labels).toContain('Operations');
    expect(labels).toContain('Safety');
    expect(labels).toContain('Reporting');
  });

  it('nests Fleet under Operations', () => {
    const operations = navSections.find(section => section.label === 'Operations');
    expect(operations).toBeTruthy();
    const hasFleetSubheader = operations?.items.some(item => item.type === 'subheader' && item.name === 'Fleet');
    expect(hasFleetSubheader).toBe(true);
  });

  it('includes Compliance under Safety', () => {
    const safety = navSections.find(section => section.label === 'Safety');
    expect(safety).toBeTruthy();
    const hasCompliance = safety?.items.some(item => item.type === 'link' && item.name === 'Compliance');
    expect(hasCompliance).toBe(true);
  });

  it('includes Watchlist under Safety', () => {
    const safety = navSections.find(section => section.label === 'Safety');
    expect(safety).toBeTruthy();
    const hasWatchlist = safety?.items.some(item => item.type === 'link' && item.name === 'Watchlist');
    expect(hasWatchlist).toBe(true);
  });

  it('includes Analytics under Reporting', () => {
    const reporting = navSections.find(section => section.label === 'Reporting');
    expect(reporting).toBeTruthy();
    const hasAnalytics = reporting?.items.some(item => item.type === 'link' && item.name === 'Analytics');
    expect(hasAnalytics).toBe(true);
  });

  it('includes Maintenance and Work Orders under Fleet', () => {
    const operations = navSections.find(section => section.label === 'Operations');
    expect(operations).toBeTruthy();
    const hasMaintenance = operations?.items.some(item => item.type === 'link' && item.name === 'Maintenance');
    const hasWorkOrders = operations?.items.some(item => item.type === 'link' && item.name === 'Work Orders');
    expect(hasMaintenance).toBe(true);
    expect(hasWorkOrders).toBe(true);
  });
});
