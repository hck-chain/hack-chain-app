import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRecruiterDashboard } from '@/hooks/useRecruiterDashboard';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useRecruiterDashboard', () => {
  it('loads recruiter and talents', async () => {
    mockedApi.get
      .mockResolvedValueOnce({
        user: {
          wallet_address: '0x123',
          name: 'Luis',
          role: 'Recruiter',
        },
      })
      .mockResolvedValueOnce({
        students: [
          {
            id: 1,
            wallet_address: '0xabc',
            field_of_study: 'Computer Science',
            created_at: '2026-01-01',
            total_certificates: 2,
            user: {
              is_active: true,
              name: 'Ada',
              lastname: 'Lovelace',
            },
          },
        ],
      });

    const { result } = renderHook(() => useRecruiterDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(false);

    expect(result.current.recruiter).toEqual({
      wallet_address: '0x123',
      name: 'Luis',
      role: 'Recruiter',
      total_talents: 1,
    });

    expect(result.current.talents).toHaveLength(1);
  });
});

it('sorts talents by created_at descending', async () => {
  mockedApi.get
    .mockResolvedValueOnce({
      user: {
        wallet_address: '0x123',
        name: 'Luis',
        role: 'Recruiter',
      },
    })
    .mockResolvedValueOnce({
      students: [
        {
          id: 1,
          wallet_address: 'old',
          field_of_study: 'Math',
          created_at: '2024-01-01',
          total_certificates: 0,
          user: {
            is_active: true,
            name: 'Old',
            lastname: '',
          },
        },
        {
          id: 2,
          wallet_address: 'new',
          field_of_study: 'CS',
          created_at: '2025-01-01',
          total_certificates: 0,
          user: {
            is_active: true,
            name: 'New',
            lastname: '',
          },
        },
      ],
    });

  const { result } = renderHook(() => useRecruiterDashboard());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.talents[0].wallet_address).toBe('new');
  expect(result.current.talents[1].wallet_address).toBe('old');
});

it('returns an empty talents list', async () => {
  mockedApi.get
    .mockResolvedValueOnce({
      user: {
        wallet_address: '0x123',
        name: 'Luis',
        role: 'Recruiter',
      },
    })
    .mockResolvedValueOnce({
      students: [],
    });

  const { result } = renderHook(() => useRecruiterDashboard());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.talents).toEqual([]);

  expect(result.current.recruiter?.total_talents).toBe(0);
});

it('uses "N/A" when field_of_study is missing', async () => {
  mockedApi.get
    .mockResolvedValueOnce({
      user: {
        wallet_address: '0x123',
        name: 'Luis',
        role: 'Recruiter',
      },
    })
    .mockResolvedValueOnce({
      students: [
        {
          id: 1,
          wallet_address: '0xabc',
          field_of_study: '',
          created_at: '2026-01-01',
          total_certificates: 0,
          user: {
            is_active: true,
            name: 'Ada',
            lastname: '',
          },
        },
      ],
    });

  const { result } = renderHook(() => useRecruiterDashboard());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.talents[0].field_of_study).toBe('N/A');
});

it('sets error when loading fails', async () => {
  mockedApi.get.mockRejectedValue(new Error('Network Error'));

  const { result } = renderHook(() => useRecruiterDashboard());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.error).toBe(true);

  expect(result.current.recruiter).toBeNull();

  expect(result.current.talents).toEqual([]);
});
