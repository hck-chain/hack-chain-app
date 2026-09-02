import React from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import EditTalentProfile from "@/pages/EditTalentProfile";

import { useMyTalentProfile } from "@/hooks/useMyTalentProfile";

import {
  useUpdateTalentProfile,
  useUpdateTalentPhoto,
  useDeleteTalentPhoto,
} from "@/hooks/useUpdateTalentProfile";

import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
const mockToast = vi.fn();

const mockUpdateProfile = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockUpdatePhoto = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockDeletePhoto = {
  mutateAsync: vi.fn(),
  isPending: false,
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/hooks/useMyTalentProfile", () => ({
  useMyTalentProfile: vi.fn(),
}));

vi.mock("@/hooks/useUpdateTalentProfile", () => ({
  useUpdateTalentProfile: vi.fn(),
  useUpdateTalentPhoto: vi.fn(),
  useDeleteTalentPhoto: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
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
      section: createMotionComponent("section"),
    },
    useReducedMotion: () => true,
  };
});

vi.mock("lucide-react", () => {
  const Icon = () => <span data-testid="mock-icon" />;

  return {
    ArrowLeft: Icon,
    Camera: Icon,
    Loader2: Icon,
    Github: Icon,
    Linkedin: Icon,
    Twitter: Icon,
    Instagram: Icon,
    X: Icon,
    ExternalLink: Icon,
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

// ---------------------------------------------------------------------------
// UI mocks
// ---------------------------------------------------------------------------

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (
    props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  ) => <textarea {...props} />,
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

vi.mock(
  "@/components/KnowledgeAreasSelector/KnowledgeAreasSelector",
  () => ({
    KnowledgeAreasSelector: ({
      selected,
      onChange,
      disabled,
    }: {
      selected: string[];
      onChange: (areas: string[]) => void;
      disabled?: boolean;
    }) => (
      <div data-testid="knowledge-areas-selector">
        <div data-testid="selected-areas">
          {selected.join(",")}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...selected, "React"])}
        >
          Add React
        </button>
      </div>
    ),
  }),
);

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),

  DropdownMenuTrigger: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  DropdownMenuContent: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div data-testid="alert-dialog">{children}</div> : null),

  AlertDialogContent: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  AlertDialogHeader: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  AlertDialogFooter: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  AlertDialogTitle: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <h2>{children}</h2>,

  AlertDialogDescription: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  AlertDialogCancel: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),

  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const wallet =
  "0x97df1976597765894f49d5f1c26e9da2bb837b07";

const profile = {
  walletAddress: wallet,
  name: "Luis",
  lastname: "Soto",
  email: "luis@example.com",
  email_verified: true,
  field_of_study: "Ingeniería en Computación",
  bio: "Esta es una biografía suficientemente larga para completar el perfil.",
  knowledge_areas: ["React", "TypeScript"],
  photo_url: "ipfs://QmPhoto",
  github_url: "https://github.com/luis",
  linkedin_url: "https://linkedin.com/in/luis",
  twitter_url: "",
  instagram_url: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockProfile(overrides = {}) {
  vi.mocked(useMyTalentProfile).mockReturnValue({
    data: {
      ...profile,
      ...overrides,
    },
    isPending: false,
    isError: false,
  } as any);
}

function mockIncompleteProfile(overrides = {}) {
  mockProfile({
    name: "",
    bio: "",
    knowledge_areas: [],
    photo_url: null,
    ...overrides,
  });
}

function renderComponent() {
  return render(<EditTalentProfile />);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockNavigate.mockReset();
  mockToast.mockReset();

  mockUpdateProfile.mutateAsync.mockResolvedValue({});
  mockUpdatePhoto.mutateAsync.mockResolvedValue(
    "ipfs://QmNewPhoto",
  );
  mockDeletePhoto.mutateAsync.mockResolvedValue({});

  vi.mocked(useToast).mockReturnValue({
    toast: mockToast,
  } as any);

  vi.mocked(useUpdateTalentProfile).mockReturnValue(
    mockUpdateProfile as any,
  );

  vi.mocked(useUpdateTalentPhoto).mockReturnValue(
    mockUpdatePhoto as any,
  );

  vi.mocked(useDeleteTalentPhoto).mockReturnValue(
    mockDeletePhoto as any,
  );

  mockProfile();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EditTalentProfile", () => {
  it("renders the profile data loaded from the API", async () => {
    renderComponent();

    expect(
      await screen.findByDisplayValue(
        "Ingeniería en Computación",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue(
        "Esta es una biografía suficientemente larga para completar el perfil.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue(
        "https://github.com/luis",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue(
        "https://linkedin.com/in/luis",
      ),
    ).toBeInTheDocument();
  });

  it("initializes the knowledge areas from the profile", () => {
    renderComponent();

    expect(
      screen.getByTestId("selected-areas"),
    ).toHaveTextContent("React,TypeScript");
  });

  it("allows editing the field of study", () => {
    renderComponent();

    const input = screen.getByDisplayValue(
      "Ingeniería en Computación",
    );

    fireEvent.change(input, {
      target: {
        value: "Ingeniería de Software",
      },
    });

    expect(
      screen.getByDisplayValue(
        "Ingeniería de Software",
      ),
    ).toBeInTheDocument();
  });

  it("allows editing the bio", () => {
    renderComponent();

    const textarea = screen.getByDisplayValue(
      "Esta es una biografía suficientemente larga para completar el perfil.",
    );

    fireEvent.change(textarea, {
      target: {
        value: "Nueva descripción profesional",
      },
    });

    expect(
      screen.getByDisplayValue(
        "Nueva descripción profesional",
      ),
    ).toBeInTheDocument();
  });

  it("allows adding a knowledge area", () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add React",
      }),
    );

    expect(
      screen.getByTestId("selected-areas"),
    ).toHaveTextContent("React,TypeScript,React");
  });

  it("shows the loading state while the profile is loading", () => {
    vi.mocked(useMyTalentProfile).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as any);

    renderComponent();

    expect(
      screen.getByTestId("layout"),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("mock-icon"),
    ).toBeInTheDocument();
  });

  it("rejects invalid social URLs before saving", () => {
    renderComponent();

    const githubInput = screen.getByDisplayValue(
      "https://github.com/luis",
    );

    fireEvent.change(githubInput, {
      target: {
        value: "github.com/luis",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.saveBtn",
      }),
    );

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "editProfile.errorTitle",
        description: "editProfile.invalidUrl",
        variant: "destructive",
      }),
    );

    expect(
      mockUpdateProfile.mutateAsync,
    ).not.toHaveBeenCalled();
  });

  it("opens the incomplete profile dialog when required sections are missing", () => {
    mockIncompleteProfile();

    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.saveBtn",
      }),
    );

    expect(
      screen.getByTestId("alert-dialog"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("editProfile.missingDialogTitle"),
    ).toBeInTheDocument();
  });

  it("saves an incomplete profile when choosing save anyway", async () => {
    mockIncompleteProfile();

    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.saveBtn",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.saveAnyway",
      }),
    );

    await waitFor(() => {
      expect(
        mockUpdateProfile.mutateAsync,
      ).toHaveBeenCalled();
    });
  });

  it("saves the profile when all required information is complete", async () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.saveBtn",
      }),
    );

    await waitFor(() => {
      expect(
        mockUpdateProfile.mutateAsync,
      ).toHaveBeenCalledWith({
        bio: profile.bio,
        field_of_study: profile.field_of_study,
        knowledge_areas: profile.knowledge_areas,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
        twitter_url: null,
        instagram_url: null,
      });
    });
  });

  it("shows success toast after saving", async () => {
  const user = userEvent.setup();

  mockUpdateProfile.mutateAsync.mockResolvedValue(undefined);

  renderComponent();

  await screen.findByDisplayValue(
    "https://linkedin.com/in/luis",
  );

  await user.click(
    screen.getByRole("button", {
      name: /editProfile\.saveBtn/i,
    }),
  );

  await waitFor(() => {
    expect(
      mockUpdateProfile.mutateAsync,
    ).toHaveBeenCalledTimes(1);
  });

  expect(mockToast).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "Perfil guardado",
      description: "editProfile.savedDesc",
      variant: "success",
    }),
  );
});

  it("navigates to the talent dashboard after saving a verified profile", async () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.saveBtn",
      }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/talent",
      );
    });
  });

  it("navigates to email verification after saving an unverified profile", async () => {
    mockProfile({
      email_verified: false,
    });

    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.saveBtn",
      }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/verify-email",
      );
    });
  });

  it("shows an error toast when saving fails", async () => {
    mockUpdateProfile.mutateAsync.mockRejectedValue(
      new Error("API error"),
    );

    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.saveBtn",
      }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "editProfile.errorTitle",
          description: "API error",
          variant: "destructive",
        }),
      );
    });
  });

  it("deletes the photo when saving after marking it for deletion", async () => {
  const user = userEvent.setup();

  mockDeletePhoto.mutateAsync.mockResolvedValue(undefined);
  mockUpdateProfile.mutateAsync.mockResolvedValue(undefined);

  renderComponent();

  await screen.findByDisplayValue(
    "https://linkedin.com/in/luis",
  );

  await user.click(
    screen.getByRole("button", {
      name: /editProfile\.removePhoto/i,
    }),
  );

  await user.click(
    screen.getByRole("button", {
      name: /editProfile\.saveBtn/i,
    }),
  );

  // Removing the photo makes the profile incomplete,
  // so the confirmation dialog must appear.
  expect(
    screen.getByTestId("alert-dialog"),
  ).toBeInTheDocument();

  await user.click(
    screen.getByRole("button", {
      name: /editProfile\.saveAnyway/i,
    }),
  );

  await waitFor(() => {
    expect(
      mockDeletePhoto.mutateAsync,
    ).toHaveBeenCalledTimes(1);
  });

  expect(
    mockUpdateProfile.mutateAsync,
  ).toHaveBeenCalledTimes(1);

  expect(mockToast).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "Perfil guardado",
      description: "editProfile.savedDesc",
      variant: "success",
    }),
  );
});


it("shows an error toast when deleting the photo fails", async () => {
  const user = userEvent.setup();

  mockDeletePhoto.mutateAsync.mockRejectedValue(
    new Error("Delete failed"),
  );

  mockProfile({
    bio: "",
  });

  renderComponent();

  await screen.findByDisplayValue(
    "https://linkedin.com/in/luis",
  );

  // Mark the photo for deletion.
  await user.click(
    screen.getByRole("button", {
      name: /editProfile\.removePhoto/i,
    }),
  );

  // Save the profile.
  await user.click(
    screen.getByRole("button", {
      name: /editProfile\.saveBtn/i,
    }),
  );

  // The incomplete profile dialog should appear.
  await screen.findByTestId("alert-dialog");

  // Confirm saving anyway.
  await user.click(
    screen.getByRole("button", {
      name: /editProfile\.saveAnyway/i,
    }),
  );

  // Verify that the deletion request was attempted.
  await waitFor(() => {
    expect(
      mockDeletePhoto.mutateAsync,
    ).toHaveBeenCalledTimes(1);
  });

  // Verify that the error toast was displayed.
  await waitFor(() => {
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "editProfile.errorTitle",
        description: "Delete failed",
        variant: "destructive",
      }),
    );
  });
});




  it("navigates to the public profile from the wallet section", () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "editProfile.viewPublicProfile",
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      `/talent/${wallet}`,
    );
  });

  it("navigates to the dashboard when clicking back", () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: /editProfile\.backToDashboard|volver/i,
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      "/dashboard/talent",
    );
  });
});

