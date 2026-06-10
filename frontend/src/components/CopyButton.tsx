import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function CopyButton({ value, label, size = 'md', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md transition-colors ${
        size === 'sm' ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-base'
      } ${
        copied 
          ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
          : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
      } ${className}`}
      title={t('common.copyToClipboard', 'Copiar al portapapeles')}
    >
      {label && <span>{label}</span>}
      {copied ? <Check size={iconSize} className="animate-in zoom-in" /> : <Copy size={iconSize} className="animate-in zoom-in" />}
    </button>
  );
}
