import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle, Check, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "../ui/dialog";

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

export function UserRegistrationForm() {
  const { t } = useTranslation();
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showMetamaskModal, setShowMetamaskModal] = useState(false);

  const mutation = useUserRegistration();
  const { mutate: register, isPending: isLoading, isSuccess, isError, error } = mutation;

  const form = useForm<UserRegistrationFormData>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
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
    if (!window.ethereum) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Redirige al navegador interno de MetaMask en móvil
        window.location.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        return;
      }
      setShowMetamaskModal(true);
      return;
    }
    // Note: Backend requires wallet_address, but UI for it is disabled as per user request.
    // This will likely fail with 400 if backend enforcement is active.
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
        <Alert className="border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <CheckCircle className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-purple-200">
            {t('registrationForm.success')}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline" className="w-full max-w-sm border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
            {t('registrationForm.registerAnother')}
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
                    {isFieldValid('name') && <Check className="absolute right-3 top-3 h-4 w-4 text-purple-400" />}
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
                    {isFieldValid('lastName') && <Check className="absolute right-3 top-3 h-4 w-4 text-purple-400" />}
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
                    {isFieldValid('email') && <Check className="absolute right-3 top-3 h-4 w-4 text-purple-400" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full font-lato text-base bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 mt-6 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] hover:-translate-y-0.5"
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('registrationForm.creating')}</> : t('registrationForm.create')}
          </Button>

          {/* Already have account */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 font-lato text-sm">
              {t('registerUser.already')}{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold underline-offset-4 hover:underline transition-all">
                {t('registerUser.signIn')}
              </Link>
            </p>
          </div>
        </form>
      </Form>

      <Dialog open={showMetamaskModal} onOpenChange={setShowMetamaskModal}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-purple-500/30 text-slate-300 font-lato">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-exo text-white">
                {t('metamask.modalTitle')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-400">
              {t('metamask.modalDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMetamaskModal(false)}
              className="w-full sm:w-auto border-purple-500/30 text-gray-300 hover:text-white hover:bg-purple-500/10"
            >
              {t('metamask.cancel')}
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
            >
              {t('metamask.downloadBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
