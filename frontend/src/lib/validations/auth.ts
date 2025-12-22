import { z } from "zod";

export const userRegistrationSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must be at most 50 characters long")
        .regex(/^[a-zA-ZÀ-ÿ\s]*$/, "Name can only contain letters and spaces"),

    lastName: z
        .string()
        .min(1, "Last name is required")
        .min(2, "Last name must be at least 2 characters long")
        .max(50, "Last name must be at most 50 characters long")
        .regex(
            /^[a-zA-ZÀ-ÿ\s]*$/,
            "Last name can only contain letters and spaces"
        ),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address")
        .max(100, "Email must be at most 100 characters long"),
});

//schema for sending data to the backend
export const userRegistrationRequestSchema = z.object({
    name: z.string(),
    lastname: z.string(),
    email: z.string().email(),
});

//recruiter registration schema
export const recruiterRegistrationSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must be at most 50 characters long")
        .regex(/^[a-zA-ZÀ-ÿ\s]*$/, "Name can only contain letters and spaces"),

    lastName: z
        .string()
        .min(1, "Last name is required")
        .min(2, "Last name must be at least 2 characters long")
        .max(50, "Last name must be at most 50 characters long")
        .regex(
            /^[a-zA-ZÀ-ÿ\s]*$/,
            "Last name can only contain letters and spaces"
        ),

    companyName: z
        .string()
        .min(1, "Company Name is required")
        .min(2, "Company Name must be at least 2 characters long")
        .max(100, "Company Name must be at most 100 characters long"),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address")
        .max(100, "Email must be at most 100 characters long"),
});

//schema for sending data to the backend
export const recruiterRegistrationRequestSchema = z.object({
    name: z.string(),
    lastname: z.string(),
    company_name: z.string(),
    email: z.string().email(),
});

//educator registration schema
export const educatorRegistrationSchema = z.object({
    organizationName: z
        .string()
        .min(1, "Organization name is required")
        .min(2, "Organization name must be at least 2 characters long")
        .max(200, "Organization name must be at most 200 characters long")
        .trim(),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address")
        .max(100, "Email must be at most 100 characters long"),
});

//schema for sending educator data to the backend
export const educatorRegistrationRequestSchema = z.object({
    organization_name: z.string(),
    email: z.string().email(),
});

export type UserRegistrationFormData = z.infer<typeof userRegistrationSchema>;
export type UserRegistrationRequestData = z.infer<typeof userRegistrationRequestSchema>;
export type RecruiterRegistrationFormData = z.infer<typeof recruiterRegistrationSchema>;
export type RecruiterRegistrationRequestData = z.infer<typeof recruiterRegistrationRequestSchema>;
export type EducatorRegistrationFormData = z.infer<typeof educatorRegistrationSchema>;
export type EducatorRegistrationRequestData = z.infer<typeof educatorRegistrationRequestSchema>;

//transform the response from the backend
export const transformFormDataToRequest = (
    formData: UserRegistrationFormData
): UserRegistrationRequestData => {
    return {
        name: formData.name,
        lastname: formData.lastName,
        email: formData.email,
    };
};

//transform recruiter form data for backend request
export const transformRecruiterFormDataToRequest = (
    formData: RecruiterRegistrationFormData
): RecruiterRegistrationRequestData => {
    return {
        name: formData.name,
        lastname: formData.lastName,
        company_name: formData.companyName,
        email: formData.email,
    };
};

//transform educator form data for backend request
export const transformEducatorFormDataToRequest = (
    formData: EducatorRegistrationFormData
): EducatorRegistrationRequestData => {
    return {
        organization_name: formData.organizationName,
        email: formData.email,
    };
};