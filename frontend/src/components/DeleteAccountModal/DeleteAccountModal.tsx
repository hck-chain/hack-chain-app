import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountModalProps {
  open: boolean;
  organizationName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function DeleteAccountModal({
  open,
  organizationName,
  onConfirm,
  onCancel,
  isPending,
}: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText === organizationName;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isPending) {
      setConfirmText("");
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-900/95 border-red-500/20 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <img src="/icons/warning.avif" className="h-6 w-6 object-contain drop-shadow-md" alt="Warning" />
            </div>
            <DialogTitle className="text-white text-lg">{t('deleteAccount.title')}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-sm space-y-2">
            <p>
              {t('deleteAccount.descLine1')}
            </p>
            <p>
              {t('deleteAccount.descLine2')}
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <Label className="text-slate-300 text-sm">
            {t('deleteAccount.confirmLabel')} <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">{organizationName}</span> {t('deleteAccount.confirmSuffix')}
          </Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={organizationName}
            disabled={isPending}
            className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 focus:border-red-500/50 focus:ring-red-500/20"
            autoComplete="off"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            {t('deleteAccount.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!isConfirmed || isPending}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('deleteAccount.deleting')}
              </>
            ) : (
              t('deleteAccount.deleteBtn')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
