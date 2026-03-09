import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockUser = {
  id: 'user-123',
  email: 'alice@example.com',
  user_metadata: { full_name: 'Alice Smith', avatar_url: '' },
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '../lib/supabase';

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
const mockGetUser = supabase.auth.getUser as ReturnType<typeof vi.fn>;

const buildSelectChain = (data: object | null, error: object | null = null) => ({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

const buildUpdateChain = (error: object | null = null) => ({
  update: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error }),
  }),
});

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  describe('getExtendedProfile', () => {
    it('returns mapped profile when row exists', async () => {
      mockFrom.mockReturnValue(
        buildSelectChain({
          full_name: 'Alice Smith',
          title: 'Safety Manager',
          phone: '555-1234',
          location: 'Denver, CO',
          avatar_url: '',
          role: 'safety_manager',
          organization_id: 'org-abc',
        })
      );

      const { profileService } = await import('../services/profileService');
      const profile = await profileService.getExtendedProfile();

      expect(profile).not.toBeNull();
      expect(profile?.email).toBe('alice@example.com');
      expect(profile?.fullName).toBe('Alice Smith');
      expect(profile?.title).toBe('Safety Manager');
      expect(profile?.phone).toBe('555-1234');
      expect(profile?.location).toBe('Denver, CO');
      expect(profile?.organizationId).toBe('org-abc');
    });

    it('falls back to user_metadata when profile row not found', async () => {
      mockFrom.mockReturnValue(
        buildSelectChain(null, { message: 'row not found' })
      );

      const { profileService } = await import('../services/profileService');
      const profile = await profileService.getExtendedProfile();

      expect(profile?.email).toBe('alice@example.com');
      expect(profile?.fullName).toBe('Alice Smith');
      expect(profile?.organizationId).toBeNull();
    });

    it('returns null when no authenticated user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      mockFrom.mockReturnValue(buildSelectChain(null));

      const { profileService } = await import('../services/profileService');
      const profile = await profileService.getExtendedProfile();

      expect(profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('calls supabase update with mapped columns', async () => {
      const chain = buildUpdateChain(null);
      mockFrom.mockReturnValue(chain);

      const { profileService } = await import('../services/profileService');
      await profileService.updateProfile({
        fullName: 'Alice Updated',
        title: 'Fleet Manager',
        phone: '555-9999',
        location: 'Austin, TX',
        avatarUrl: '',
      });

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Alice Updated',
          title: 'Fleet Manager',
          phone: '555-9999',
          location: 'Austin, TX',
        })
      );
    });

    it('throws when supabase returns an error', async () => {
      mockFrom.mockReturnValue(buildUpdateChain({ message: 'DB error' }));

      const { profileService } = await import('../services/profileService');
      await expect(profileService.updateProfile({ fullName: 'X' })).rejects.toThrow('DB error');
    });

    it('throws when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { profileService } = await import('../services/profileService');
      await expect(profileService.updateProfile({ fullName: 'X' })).rejects.toThrow('Not authenticated');
    });
  });
});
