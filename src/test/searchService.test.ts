import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockOrgId = vi.hoisted(() => 'org-abc');

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
  getCurrentOrganization: vi.fn().mockResolvedValue(mockOrgId),
}));

import { supabase } from '../lib/supabase';
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

// Chain order in searchService: select → ilike/or → limit → eq (org filter, always set in tests)
function buildIlikeChain(rows: object[]) {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
}

function buildErrorChain() {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
  };
}

describe('searchService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array for queries shorter than 2 characters', async () => {
    const { searchService } = await import('../services/searchService');
    expect(await searchService.search('')).toEqual([]);
    expect(await searchService.search('a')).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns driver results mapped to SearchResult shape', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'drivers') {
        return buildIlikeChain([
          { id: 'd1', full_name: 'Alice Johnson', license_number: 'CDL-001', status: 'Active' },
        ]);
      }
      return buildIlikeChain([]);
    });

    const { searchService } = await import('../services/searchService');
    const results = await searchService.search('Alice');
    const driver = results.find((r) => r.type === 'driver');

    expect(driver).toBeDefined();
    expect(driver?.title).toBe('Alice Johnson');
    expect(driver?.subtitle).toContain('CDL-001');
    expect(driver?.href).toBe('/drivers/d1');
  });

  it('returns task results mapped to SearchResult shape', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return buildIlikeChain([
          { id: 't1', title: 'Inspect brakes', status: 'Pending', priority: 'High' },
        ]);
      }
      return buildIlikeChain([]);
    });

    const { searchService } = await import('../services/searchService');
    const results = await searchService.search('Inspect');
    const task = results.find((r) => r.type === 'task');

    expect(task).toBeDefined();
    expect(task?.title).toBe('Inspect brakes');
    expect(task?.subtitle).toContain('High');
    expect(task?.href).toBe('/tasks');
  });

  it('still returns results from working sources when one source errors', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'drivers') return buildErrorChain();
      if (table === 'tasks') {
        return buildIlikeChain([
          { id: 't1', title: 'Fix lights', status: 'Pending', priority: 'Medium' },
        ]);
      }
      return buildIlikeChain([]);
    });

    const { searchService } = await import('../services/searchService');
    const results = await searchService.search('Fix');

    expect(results.some((r) => r.type === 'task')).toBe(true);
    expect(results.some((r) => r.type === 'driver')).toBe(false);
  });

  it('returns empty array when all sources error', async () => {
    mockFrom.mockImplementation(() => buildErrorChain());

    const { searchService } = await import('../services/searchService');
    const results = await searchService.search('anything');

    expect(results).toEqual([]);
  });

  it('includes equipment and document results', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'equipment') {
        return buildIlikeChain([
          { id: 'e1', name: 'Truck 101', unit_number: 'U-101', status: 'Active' },
        ]);
      }
      if (table === 'documents') {
        return buildIlikeChain([
          { id: 'doc1', name: 'CDL Renewal', document_type: 'License', status: 'Valid' },
        ]);
      }
      return buildIlikeChain([]);
    });

    const { searchService } = await import('../services/searchService');
    const results = await searchService.search('truck');

    expect(results.some((r) => r.type === 'equipment')).toBe(true);
    expect(results.some((r) => r.type === 'document')).toBe(true);
  });
});
