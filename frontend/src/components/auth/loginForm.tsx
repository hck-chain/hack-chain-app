import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWalletLogin } from "@/hooks/useWalletLogin";

export const LoginForm = () => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { connectAndLogin, isLoading: isWalletLoading, error: walletError } = useWalletLogin();

  const handleWalletLogin = async () => {
    // Clear previous errors
    setErrorMessage("");
    // Trigger wallet login
    await connectAndLogin();
  };

  if (isWalletLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-8 animate-in zoom-in-95 duration-500">
        <div className="relative flex items-center justify-center">
          {/* Glowing rings */}
          <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full border-[3px] border-purple-500/10"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-purple-400 border-l-purple-500 animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
          {/* Inner fox */}
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="absolute w-7 h-7 animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          <div className="w-16 h-16"></div> {/* Spacer for absolute positioning */}
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-exo font-bold text-white tracking-wide animate-pulse drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
            Awaiting Signature
          </h3>
          <p className="text-sm text-slate-400 font-lato">
            Please approve the request in your wallet...
          </p>
        </div>

        {/* Cyber Progress Bar */}
        <div className="w-full max-w-[200px] h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-data-flow"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

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
        className="w-full py-6 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300 bg-slate-900/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="mr-2 h-5 w-5 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
        {t('loginForm.connectMetaMask')}
      </Button>

      {/* Register Link */}
      <div className="text-center text-sm text-slate-400 mt-4">
        {t('loginForm.noAccount')}{" "}
        <Link
          to="/register"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          {t('loginForm.createOne')}
        </Link>
      </div>
    </div>
  );
};
