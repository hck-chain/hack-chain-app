import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VacancyForm } from "@/components/jobs/VacancyForm";
import type { Vacancy } from "@/types/vacancy";

/* -------------------------------------------------------------------------- */
/* Mocks                                                                      */
/* -------------------------------------------------------------------------- */

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "vacancyRecruiter.editingVacancy": "Editando vacante",
        "vacancyRecruiter.salaryLocked":
          "El salario no puede modificarse porque ya existen postulaciones.",

        "vacancyRecruiter.fields.position": "Puesto",
        "vacancyRecruiter.fields.company": "Empresa",
        "vacancyRecruiter.fields.area": "Área",
        "vacancyRecruiter.fields.modality": "Modalidad",
        "vacancyRecruiter.fields.closingDate": "Fecha de cierre",

        "vacancyRecruiter.fields.salaryMin": "Salario mínimo",
        "vacancyRecruiter.fields.salaryMax": "Salario máximo",
        "vacancyRecruiter.fields.currency": "Moneda",
        "vacancyRecruiter.fields.period": "Periodo",

        "vacancyRecruiter.fields.country": "País",
        "vacancyRecruiter.fields.city": "Ciudad",

        "vacancyRecruiter.fields.description": "Descripción",
        "vacancyRecruiter.fields.requirements": "Requisitos",
        "vacancyRecruiter.requirementsHint": "(un requisito por línea)",

        "vacancyRecruiter.cancel": "Cancelar",
        "vacancyRecruiter.saveChanges": "Guardar cambios",
        "vacancyRecruiter.publish": "Publicar",
      };

      return translations[key] ?? key;
    },
  }),
}));

vi.mock("lucide-react", () => ({
  Lock: (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="lock-icon" {...props} />
  ),
  AlertCircle: (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="alert-circle-icon" {...props} />
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant: _variant,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
  }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/select", () => {
  const SelectTrigger = ({
    children,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      data-testid="select-trigger"
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );

  const Select = ({
    children,
    disabled,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="select" data-disabled={disabled ? "true" : "false"}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            disabled,
          });
        }

        return child;
      })}
    </div>
  );

  const SelectValue = () => <span data-testid="select-value" />;

  const SelectContent = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const SelectItem = ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <button type="button" data-testid={`select-item-${value}`}>
      {children}
    </button>
  );

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

vi.mock("@/components/jobs/JobPrimitives", () => ({
  LABELS: {
    frontend: "Frontend",
    backend: "Backend",
    fullstack: "Fullstack",
    mobile: "Mobile",
    data: "Data",
    devops: "DevOps",
    cloud: "Cloud",
    ciberseguridad: "Ciberseguridad",
    blockchain: "Blockchain",
    qa: "QA",
    diseno: "Diseño",
    producto: "Producto",
    soporte: "Soporte",
    remoto: "Remoto",
    presencial: "Presencial",
    hibrido: "Híbrido",
  },
}));

/* -------------------------------------------------------------------------- */
/* Test data                                                                  */
/* -------------------------------------------------------------------------- */

const getFutureDate = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);

  return date.toISOString().split("T")[0];
};



const vacancy: Vacancy = {
  id: "v1",
  slug: "frontend-engineer",
  position: "Frontend Engineer",
  company: "HackChain",
  area: "frontend",
  modality: "remoto",
  country: "México",
  city: "Ciudad de México",
  salary_min: "1000",
  salary_max: "2000",
  salary_currency: "USD",
  salary_period: "mes",
  closing_date: getFutureDate(30),
  days_to_close: 30,
  status: "abierta",
  published_at: "2026-09-01",
  description: "Construir interfaces modernas.",
  requirements: ["React", "TypeScript"],
};

const vacancyWithApplications: Vacancy = {
  ...vacancy,
  applications_count: 3,
};

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe("VacancyForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el formulario de creación con valores iniciales", () => {
    render(<VacancyForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Puesto")).toHaveValue("");
    expect(screen.getByLabelText("Empresa")).toHaveValue("");
    const expectedClosingDate = new Date();
    expectedClosingDate.setDate(expectedClosingDate.getDate() + 30);

    const year = expectedClosingDate.getFullYear();
    const month = String(expectedClosingDate.getMonth() + 1).padStart(2, "0");
    const day = String(expectedClosingDate.getDate()).padStart(2, "0");

    expect(screen.getByLabelText("Fecha de cierre")).toHaveValue(
      `${year}-${month}-${day}`,
    );

    expect(screen.getByLabelText("Salario mínimo")).toHaveValue(0);
    expect(screen.getByLabelText("Salario máximo")).toHaveValue(0);
    expect(screen.getByLabelText("Moneda")).toHaveValue("USD");

    expect(screen.getByLabelText("Descripción")).toHaveValue("");
    const textareas = screen.getAllByRole("textbox");

    expect(textareas[textareas.length - 1]).toHaveValue("");

    expect(
      screen.getByRole("button", { name: "Publicar" }),
    ).toBeInTheDocument();
  });

  it("carga correctamente los datos de una vacante existente", () => {
    render(<VacancyForm vacancy={vacancy} onSubmit={vi.fn()} />);

    expect(screen.getByText("Editando vacante")).toBeInTheDocument();

    expect(screen.getByLabelText("Puesto")).toHaveValue("Frontend Engineer");

    expect(screen.getByLabelText("Empresa")).toHaveValue("HackChain");

    expect(screen.getByLabelText("País")).toHaveValue("México");

    expect(screen.getByLabelText("Ciudad")).toHaveValue("Ciudad de México");

    expect(screen.getByLabelText("Salario mínimo")).toHaveValue(1000);

    expect(screen.getByLabelText("Salario máximo")).toHaveValue(2000);

    expect(screen.getByLabelText("Moneda")).toHaveValue("USD");

    expect(screen.getByLabelText("Fecha de cierre")).toHaveValue(
      vacancy.closing_date,
    );

    expect(screen.getByLabelText("Descripción")).toHaveValue(
      "Construir interfaces modernas.",
    );

    const textareas = screen.getAllByRole("textbox");

    expect(textareas[textareas.length - 1]).toHaveValue("React\nTypeScript");

    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument();
  });

  it("permite editar los campos principales", async () => {
    const user = userEvent.setup();

    render(<VacancyForm onSubmit={vi.fn()} />);

    const position = screen.getByLabelText("Puesto");
    const company = screen.getByLabelText("Empresa");
    const description = screen.getByLabelText("Descripción");

    await user.type(position, "Backend Developer");
    await user.type(company, "Tech Company");
    await user.type(description, "Nueva descripción");

    expect(position).toHaveValue("Backend Developer");
    expect(company).toHaveValue("Tech Company");
    expect(description).toHaveValue("Nueva descripción");
  });

  it("permite escribir requisitos en múltiples líneas", async () => {
    const user = userEvent.setup();

    render(<VacancyForm onSubmit={vi.fn()} />);

    const textareas = screen.getAllByRole("textbox");
    const requirements = textareas[textareas.length - 1];

    await user.type(requirements, "React\nTypeScript\nJavaScript");

    expect(requirements).toHaveValue("React\nTypeScript\nJavaScript");
  });

  it("envía los requisitos separados por línea como arreglo", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<VacancyForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Puesto"), "Frontend Developer");

    await user.type(screen.getByLabelText("Empresa"), "HackChain");

    await user.type(
      screen.getByLabelText("Descripción"),
      "Descripción de prueba",
    );

    const textareas = screen.getAllByRole("textbox");
    const requirements = textareas[textareas.length - 1];

    await user.type(requirements, "React\n TypeScript \n\n JavaScript");
    fireEvent.change(screen.getByLabelText("Fecha de cierre"), {
      target: {
        value: getFutureDate(30),
      },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: "Publicar" }).closest("form")!,
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0];

    expect(payload).toMatchObject({
      position: "Frontend Developer",
      company: "HackChain",
      description: "Descripción de prueba",
      closing_date: getFutureDate(30),
      requirements: ["React", "TypeScript", "JavaScript"],
    });
  });

  it("envía todos los campos salariales al crear una vacante", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<VacancyForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Puesto"), "Frontend Developer");

    await user.type(screen.getByLabelText("Empresa"), "HackChain");

    fireEvent.change(screen.getByLabelText("Salario mínimo"), {
      target: {
        value: "1500",
      },
    });

    fireEvent.change(screen.getByLabelText("Salario máximo"), {
      target: {
        value: "2500",
      },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: "Publicar" }).closest("form")!,
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0];

    expect(payload).toMatchObject({
      salary_min: 1500,
      salary_max: 2500,
      salary_currency: "USD",
      salary_period: "mes",
    });
  });

  it("bloquea todos los campos salariales cuando existen postulaciones", () => {
    render(
      <VacancyForm vacancy={vacancyWithApplications} onSubmit={vi.fn()} />,
    );

    expect(screen.getByLabelText("Salario mínimo")).toBeDisabled();

    expect(screen.getByLabelText("Salario máximo")).toBeDisabled();

    expect(screen.getByLabelText("Moneda")).toBeDisabled();

    const selectTriggers = screen.getAllByTestId("select-trigger");

    const selects = screen.getAllByTestId("select");

    expect(
      selects.some((select) => select.getAttribute("data-disabled") === "true"),
    ).toBe(true);

    expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
  });

  it("no envía campos salariales al editar una vacante con postulaciones", async () => {
    const onSubmit = vi.fn();

    render(
      <VacancyForm vacancy={vacancyWithApplications} onSubmit={onSubmit} />,
    );

    fireEvent.submit(
      screen.getByRole("button", { name: "Guardar cambios" }).closest("form")!,
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0];

    expect(payload).toMatchObject({
      position: "Frontend Engineer",
      company: "HackChain",
      area: "frontend",
      modality: "remoto",
      country: "México",
      city: "Ciudad de México",
      description: "Construir interfaces modernas.",
      requirements: ["React", "TypeScript"],
      closing_date: vacancy.closing_date,
    });

    expect(payload).not.toHaveProperty("salary_min");
    expect(payload).not.toHaveProperty("salary_max");
    expect(payload).not.toHaveProperty("salary_currency");
    expect(payload).not.toHaveProperty("salary_period");
  });

  it("mantiene los campos salariales habilitados cuando no existen postulaciones", () => {
    render(<VacancyForm vacancy={vacancy} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Salario mínimo")).not.toBeDisabled();

    expect(screen.getByLabelText("Salario máximo")).not.toBeDisabled();

    expect(screen.getByLabelText("Moneda")).not.toBeDisabled();
  });

  it("convierte la moneda a mayúsculas", async () => {
    const user = userEvent.setup();

    render(<VacancyForm onSubmit={vi.fn()} />);

    const currency = screen.getByLabelText("Moneda");

    await user.clear(currency);
    await user.type(currency, "mxn");

    expect(currency).toHaveValue("MXN");
  });

  it("ejecuta onCancel al presionar cancelar", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<VacancyForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("no muestra el botón cancelar cuando no se proporciona onCancel", () => {
    render(<VacancyForm onSubmit={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
  });

  it("deshabilita los botones mientras busy es true", () => {
    render(<VacancyForm onSubmit={vi.fn()} onCancel={vi.fn()} busy />);

    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });

  it("actualiza el formulario cuando cambia la vacante", async () => {
    const { rerender } = render(
      <VacancyForm vacancy={vacancy} onSubmit={vi.fn()} />,
    );

    expect(screen.getByLabelText("Puesto")).toHaveValue("Frontend Engineer");

    const updatedVacancy: Vacancy = {
      ...vacancy,
      position: "Senior Backend Engineer",
      company: "New Company",
      requirements: ["Node.js", "PostgreSQL"],
      description: "Nueva descripción",
    };

    rerender(<VacancyForm vacancy={updatedVacancy} onSubmit={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Puesto")).toHaveValue(
        "Senior Backend Engineer",
      );
    });

    expect(screen.getByLabelText("Empresa")).toHaveValue("New Company");

    expect(screen.getByLabelText("Descripción")).toHaveValue(
      "Nueva descripción",
    );

    const textareas = screen.getAllByRole("textbox");

    expect(textareas[textareas.length - 1]).toHaveValue("Node.js\nPostgreSQL");
  });
});
