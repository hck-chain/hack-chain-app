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

import {
  useMyTalentProfile,
} from "@/hooks/useMyTalentProfile";

import { api } from "@/services/api";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
  },
}));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retryDelay: 0,
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
// Fixture
// ---------------------------------------------------------------------------

const profileResponse = {
  wallet_address:
    "0x97df1976597765894f49d5f1c26e9da2bb837b07",
  name: "Luis",
  lastname: "Soto",
  email: "luis@example.com",
  email_verified: true,
  field_of_study: "Ingeniería en Computación",
  bio: "Esta es una biografía suficientemente larga.",
  knowledge_areas: ["React", "TypeScript"],
  photo_url: "ipfs://QmPhoto",
  github_url: "https://github.com/luis",
  linkedin_url: "https://linkedin.com/in/luis",
  twitter_url: null,
  instagram_url: null,
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

describe("useMyTalentProfile", () => {
  it("loads the authenticated talent profile", async () => {
    vi.mocked(api.get).mockResolvedValue(profileResponse);

    const { result } = renderHook(
      () => useMyTalentProfile(),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.get).toHaveBeenCalledTimes(1);

    expect(api.get).toHaveBeenCalledWith(
      "/api/students/me",
    );

    expect(result.current.data).toEqual({
      ...profileResponse,
      walletAddress:
        profileResponse.wallet_address,
    });
  });

  it("maps wallet_address to walletAddress", async () => {
    vi.mocked(api.get).mockResolvedValue(profileResponse);

    const { result } = renderHook(
      () => useMyTalentProfile(),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.walletAddress).toBe(
      profileResponse.wallet_address,
    );

    expect(
      result.current.data,
    ).not.toHaveProperty("walletAddress", undefined);
  });

  it("preserves all profile fields returned by the API", async () => {
    vi.mocked(api.get).mockResolvedValue(profileResponse);

    const { result } = renderHook(
      () => useMyTalentProfile(),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      name: "Luis",
      lastname: "Soto",
      email: "luis@example.com",
      email_verified: true,
      field_of_study:
        "Ingeniería en Computación",
      bio: "Esta es una biografía suficientemente larga.",
      knowledge_areas: ["React", "TypeScript"],
      photo_url: "ipfs://QmPhoto",
      github_url:
        "https://github.com/luis",
      linkedin_url:
        "https://linkedin.com/in/luis",
      twitter_url: null,
      instagram_url: null,
    });
  });

  it("does not fetch the profile when disabled", async () => {
    const { result } = renderHook(
      () => useMyTalentProfile(false),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");

    expect(api.get).not.toHaveBeenCalled();
  });

  it("returns an error after the API request fails", async () => {
  vi.mocked(api.get).mockRejectedValue(
    new Error("API error"),
  );

  const { result } = renderHook(
    () => useMyTalentProfile(),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(
    () => {
      expect(result.current.isError).toBe(true);
    },
    {
      timeout: 3000,
    },
  );

  expect(result.current.error).toBeInstanceOf(Error);

  expect(result.current.error?.message).toBe(
    "API error",
  );

  expect(api.get).toHaveBeenCalledWith(
    "/api/students/me",
  );

  expect(api.get).toHaveBeenCalledTimes(2);
});


});

