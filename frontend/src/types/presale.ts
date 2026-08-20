export interface Phase {
  id: number;
  label: string;
  start: Date;
  end: Date;
  price: number;
  tokensAvailable: number;
  maxPerPurchase: number;
  lockup: string;
  release: string;
}

export interface Contributor {
  address: string;
  phase: string;
  usdt: number;
  hack: number;
}

export interface FaqEntry {
  q: string;
  a: string;
}
