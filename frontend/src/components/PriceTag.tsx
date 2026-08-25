import type { CSSProperties } from 'react';
import { useExchangeRate } from '@/hooks/useExchangeRate';

interface PriceTagProps {
  usdAmount: number;
  suffix?: string;
  className?: string;
  style?: CSSProperties;
}

function formatUsd(amount: number): string {
  return amount % 1 === 0 ? `$${amount}` : `$${amount.toFixed(2)}`;
}

function formatMxn(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Shows the USD price an educator set alongside its MXN equivalent, using the
// daily-refreshed rate from /api/exchange-rate/usd-mxn. Degrades gracefully
// to USD-only while the rate hasn't loaded yet, instead of blocking the price.
// Uses currentColor + opacity (no hardcoded palette) so it drops into any
// page's existing text color — dark-mode Tailwind slate or a custom palette.
export function PriceTag({ usdAmount, suffix, className, style }: PriceTagProps) {
  const { data } = useExchangeRate();

  return (
    <span className={className} style={style}>
      <span className="font-semibold tabular-nums">{formatUsd(usdAmount)}</span>
      <span className="text-[11px] opacity-60 ml-1">USD</span>
      {data?.rate && (
        <>
          <span className="text-[11px] opacity-40 mx-1.5">·</span>
          <span className="text-[0.85em] tabular-nums opacity-80">{formatMxn(usdAmount * data.rate)}</span>
          <span className="text-[11px] opacity-60 ml-1">MXN</span>
        </>
      )}
      {suffix && <span className="text-[11px] opacity-60 ml-1">{suffix}</span>}
    </span>
  );
}
