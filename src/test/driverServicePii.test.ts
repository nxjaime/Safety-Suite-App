import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
    },
    from: mockFrom,
  },
  getCurrentOrganization: vi.fn().mockResolvedValue(null),
}));

vi.mock('../services/encryptionService', () => ({
  encryptPII: vi.fn().mockResolvedValue('encrypted-ssn'),
  decryptPII: vi.fn().mockRejectedValue(new Error('edge unavailable')),
}));

describe('driverService PII resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'driver-1',
          name: 'QA Driver',
          ssn: 'encrypted-blob',
          risk_score: 42,
        },
      ],
      error: null,
    });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('loads drivers with SSN redacted when Edge decrypt is unavailable', async () => {
    const { driverService } = await import('../services/driverService');

    const drivers = await driverService.fetchDrivers();

    expect(drivers).toHaveLength(1);
    expect(drivers[0]).toMatchObject({
      id: 'driver-1',
      name: 'QA Driver',
      ssn: '',
      ssnRedacted: true,
      riskScore: 42,
    });
  });
});
