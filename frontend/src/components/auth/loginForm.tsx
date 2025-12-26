import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useWalletLogin } from "@/hooks/useWalletLogin";

export const LoginForm = () => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { connectAndLogin, isLoading: isWalletLoading, error: walletError } = useWalletLogin();

  const handleWalletLogin = async () => {
    // Clear previous errors
    setErrorMessage("");
    // Trigger wallet login
    await connectAndLogin();
  };

  return (
    <div className="space-y-6">

      {/* Wallet Error */}
      {(walletError || errorMessage) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{walletError || errorMessage}</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleWalletLogin}
        disabled={isWalletLoading}
        className="w-full py-6 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300 bg-slate-900/50"
      >
        {isWalletLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="mr-2 h-5 w-5" />
        )}
        Connect with MetaMask
      </Button>

      {/* Register Link */}
      <div className="text-center text-sm text-slate-400 mt-4">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Create one now
        </Link>
      </div>
    </div>
  );
};
