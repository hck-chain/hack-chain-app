import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TalentProfile from "@/pages/TalentProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useTalentProfile } from "@/hooks/useTalentProfile";
import { useMyTalentProfile } from "@/hooks/useMyTalentProfile";
import { api } from "@/services/api";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock("react-router-dom", () => ({
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useTalentProfile", () => ({
  useTalentProfile: vi.fn(),
}));

vi.mock("@/hooks/useMyTalentProfile", () => ({
  useMyTalentProfile: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    registerProfileStudentsShare: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock("framer-motion", () => {
  const createMotionComponent =
    (Component: keyof React.JSX.IntrinsicElements) =>
    ({ children, ...props }: any) => {
      const {
        initial,
        animate,
        exit,
        variants,
        transition,
        whileHover,
        whileTap,
        whileInView,
        layout,
        layoutId,
        viewport,
        ...domProps
      } = props;

      return React.createElement(Component, domProps, children);
    };

  return {
    motion: {
      main: createMotionComponent("main"),
      div: createMotionComponent("div"),
      article: createMotionComponent("article"),
    },
    useReducedMotion: () => true,
  };
});
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("@/components/profile/GrainOverlay", () => ({
  GrainOverlay: () => <div data-testid="grain-overlay" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar">{children}</div>
  ),

  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),

  AvatarImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

vi.mock("@/components/ShareButton", () => ({
  ShareButton: ({
    displayName,
    onShare,
  }: {
    displayName: string;
    onShare?: () => void;
  }) => (
    <button
      type="button"
      data-testid="share-button"
      onClick={onShare}
    >
      Compartir {displayName}
    </button>
  ),
}));

vi.mock("@/lib/ipfs", () => ({
  resolveIpfs: (url: string) => url,
}));

vi.mock("lucide-react", () => {
  const Icon = ({ children = "icon" }: { children?: React.ReactNode }) => (
    <span data-testid="mock-icon">{children}</span>
  );

  return {
    ArrowLeft: Icon,
    BadgeCheck: Icon,
    Linkedin: Icon,
    Twitter: Icon,
    Instagram: Icon,
    Github: Icon,
    ExternalLink: Icon,
    ShieldCheck: Icon,
  };
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const wallet = "0x97df1976597765894f49d5f1c26e9da2bb837b07";

const ownTalent = {
  walletAddress: wallet,
  name: "Luis",
  lastname: "Soto",
  email: "luis@example.com",
  email_verified: true,
  field_of_study: "Ingeniería en Computación",
  bio: "Frontend developer",
  knowledge_areas: ["React", "TypeScript"],
  photo_url: null,
  github_url: "https://github.com/luis",
  linkedin_url: "https://linkedin.com/in/luis",
  twitter_url: null,
  instagram_url: null,
};

const publicTalent = {
  field_of_study: "Ingeniería en Computación",
  total_certificates: 3,
  photo_url: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockOwnProfile() {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      role: "student",
      walletAddress: wallet,
    },
  } as any);

  vi.mocked(useMyTalentProfile).mockReturnValue({
    data: ownTalent,
    isPending: false,
    isError: false,
  } as any);

  vi.mocked(useTalentProfile).mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
  } as any);
}

function mockPublicProfile() {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
  } as any);

  vi.mocked(useMyTalentProfile).mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
  } as any);

  vi.mocked(useTalentProfile).mockReturnValue({
    data: publicTalent,
    isPending: false,
    isError: false,
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();

  mockUseParams.mockReturnValue({
    wallet,
  });

  mockOwnProfile();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TalentProfile", () => {
  it("uses the private profile endpoint when viewing its own profile", () => {
    render(<TalentProfile />);

    expect(useMyTalentProfile).toHaveBeenCalledWith(true);
    expect(useTalentProfile).toHaveBeenCalledWith(wallet, false);
  });

  it("uses the public profile endpoint when viewing another profile", () => {
    mockPublicProfile();

    render(<TalentProfile />);

    expect(useMyTalentProfile).toHaveBeenCalledWith(false);
    expect(useTalentProfile).toHaveBeenCalledWith(wallet, true);
  });

  it("renders the complete data of the authenticated user's own profile", () => {
    render(<TalentProfile />);

    expect(screen.getByText("Luis Soto")).toBeInTheDocument();
    expect(
      screen.getByText("Ingeniería en Computación"),
    ).toBeInTheDocument();
    expect(screen.getByText("Frontend developer")).toBeInTheDocument();

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /github.com\/luis/i,
      }),
    ).toHaveAttribute("href", "https://github.com/luis");

    expect(
      screen.getByRole("link", {
        name: /linkedin.com\/in\/luis/i,
      }),
    ).toHaveAttribute("href", "https://linkedin.com/in/luis");

    expect(
      screen.getByRole("button", {
        name: /Wallet:/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders only public data for a visitor", () => {
    mockPublicProfile();

    render(<TalentProfile />);

    expect(screen.getByText("Talento")).toBeInTheDocument();
    expect(
      screen.getByText("Ingeniería en Computación"),
    ).toBeInTheDocument();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByText("talentProfile.certificatesEarnedLabel"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Frontend developer"),
    ).not.toBeInTheDocument();

    expect(screen.queryByText("React")).not.toBeInTheDocument();
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /Wallet:/i,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: /github\.com/i,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: /linkedin\.com/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the public certificate count", () => {
    mockPublicProfile();

    render(<TalentProfile />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not render the certificate statistic for the private profile", () => {
    render(<TalentProfile />);

    expect(
      screen.queryByText("talentProfile.certificatesEarnedLabel"),
    ).not.toBeInTheDocument();
  });

  it("renders the loading state", () => {
    vi.mocked(useMyTalentProfile).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as any);

    render(<TalentProfile />);

    expect(
      screen.getByLabelText("Cargando perfil..."),
    ).toBeInTheDocument();
  });

  it("renders the error state", () => {
    vi.mocked(useMyTalentProfile).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as any);

    render(<TalentProfile />);

    expect(
      screen.getByText("talentProfile.talentNotFound"),
    ).toBeInTheDocument();
  });

  it("renders the error state when the public profile request fails", () => {
    mockPublicProfile();

    vi.mocked(useTalentProfile).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as any);

    render(<TalentProfile />);

    expect(
      screen.getByText("talentProfile.talentNotFound"),
    ).toBeInTheDocument();
  });

  it("navigates back when clicking the back button", () => {
  render(<TalentProfile />);

  fireEvent.click(
    screen.getByRole("button", {
      name: /Volver|back/i,
    }),
  );

  expect(mockNavigate).toHaveBeenCalledWith(-1);
});

  it("uses the profile wallet to register a share", () => {
    render(<TalentProfile />);

    fireEvent.click(screen.getByTestId("share-button"));

    expect(api.registerProfileStudentsShare).toHaveBeenCalledWith(wallet);
  });

  it("uses the URL wallet for sharing a public profile", () => {
    mockPublicProfile();

    render(<TalentProfile />);

    fireEvent.click(screen.getByTestId("share-button"));

    expect(api.registerProfileStudentsShare).toHaveBeenCalledWith(wallet);
  });

  it("renders the fallback when the own profile has no bio", () => {
    vi.mocked(useMyTalentProfile).mockReturnValue({
      data: {
        ...ownTalent,
        bio: null,
      },
      isPending: false,
      isError: false,
    } as any);

    render(<TalentProfile />);

    expect(
      screen.getByText("talentProfile.noBio"),
    ).toBeInTheDocument();
  });

  it("does not render knowledge areas when the own profile has none", () => {
    vi.mocked(useMyTalentProfile).mockReturnValue({
      data: {
        ...ownTalent,
        knowledge_areas: [],
      },
      isPending: false,
      isError: false,
    } as any);

    render(<TalentProfile />);

    expect(screen.queryByText("React")).not.toBeInTheDocument();
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
  });

  it("renders the profile photo when one is available", () => {
    vi.mocked(useMyTalentProfile).mockReturnValue({
      data: {
        ...ownTalent,
        photo_url: "ipfs://QmProfilePhoto",
      },
      isPending: false,
      isError: false,
    } as any);

    render(<TalentProfile />);

    expect(screen.getByRole("img", { name: "Luis Soto" })).toHaveAttribute(
      "src",
      "ipfs://QmProfilePhoto",
    );
  });

  it("renders the fallback avatar when the profile has no photo", () => {
    render(<TalentProfile />);

    expect(screen.getByTestId("avatar-fallback")).toBeInTheDocument();
    expect(screen.getByText("LS")).toBeInTheDocument();
  });
});

