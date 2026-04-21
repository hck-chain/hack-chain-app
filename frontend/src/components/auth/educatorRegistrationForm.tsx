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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";

import { educatorRegistrationSchema } from "../../lib/validations/auth";
import { useEducatorRegistration } from "../../hooks/useEducatorRegistration";
import type { EducatorRegistrationFormData } from "../../lib/validations/auth";
import "./autofill-fix.css";

export function EducatorRegistrationForm() {
  const { t } = useTranslation();
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const mutation = useEducatorRegistration();
  const { mutate: register, isPending: isLoading, isSuccess, isError, error } = mutation;

  const form = useForm<EducatorRegistrationFormData>({
    resolver: zodResolver(educatorRegistrationSchema),
    defaultValues: {
      organizationName: "",
      email: "",
    },
  });

  const watchedValues = form.watch();

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const isFieldValid = (fieldName: keyof EducatorRegistrationFormData) => {
    const fieldErrors = form.formState.errors;
    return !fieldErrors[fieldName] && watchedValues[fieldName] && touchedFields[fieldName];
  };

  const onSubmit = (data: EducatorRegistrationFormData) => {
    register(data);
  };

  const handleReset = () => {
    form.reset();
    mutation.reset();
    setTouchedFields({});
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <Alert className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
          <CheckCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            {t('educatorForm.success')}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline" className="w-full max-w-sm border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
            {t('educatorForm.registerAnother')}
          </Button>
        </div>
      </div>
    );
  }

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
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 font-lato">{t('educatorForm.nameLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('educatorForm.namePlaceholder')}
                      disabled={isLoading}
                      className={`input-autofill-dark educator-input ${isFieldValid('organizationName') ? 'input-valid educator-input' : ''}`}
                      onFocus={() => handleFieldTouch('organizationName')}
                      {...field}
                    />
                    {isFieldValid('organizationName') && <Check className="absolute right-3 top-3 h-4 w-4 text-blue-400" />}
                  </div>
                </FormControl>
                {touchedFields.organizationName && (
                  <FormDescription className="text-xs text-gray-400 font-lato">
                    Enter the official name of your educational institution
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 font-lato">{t('educatorForm.emailLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder={t('educatorForm.emailPlaceholder')}
                      disabled={isLoading}
                      className={`input-autofill-dark educator-input ${isFieldValid('email') ? 'input-valid educator-input' : ''}`}
                      onFocus={() => handleFieldTouch('email')}
                      {...field}
                    />
                    {isFieldValid('email') && <Check className="absolute right-3 top-3 h-4 w-4 text-blue-400" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full font-lato text-base bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 mt-6 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-0.5"
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('educatorForm.creating')}</> : t('educatorForm.create')}
          </Button>

          {/* Already have account */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 font-lato text-sm">
              {t('registerEducator.already')}{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold underline-offset-4 hover:underline transition-all">
                {t('registerEducator.signIn')}
              </Link>
            </p>
          </div>
        </form>
      </Form>

    </div>
  );
}
