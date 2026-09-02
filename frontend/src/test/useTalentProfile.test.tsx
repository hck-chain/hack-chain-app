import React from "react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  renderHook,
  waitFor,
} from "@testing-library/react";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { useTalentProfile } from "@/hooks/useTalentProfile";

import { api } from "@/services/api";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/services/api", () => ({
  api: {
    getPublic: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const wallet =
  "0x97df1976597765894f49d5f1c26e9da2bb837b07";

const publicProfileResponse = {
  student: {
    field_of_study: "Ingeniería en Computación",
    total_certificates: 5,
    photo_url: "ipfs://QmPhoto",
  },
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useTalentProfile", () => {
 it("loads the public talent profile", async () => {
  vi.mocked(api.getPublic).mockResolvedValue(
    publicProfileResponse,
  );

  const { result } = renderHook(
    () => useTalentProfile(wallet),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(api.getPublic).toHaveBeenCalledTimes(1);

  expect(api.getPublic).toHaveBeenCalledWith(
    `/api/students/${wallet}/public`,
  );

  expect(result.current.data).toEqual({
    field_of_study: "Ingeniería en Computación",
    total_certificates: 5,
    photo_url: "ipfs://QmPhoto",
  });
});

it("preserves all public profile fields", async () => {
  vi.mocked(api.getPublic).mockResolvedValue(
    publicProfileResponse,
  );

  const { result } = renderHook(
    () => useTalentProfile(wallet),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toEqual({
    field_of_study: "Ingeniería en Computación",
    total_certificates: 5,
    photo_url: "ipfs://QmPhoto",
  });
});

  it("does not fetch when wallet is missing", () => {
    const { result } = renderHook(
      () => useTalentProfile(),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");

    expect(api.getPublic).not.toHaveBeenCalled();
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(
      () => useTalentProfile(wallet, false),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");

    expect(api.getPublic).not.toHaveBeenCalled();
  });

  it("returns an error when the public profile request fails", async () => {
    vi.mocked(api.getPublic).mockImplementation(
      async () => {
        throw new Error("Public profile error");
      },
    );

    const { result } = renderHook(
      () => useTalentProfile(wallet),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);

    expect(
      result.current.error?.message,
    ).toBe("Public profile error");

    expect(api.getPublic).toHaveBeenCalledWith(
      `/api/students/${wallet}/public`,
    );
  });
});
