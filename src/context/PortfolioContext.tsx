"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Account, Transaction, AssetHolding, PriceCache, AssetType, AutoTransfer, AutoBuy } from "@/types/portfolio";

interface PortfolioContextType {
  accounts: Account[];
  transactions: Transaction[];
  prices: PriceCache;
  exchangeRate: number; // USD to KRW rate
  selectedAccountId: string | null; // null means "All Accounts"
  activeCurrency: "KRW" | "USD";
  sortBy: "amount_desc" | "amount_asc" | "profit_desc" | "profit_asc" | "name_asc";
  groupBy: "none" | "type" | "account";
  isLoadingPrices: boolean;
  
  // Actions
  addAccount: (account: Omit<Account, "id">) => void;
  editAccountCash: (id: string, newCash: number) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  setPrice: (symbol: string, price: number, change24h: number) => void;
  setSelectedAccountId: (id: string | null) => void;
  setActiveCurrency: (currency: "KRW" | "USD") => void;
  setSortBy: (sort: "amount_desc" | "amount_asc" | "profit_desc" | "profit_asc" | "name_asc") => void;
  setGroupBy: (group: "none" | "type" | "account") => void;
  refreshPrices: () => Promise<void>;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  clearAllData: () => void;
  addAutoTransfer: (accountId: string, transfer: Omit<AutoTransfer, "id">) => void;
  deleteAutoTransfer: (accountId: string, transferId: string) => void;
  addAutoBuy: (accountId: string, autoBuy: Omit<AutoBuy, "id">) => void;
  deleteAutoBuy: (accountId: string, autoBuyId: string) => void;
  
  // Computed values
  holdings: AssetHolding[];
  totalAssetsValue: number; // In activeCurrency
  totalInvestedAmount: number; // In activeCurrency
  totalProfitAmount: number; // In activeCurrency
  totalProfitPercent: number;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// Initial Seed Data for stunning first impression
const INITIAL_ACCOUNTS: Account[] = [
  { 
    id: "acc-1", 
    name: "신한 주식 계좌", 
    type: "brokerage", 
    cash: 3200000, 
    currency: "KRW", 
    color: "#6366F1",
    autoTransfers: [
      { id: "tf-1", day: 25, amount: 500000, type: "deposit", description: "급여 자동 이체" }
    ],
    autoBuys: [
      { id: "ab-1", frequency: "monthly", dayOfMonth: 26, symbol: "005930.KS", name: "삼성전자", quantity: 5, assetType: "stock_kr" }
    ]
  },
  { 
    id: "acc-2", 
    name: "Toss 해외 주식", 
    type: "brokerage", 
    cash: 1200, 
    currency: "USD", 
    color: "#3B82F6",
    autoTransfers: [],
    autoBuys: [
      { id: "ab-2", frequency: "weekly", dayOfWeek: 1, symbol: "AAPL", name: "Apple Inc.", quantity: 1, assetType: "stock_us" }
    ]
  },
  { id: "acc-3", name: "업비트 암호화폐", type: "crypto_wallet", cash: 850000, currency: "KRW", color: "#10B981", autoTransfers: [], autoBuys: [] },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  // KR stocks
  { id: "t-1", accountId: "acc-1", type: "buy", assetType: "stock_kr", symbol: "005930.KS", name: "삼성전자", quantity: 50, price: 74200, date: "2026-05-10" },
  { id: "t-2", accountId: "acc-1", type: "buy", assetType: "stock_kr", symbol: "035420.KS", name: "NAVER", quantity: 15, price: 184500, date: "2026-05-15" },
  // US stocks
  { id: "t-3", accountId: "acc-2", type: "buy", assetType: "stock_us", symbol: "AAPL", name: "Apple Inc.", quantity: 12, price: 172.5, date: "2026-04-12" },
  { id: "t-4", accountId: "acc-2", type: "buy", assetType: "stock_us", symbol: "TSLA", name: "Tesla Inc.", quantity: 8, price: 168.2, date: "2026-05-20" },
  { id: "t-5", accountId: "acc-2", type: "sell", assetType: "stock_us", symbol: "TSLA", name: "Tesla Inc.", quantity: 2, price: 185.0, date: "2026-06-05" },
  // Crypto
  { id: "t-6", accountId: "acc-3", type: "buy", assetType: "crypto", symbol: "BTC", name: "Bitcoin", quantity: 0.05, price: 92400000, date: "2026-03-01" },
  { id: "t-7", accountId: "acc-3", type: "buy", assetType: "crypto", symbol: "ETH", name: "Ethereum", quantity: 0.8, price: 4320000, date: "2026-04-10" },
];

const INITIAL_PRICES: PriceCache = {
  "005930.KS": { price: 76500, change24h: 1.82, lastUpdated: Date.now() },
  "035420.KS": { price: 182000, change24h: -0.76, lastUpdated: Date.now() },
  "AAPL": { price: 189.3, change24h: 2.14, lastUpdated: Date.now() },
  "TSLA": { price: 179.4, change24h: -1.45, lastUpdated: Date.now() },
  "BTC": { price: 96800000, change24h: 3.12, lastUpdated: Date.now() },
  "ETH": { price: 4560000, change24h: 0.85, lastUpdated: Date.now() },
  "KRW=X": { price: 1365.4, change24h: 0.12, lastUpdated: Date.now() },
};

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<PriceCache>({});
  const [exchangeRate, setExchangeRate] = useState<number>(1365.0);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeCurrency, setActiveCurrency] = useState<"KRW" | "USD">("KRW");
  const [sortBy, setSortBy] = useState<"amount_desc" | "amount_asc" | "profit_desc" | "profit_asc" | "name_asc">("amount_desc");
  const [groupBy, setGroupBy] = useState<"none" | "type" | "account">("none");
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem("portfolio_accounts");
      const storedTransactions = localStorage.getItem("portfolio_transactions");
      const storedPrices = localStorage.getItem("portfolio_prices");
      const storedCurrency = localStorage.getItem("portfolio_currency");

      if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
      else setAccounts(INITIAL_ACCOUNTS);

      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      else setTransactions(INITIAL_TRANSACTIONS);

      if (storedPrices) {
        const parsedPrices = JSON.parse(storedPrices);
        setPrices(parsedPrices);
        if (parsedPrices["KRW=X"]?.price) {
          setExchangeRate(parsedPrices["KRW=X"].price);
        }
      } else {
        setPrices(INITIAL_PRICES);
        setExchangeRate(INITIAL_PRICES["KRW=X"].price);
      }

      if (storedCurrency) setActiveCurrency(storedCurrency as "KRW" | "USD");
      
      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load local storage", e);
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setPrices(INITIAL_PRICES);
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("portfolio_accounts", JSON.stringify(accounts));
  }, [accounts, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("portfolio_transactions", JSON.stringify(transactions));
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("portfolio_prices", JSON.stringify(prices));
  }, [prices, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("portfolio_currency", activeCurrency);
  }, [activeCurrency, isLoaded]);

  // Add Account
  const addAccount = (newAcc: Omit<Account, "id">) => {
    const account: Account = {
      ...newAcc,
      id: `acc-${Date.now()}`,
      color: newAcc.color || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
      autoTransfers: [],
      autoBuys: [],
    };
    setAccounts((prev) => [...prev, account]);
  };

  // Edit Account Cash directly
  const editAccountCash = (id: string, newCash: number) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, cash: newCash } : acc))
    );
  };

  // Delete Account
  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    // Optionally clean up transactions associated with this account
    setTransactions((prev) => prev.filter((t) => t.accountId !== id));
  };

  // Auto Transfers
  const addAutoTransfer = (accountId: string, newTransfer: Omit<AutoTransfer, "id">) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const transfer: AutoTransfer = {
          ...newTransfer,
          id: `tf-${Date.now()}`,
        };
        const transfers = acc.autoTransfers ? [...acc.autoTransfers, transfer] : [transfer];
        return { ...acc, autoTransfers: transfers };
      })
    );
  };

  const deleteAutoTransfer = (accountId: string, transferId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const transfers = acc.autoTransfers
          ? acc.autoTransfers.filter((t) => t.id !== transferId)
          : [];
        return { ...acc, autoTransfers: transfers };
      })
    );
  };

  // Auto Buys
  const addAutoBuy = (accountId: string, newAutoBuy: Omit<AutoBuy, "id">) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const autoBuy: AutoBuy = {
          ...newAutoBuy,
          id: `ab-${Date.now()}`,
        };
        const buys = acc.autoBuys ? [...acc.autoBuys, autoBuy] : [autoBuy];
        return { ...acc, autoBuys: buys };
      })
    );
  };

  const deleteAutoBuy = (accountId: string, autoBuyId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const buys = acc.autoBuys ? acc.autoBuys.filter((b) => b.id !== autoBuyId) : [];
        return { ...acc, autoBuys: buys };
      })
    );
  };

  // Add Transaction & Update Account Cash Balance
  const addTransaction = (newTx: Omit<Transaction, "id">) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };

    setTransactions((prev) => [...prev, tx]);

    // Automatically update cash balance in the corresponding account
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id !== tx.accountId) return acc;

        let cashDelta = 0;
        const totalTradeAmount = tx.quantity * tx.price;
        const fee = tx.fee || 0;

        // Cash flow logic
        if (tx.type === "buy") {
          // Buying stocks/crypto: deduct cash (fees add to cost)
          cashDelta = -(totalTradeAmount + fee);
        } else if (tx.type === "sell") {
          // Selling stocks/crypto: add cash (fees deduct from payout)
          cashDelta = totalTradeAmount - fee;
        } else if (tx.type === "deposit") {
          // Cash deposit: add cash (price field represents deposit amount)
          cashDelta = tx.price;
        } else if (tx.type === "withdraw") {
          // Cash withdrawal: deduct cash (price field represents withdrawal amount)
          cashDelta = -tx.price;
        }

        // Handle currency differences:
        // Transactions should be recorded in the account's currency.
        return {
          ...acc,
          cash: acc.cash + cashDelta,
        };
      })
    );
  };

  // Delete Transaction & Revert Account Cash Balance
  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // Revert cash balance
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id !== tx.accountId) return acc;

        let cashDelta = 0;
        const totalTradeAmount = tx.quantity * tx.price;
        const fee = tx.fee || 0;

        // Reverse cash flow
        if (tx.type === "buy") {
          cashDelta = totalTradeAmount + fee;
        } else if (tx.type === "sell") {
          cashDelta = -(totalTradeAmount - fee);
        } else if (tx.type === "deposit") {
          cashDelta = -tx.price;
        } else if (tx.type === "withdraw") {
          cashDelta = tx.price;
        }

        return {
          ...acc,
          cash: acc.cash + cashDelta,
        };
      })
    );

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const setPrice = (symbol: string, price: number, change24h: number) => {
    setPrices((prev) => ({
      ...prev,
      [symbol]: { price, change24h, lastUpdated: Date.now() },
    }));
  };

  // Fetch prices from Next.js server route
  const refreshPrices = useCallback(async () => {
    const uniqueSymbols = Array.from(
      new Set(
        transactions
          .filter((t) => t.type === "buy" || t.type === "sell")
          .map((t) => t.symbol)
      )
    );

    if (uniqueSymbols.length === 0) {
      // Just refresh USD/KRW exchange rate if there are no assets
      try {
        setIsLoadingPrices(true);
        const res = await fetch("/api/prices?symbols=KRW=X");
        const json = await res.json();
        if (json.success && json.data["KRW=X"]) {
          setExchangeRate(json.data["KRW=X"].price);
          setPrices((prev) => ({ ...prev, ...json.data }));
        }
      } catch (err) {
        console.error("Failed to refresh exchange rate", err);
      } finally {
        setIsLoadingPrices(false);
      }
      return;
    }

    try {
      setIsLoadingPrices(true);
      const symbolsString = uniqueSymbols.join(",");
      const res = await fetch(`/api/prices?symbols=${symbolsString}`);
      if (!res.ok) throw new Error("Price API request failed");
      
      const json = await res.json();
      if (json.success) {
        setPrices((prev) => {
          const newPrices = { ...prev, ...json.data };
          if (json.data["KRW=X"]?.price) {
            setExchangeRate(json.data["KRW=X"].price);
          }
          return newPrices;
        });
      }
    } catch (err) {
      console.error("Failed to fetch prices", err);
    } finally {
      setIsLoadingPrices(false);
    }
  }, [transactions]);

  // Refresh prices on load once transactions are ready
  useEffect(() => {
    if (isLoaded && transactions.length > 0) {
      refreshPrices();
    }
  }, [isLoaded, refreshPrices]);

  // Export all data to JSON file
  const exportData = () => {
    const dataStr = JSON.stringify({ accounts, transactions, prices });
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `portfolio-data-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Import data from JSON
  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.accounts && parsed.transactions) {
        setAccounts(parsed.accounts);
        setTransactions(parsed.transactions);
        if (parsed.prices) setPrices(parsed.prices);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  };

  // Clear all data (Start with a fresh empty state)
  const clearAllData = () => {
    setAccounts([]);
    setTransactions([]);
    setPrices({});
    localStorage.setItem("portfolio_accounts", JSON.stringify([]));
    localStorage.setItem("portfolio_transactions", JSON.stringify([]));
    localStorage.setItem("portfolio_prices", JSON.stringify({}));
  };

  // ==========================================
  // CALCULATIONS (HOLDINGS AND SUMMARY VALS)
  // ==========================================

  // 1. Group transactions by symbol to calculate holdings
  const computedHoldings = React.useMemo(() => {
    const holdingsMap: { [symbol: string]: { qty: number; cost: number; name: string; type: AssetType; currency: "KRW" | "USD" } } = {};

    // Filter transactions by selected account if needed
    const filteredTxs = selectedAccountId
      ? transactions.filter((t) => t.accountId === selectedAccountId)
      : transactions;

    // Process trades in chronological order to correctly track Average Cost Basis
    const sortedTxs = [...filteredTxs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const tx of sortedTxs) {
      if (tx.type !== "buy" && tx.type !== "sell") continue;

      if (!holdingsMap[tx.symbol]) {
        const account = accounts.find((a) => a.id === tx.accountId);
        const currency = account?.currency || (tx.assetType === "stock_kr" ? "KRW" : "USD");
        holdingsMap[tx.symbol] = { qty: 0, cost: 0, name: tx.name, type: tx.assetType, currency };
      }

      const holding = holdingsMap[tx.symbol];

      if (tx.type === "buy") {
        holding.qty += tx.quantity;
        holding.cost += tx.quantity * tx.price;
      } else if (tx.type === "sell") {
        if (holding.qty > 0) {
          const avgPrice = holding.cost / holding.qty;
          holding.qty = Math.max(0, holding.qty - tx.quantity);
          holding.cost = holding.qty * avgPrice; // cost basis reduced proportionally
        }
      }
    }

    // Convert map to array and compute current values
    const list: AssetHolding[] = [];

    for (const symbol in holdingsMap) {
      const h = holdingsMap[symbol];
      if (h.qty <= 0) continue; // Skip assets that are completely sold

      // Find current price in cache or fallback to avg purchase price
      const currency = h.currency;
      const priceInfo = prices[symbol];
      let currentPrice = priceInfo?.price || (h.cost / h.qty);

      // Convert fetched price currency (e.g. USD for BTC-USD) to holding's currency (e.g. KRW) if they differ
      if (priceInfo) {
        const priceCurrency = priceInfo.currency || (symbol.endsWith(".KS") || symbol.endsWith(".KQ") ? "KRW" : "USD");
        if (priceCurrency === "USD" && currency === "KRW") {
          currentPrice *= exchangeRate;
        } else if (priceCurrency === "KRW" && currency === "USD") {
          currentPrice /= exchangeRate;
        }
      }

      const totalBuyAmount = h.cost;
      const totalCurrentAmount = h.qty * currentPrice;
      const profitAmount = totalCurrentAmount - totalBuyAmount;
      const profitPercent = totalBuyAmount > 0 ? (profitAmount / totalBuyAmount) * 100 : 0;

      list.push({
        symbol,
        name: h.name,
        assetType: h.type,
        quantity: h.qty,
        avgBuyPrice: h.cost / h.qty,
        currentPrice,
        totalBuyAmount,
        totalCurrentAmount,
        profitAmount,
        profitPercent,
        currency,
      });
    }

    // Apply Sorting
    return list.sort((a, b) => {
      // Helper function to get value in activeCurrency for comparison
      const getValueInActiveCurrency = (item: AssetHolding) => {
        let amount = item.totalCurrentAmount;
        if (item.currency === "USD" && activeCurrency === "KRW") {
          amount *= exchangeRate;
        } else if (item.currency === "KRW" && activeCurrency === "USD") {
          amount /= exchangeRate;
        }
        return amount;
      };

      if (sortBy === "amount_desc") {
        return getValueInActiveCurrency(b) - getValueInActiveCurrency(a);
      } else if (sortBy === "amount_asc") {
        return getValueInActiveCurrency(a) - getValueInActiveCurrency(b);
      } else if (sortBy === "profit_desc") {
        return b.profitPercent - a.profitPercent;
      } else if (sortBy === "profit_asc") {
        return a.profitPercent - b.profitPercent;
      } else {
        return a.name.localeCompare(b.name, "ko");
      }
    });
  }, [transactions, prices, selectedAccountId, sortBy, activeCurrency, exchangeRate]);

  // 2. Aggregate overall values
  const summary = React.useMemo(() => {
    // A. Cash value aggregation
    let totalCashValue = 0;

    const filteredAccounts = selectedAccountId
      ? accounts.filter((a) => a.id === selectedAccountId)
      : accounts;

    for (const acc of filteredAccounts) {
      let cash = acc.cash;
      if (acc.currency === "USD" && activeCurrency === "KRW") {
        cash *= exchangeRate;
      } else if (acc.currency === "KRW" && activeCurrency === "USD") {
        cash /= exchangeRate;
      }
      totalCashValue += cash;
    }

    // B. Holdings value aggregation
    let totalHoldingsBuyValue = 0;
    let totalHoldingsCurrentValue = 0;

    for (const h of computedHoldings) {
      let buy = h.totalBuyAmount;
      let curr = h.totalCurrentAmount;

      if (h.currency === "USD" && activeCurrency === "KRW") {
        buy *= exchangeRate;
        curr *= exchangeRate;
      } else if (h.currency === "KRW" && activeCurrency === "USD") {
        buy /= exchangeRate;
        curr /= exchangeRate;
      }

      totalHoldingsBuyValue += buy;
      totalHoldingsCurrentValue += curr;
    }

    const totalAssetsValue = totalHoldingsCurrentValue + totalCashValue;
    const totalInvestedAmount = totalHoldingsBuyValue + totalCashValue; // treatment: cash has 0% gain
    const totalProfitAmount = totalHoldingsCurrentValue - totalHoldingsBuyValue;
    const totalProfitPercent = totalHoldingsBuyValue > 0 ? (totalProfitAmount / totalHoldingsBuyValue) * 100 : 0;

    return {
      totalAssetsValue,
      totalInvestedAmount,
      totalProfitAmount,
      totalProfitPercent,
    };
  }, [computedHoldings, accounts, selectedAccountId, activeCurrency, exchangeRate]);

  return (
    <PortfolioContext.Provider
      value={{
        accounts,
        transactions,
        prices,
        exchangeRate,
        selectedAccountId,
        activeCurrency,
        sortBy,
        groupBy,
        isLoadingPrices,
        addAccount,
        editAccountCash,
        deleteAccount,
        addTransaction,
        deleteTransaction,
        setPrice,
        setSelectedAccountId,
        setActiveCurrency,
        setSortBy,
        setGroupBy,
        refreshPrices,
        exportData,
        importData,
        clearAllData,
        holdings: computedHoldings,
        addAutoTransfer,
        deleteAutoTransfer,
        addAutoBuy,
        deleteAutoBuy,
        ...summary,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
