import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle, Check } from "lucide-react";

import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";

import { recruiterRegistrationSchema } from "../../lib/validations/auth";
import { useRecruiterRegistration } from "../../hooks/useRecruiterRegistration";
import type { RecruiterRegistrationFormData } from "../../lib/validations/auth";
import "./autofill-fix.css";

import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function RecruiterRegistrationForm() {
  const { t } = useTranslation();
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const mutation = useRecruiterRegistration();
  const { mutate: register, isPending: isLoading, isError, error } = mutation;

  const form = useForm<RecruiterRegistrationFormData>({
    resolver: zodResolver(recruiterRegistrationSchema),
    defaultValues: {
      name: "",
      lastName: "",
      companyName: "",
      email: "",
    },
  });

  const watchedValues = form.watch();

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const isFieldValid = (fieldName: keyof RecruiterRegistrationFormData) => {
    const fieldErrors = form.formState.errors;
    return !fieldErrors[fieldName] && watchedValues[fieldName] && touchedFields[fieldName];
  };

  const onSubmit = (data: RecruiterRegistrationFormData) => {
    register(data, {
      onSuccess: (response) => {
        if (response.token && (response.recruiter || response.user)) {
          // If the backend returns 'user' object use it, else fallback to recruiter mapping
          const userObj = response.user || {
            id: 0,
            role: 'recruiter',
            name: response.recruiter.name,
            lastName: response.recruiter.lastName,
            email: response.recruiter.email,
            walletAddress: null,
          };
          login(response.token, {
            id: userObj.id || 0,
            email: userObj.email || response.recruiter?.email,
            role: userObj.role || 'recruiter',
            name: userObj.name || response.recruiter?.name,
            lastName: userObj.lastName || userObj.lastname || response.recruiter?.lastName || null,
            walletAddress: userObj.walletAddress || userObj.wallet_address || null,
          });
          navigate('/recruiter-dashboard');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {isError && error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 font-lato">{t('registrationForm.nameLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('registrationForm.namePlaceholder')}
                      disabled={isLoading}
                      className={`input-autofill-dark recruiter-input ${isFieldValid('name') ? 'input-valid recruiter-input' : ''}`}
                      onFocus={() => handleFieldTouch('name')}
                      {...field}
                    />
                    {isFieldValid('name') && <Check className="absolute right-3 top-3 h-4 w-4 text-green-400" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 font-lato">{t('registrationForm.lastNameLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('registrationForm.lastNamePlaceholder')}
                      disabled={isLoading}
                      className={`input-autofill-dark recruiter-input ${isFieldValid('lastName') ? 'input-valid recruiter-input' : ''}`}
                      onFocus={() => handleFieldTouch('lastName')}
                      {...field}
                    />
                    {isFieldValid('lastName') && <Check className="absolute right-3 top-3 h-4 w-4 text-green-400" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 font-lato">{t('recruiterForm.nameLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('recruiterForm.namePlaceholder')}
                      disabled={isLoading}
                      className={`input-autofill-dark recruiter-input ${isFieldValid('companyName') ? 'input-valid recruiter-input' : ''}`}
                      onFocus={() => handleFieldTouch('companyName')}
                      {...field}
                    />
                    {isFieldValid('companyName') && <Check className="absolute right-3 top-3 h-4 w-4 text-green-400" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 font-lato">{t('recruiterForm.emailLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder={t('recruiterForm.emailPlaceholder')}
                      disabled={isLoading}
                      className={`input-autofill-dark recruiter-input ${isFieldValid('email') ? 'input-valid recruiter-input' : ''}`}
                      onFocus={() => handleFieldTouch('email')}
                      {...field}
                    />
                    {isFieldValid('email') && <Check className="absolute right-3 top-3 h-4 w-4 text-green-400" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full font-lato text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 mt-6 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:-translate-y-0.5"
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('recruiterForm.creating')}</> : t('recruiterForm.create')}
          </Button>

          {/* Already have account */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 font-lato text-sm">
              {t('registerRecruiter.already')}{' '}
              <Link to="/login" className="text-green-400 hover:text-green-300 font-bold underline-offset-4 hover:underline transition-all">
                {t('registerRecruiter.signIn')}
              </Link>
            </p>
          </div>
        </form>
      </Form>

    </div>
  );
}
