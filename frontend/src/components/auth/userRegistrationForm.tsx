import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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

export function UserRegistrationForm() {
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

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
            Account created successfully!
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline" className="w-full max-w-sm border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
            Register Another User
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
                <FormLabel className="text-slate-300">Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter your name"
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
                <FormLabel className="text-slate-300">Last Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter your last name"
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
                <FormLabel className="text-slate-300">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 mt-6 transition-all duration-300 hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : "Create Account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
