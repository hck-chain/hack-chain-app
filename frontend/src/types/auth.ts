//this is the user registration request
export interface UserRegistrationRequest{
    name: string;
    lastName: string;
    age: string;
    email: string;
    password: string;
}

//this is the recruiter registration request  
export interface RecruiterRegistrationRequest{
    name: string;
    lastName: string;
    email: string;
    password: string;
}

//this is the user registration response
export interface UserRegistrationResponse{
    message: string;
    token?: string;
    user:{
        id?: number;
        role?: string;
        name: string;
        lastName: string;
        age?: string;
        email: string;
        walletAddress?: string;
        wallet_address?: string;
    };
}

//this is the recruiter registration response
export interface RecruiterRegistrationResponse{
    message: string;
    token?: string;
    recruiter:{
        name: string;
        lastName: string;
        email: string;
    };
    user?: {
        id?: number;
        role?: string;
        name?: string;
        lastName?: string;
        lastname?: string;
        email?: string;
        walletAddress?: string;
        wallet_address?: string;
    };
}

//this is the educator registration request  
export interface EducatorRegistrationRequest{
    name: string;
    email: string;
    password: string;
}

//this is the educator registration response
export interface EducatorRegistrationResponse{
    message: string;
    token?: string;
    issuer:{
        name: string;
        email: string;
        walletAddress: string;
    };
    user?: {
        id?: number;
        role?: string;
        name?: string;
        lastName?: string;
        lastname?: string;
        email?: string;
        walletAddress?: string;
        wallet_address?: string;
    };
}

//data form 
export interface UserRegistrationFormData {
    name: string;
    lastName: string;
    age: string;
    email: string;
    password: string;
    confirmPassword: string;
}

//recruiter form data
export interface RecruiterRegistrationFormData {
    name: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

//educator form data
export interface EducatorRegistrationFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

//mistake structure for API
export interface ApiError{
    error: string;
}

export type ApiResponse<T> = T | ApiError;

//validation errors
export const isApiError = (response: unknown): response is ApiError => {
    return response !== null && 
           typeof response === 'object' && 
           'error' in response && 
           typeof (response as ApiError).error === 'string';
};
