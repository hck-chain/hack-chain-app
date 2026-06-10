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

import { userRegistrationSchema } from "../../lib/validations/auth";
import { useUserRegistration } from "../../hooks/userUserRegistration";
import type { UserRegistrationFormData } from "../../lib/validations/auth";
import "./autofill-fix.css";

import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useReferralCodeFromUrl } from "../../hooks/useReferralCodeFromUrl";
import { useValidateReferralCode } from "../../hooks/useReferrals";

export function UserRegistrationForm() {
  const { t } = useTranslation();
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const mutation = useUserRegistration();
  const { mutate: register, isPending: isLoading, isError, error } = mutation;

  const referralCode = useReferralCodeFromUrl();
  const { data: validation } = useValidateReferralCode(referralCode);

  const form = useForm<UserRegistrationFormData>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
      referral_code: referralCode || undefined,
    },
  });

  const watchedValues = form.watch();

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const isFieldValid = (fieldName: keyof UserRegistrationFormData) => {
    const fieldErrors = form.formState.errors;
    return !fieldErrors[fieldName] && watchedValues[fieldName] && touchedFields[fieldName];
  };

  const onSubmit = (data: UserRegistrationFormData) => {
    register(data, {
      onSuccess: (response) => {
        if (response.user) {
          login({
            id: response.user.id || 0,
            email: response.user.email,
            role: response.user.role || 'student',
            name: response.user.name,
            lastName: (response.user as any).lastname || null,
            walletAddress: (response.user as any).wallet_address || null,
          });
          navigate('/dashboard/talent');
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

      {validation && validation.valid && (
        <Alert className="border-primary/50 bg-primary/10">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary-foreground">
            Referido por <strong>{validation.referrerName}</strong>. Si te registrás y stakeás 1000 HACK por 30 días, ganas 1000 HACK.
          </AlertDescription>
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
                      className={`input-autofill-dark ${isFieldValid('name') ? 'input-valid' : ''}`}
                      onFocus={() => handleFieldTouch('name')}
                      {...field}
                    />
                    {isFieldValid('name') && <Check className="absolute right-3 top-3 h-4 w-4 text-pink-400" />}
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
                      className={`input-autofill-dark ${isFieldValid('lastName') ? 'input-valid' : ''}`}
                      onFocus={() => handleFieldTouch('lastName')}
                      {...field}
                    />
                    {isFieldValid('lastName') && <Check className="absolute right-3 top-3 h-4 w-4 text-pink-400" />}
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
                <FormLabel className="text-gray-300 font-lato">{t('registrationForm.emailLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder={t('registrationForm.emailPlaceholder')}
                      disabled={isLoading}
                      className={`input-autofill-dark ${isFieldValid('email') ? 'input-valid' : ''}`}
                      onFocus={() => handleFieldTouch('email')}
                      {...field}
                    />
                    {isFieldValid('email') && <Check className="absolute right-3 top-3 h-4 w-4 text-pink-400" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full font-lato text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 mt-6 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:-translate-y-0.5"
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('registrationForm.creating')}</> : t('registrationForm.create')}
          </Button>

          {/* Already have account */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 font-lato text-sm">
              {t('registerUser.already')}{' '}
              <Link to="/login" className="text-pink-400 hover:text-pink-300 font-bold underline-offset-4 hover:underline transition-all">
                {t('registerUser.signIn')}
              </Link>
            </p>
          </div>
        </form>
      </Form>

    </div>
  );
}
