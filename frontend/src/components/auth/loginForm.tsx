import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/useLogin";

// Login validation schema - backend requires min 6 chars
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const navigate = useNavigate();

  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
      
      // Save token and user data
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      setSuccessMessage("Login successful! Redirecting...");
      
      // Redirect based on role
      setTimeout(() => {
        if (response.user.role === "Student") {
          navigate("/dashboard/student");
        } else if (response.user.role === "Recruiter") {
          navigate("/dashboard/recruiter");
        } else if (response.user.role === "Issuer") {
          navigate("/dashboard/issuer");
        } else {
          navigate("/dashboard");
        }
      }, 1500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrorMessage(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-200">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-200">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            {...register("password")}
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      {/* Forgot Password */}
      <div className="flex items-center justify-end">
        <Link
          to="/forgot-password"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loginMutation.isPending || !!successMessage}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : successMessage ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Success!
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Register Link */}
      <div className="text-center text-sm text-slate-400">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Create one now
        </Link>
      </div>
    </form>
  );
};
