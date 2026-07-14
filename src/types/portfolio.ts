export type AssetType = "stock_kr" | "stock_us" | "crypto" | "cash" | "etc";

export interface AutoTransfer {
  id: string;
  day: number; // Day of month (1-31)
  amount: number;
  type: "deposit" | "withdraw";
  description?: string; // E.g., "급여 자동 이체"
}

export interface AutoBuy {
  id: string;
  frequency: "weekly" | "monthly";
  dayOfWeek?: number; // 1 (Mon) - 7 (Sun)
  dayOfMonth?: number; // 1 - 31
  symbol: string;
  name: string;
  quantity: number;
  assetType: AssetType;
}

export interface Account {
  id: string;
  name: string;
  type: "brokerage" | "crypto_wallet" | "bank" | "other";
  cash: number; // Cash balance in the account
  currency: "KRW" | "USD";
  color?: string; // Hex color code for visualization
  autoTransfers?: AutoTransfer[];
  autoBuys?: AutoBuy[];
  initialBalance?: number; // Initial cash deposit (principal)
}

export interface Transaction {
  id: string;
  accountId: string;
  type: "buy" | "sell" | "deposit" | "withdraw"; // deposit/withdraw are cash operations, buy/sell are asset trades
  assetType: AssetType;
  symbol: string; // e.g. "005930.KS", "AAPL", "BTC" (for cash, can be empty or "CASH")
  name: string; // e.g. "삼성전자", "Apple Inc.", "Bitcoin"
  quantity: number; // number of shares/coins (0 for cash deposit/withdraw)
  price: number; // price per unit in the asset's currency (or transaction amount for cash)
  date: string; // YYYY-MM-DD
  fee?: number;
  customYield?: number; // Manual yield for etc assets (in %)
  currency?: "KRW" | "USD"; // Transaction price/fee currency
}

export interface AssetHolding {
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  avgBuyPrice: number; // Average purchase price (weighted by quantity)
  currentPrice: number;
  totalBuyAmount: number; // quantity * avgBuyPrice
  totalCurrentAmount: number; // quantity * currentPrice
  profitAmount: number; // totalCurrentAmount - totalBuyAmount
  profitPercent: number; // (profitAmount / totalBuyAmount) * 100
  currency: "KRW" | "USD"; // Asset's trading currency
}

export interface PriceData {
  price: number;
  change24h: number; // Percentage change in 24h
  lastUpdated: number; // Timestamp
  currency?: string; // Optional price currency (USD/KRW)
}

export interface PriceCache {
  [symbol: string]: PriceData;
}
