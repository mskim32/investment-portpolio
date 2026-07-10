"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { AssetType } from "@/types/portfolio";
import styles from "./AssetAllocation.module.css";
import { PieChart, Landmark, Coins, DollarSign, Wallet } from "lucide-react";

interface AllocationItem {
  id: string;
  name: string;
  value: number; // Value in active currency
  percentage: number;
  color: string;
}

export const AssetAllocation: React.FC = () => {
  const {
    accounts,
    transactions,
    holdings,
    prices,
    exchangeRate,
    activeCurrency,
    totalAssetsValue,
    selectedAccountId,
  } = usePortfolio();

  const [groupMode, setGroupMode] = useState<"type" | "account">("type");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatVal = (val: number) => {
    if (activeCurrency === "KRW") {
      return "₩" + Math.round(val).toLocaleString("ko-KR");
    } else {
      return "$" + val.toLocaleString("en-US", { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      });
    }
  };

  // Helper to convert cash/asset values to active currency
  const toActiveCurrency = (amount: number, currency: "KRW" | "USD") => {
    if (currency === activeCurrency) return amount;
    if (currency === "USD" && activeCurrency === "KRW") return amount * exchangeRate;
    return amount / exchangeRate; // KRW to USD
  };

  // 1. Calculate Allocation Data
  const allocationData: AllocationItem[] = React.useMemo(() => {
    if (totalAssetsValue === 0) return [];

    if (groupMode === "type") {
      // Group by Asset Class: KR Stocks, US Stocks, Crypto, Cash
      let krStockVal = 0;
      let usStockVal = 0;
      let cryptoVal = 0;
      let cashVal = 0;

      // Holdings
      holdings.forEach((h) => {
        const val = toActiveCurrency(h.totalCurrentAmount, h.currency);
        if (h.assetType === "stock_kr") krStockVal += val;
        else if (h.assetType === "stock_us") usStockVal += val;
        else if (h.assetType === "crypto") cryptoVal += val;
      });

      // Cash
      const filteredAccounts = selectedAccountId
        ? accounts.filter((acc) => acc.id === selectedAccountId)
        : accounts;

      filteredAccounts.forEach((acc) => {
        cashVal += toActiveCurrency(acc.cash, acc.currency);
      });

      const items = [
        { id: "stock_kr", name: "한국 주식", value: krStockVal, color: "#6366F1" },
        { id: "stock_us", name: "미국 주식", value: usStockVal, color: "#3B82F6" },
        { id: "crypto", name: "암호화폐", value: cryptoVal, color: "#10B981" },
        { id: "cash", name: "현금성 자산", value: cashVal, color: "#94a3b8" },
      ];

      return items
        .filter((item) => item.value > 0)
        .map((item) => ({
          ...item,
          percentage: (item.value / totalAssetsValue) * 100,
        }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Group by Account
      const accValues: { [accId: string]: number } = {};
      
      // Initialize with cash balances
      accounts.forEach((acc) => {
        accValues[acc.id] = toActiveCurrency(acc.cash, acc.currency);
      });

      // Add asset holdings per account
      // To do this, we need to calculate holdings grouped by account.
      accounts.forEach((acc) => {
        // Filter transactions for this account
        const accTxs = transactions.filter((t) => t.accountId === acc.id);
        const holdingsMap: { [symbol: string]: number } = {};

        accTxs.forEach((tx) => {
          if (tx.type === "buy") {
            holdingsMap[tx.symbol] = (holdingsMap[tx.symbol] || 0) + tx.quantity;
          } else if (tx.type === "sell") {
            holdingsMap[tx.symbol] = Math.max(0, (holdingsMap[tx.symbol] || 0) - tx.quantity);
          }
        });

        for (const symbol in holdingsMap) {
          const qty = holdingsMap[symbol];
          if (qty > 0) {
            const currentPrice = prices[symbol]?.price || 0;
            const assetType = accTxs.find((t) => t.symbol === symbol)?.assetType;
            const currency = assetType === "stock_kr" ? "KRW" : "USD";
            const val = toActiveCurrency(qty * currentPrice, currency);
            accValues[acc.id] += val;
          }
        }
      });

      return accounts
        .map((acc) => {
          const val = accValues[acc.id] || 0;
          return {
            id: acc.id,
            name: acc.name,
            value: val,
            color: acc.color || "#CBD5E1",
          };
        })
        .filter((item) => item.value > 0)
        .map((item) => ({
          ...item,
          percentage: (item.value / totalAssetsValue) * 100,
        }))
        .sort((a, b) => b.value - a.value);
    }
  }, [groupMode, accounts, transactions, holdings, prices, exchangeRate, totalAssetsValue, activeCurrency]);

  // Donut chart calculations
  const radius = 50;
  const strokeWidth = 14;
  const center = 60;
  const circumference = 2 * Math.PI * radius; // ~314.16

  // Cumulative percentage tracker for drawing strokes
  let accumulatedPercent = 0;

  const activeItem = hoveredIndex !== null ? allocationData[hoveredIndex] : null;

  return (
    <div className={`glass-card ${styles.container}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <PieChart size={18} className={styles.headerIcon} />
          <h3 className={styles.title}>자산 비중 (Allocation)</h3>
        </div>
        <div className={styles.toggleContainer}>
          <button
            onClick={() => { setGroupMode("type"); setHoveredIndex(null); }}
            className={`${styles.toggleBtn} ${groupMode === "type" ? styles.active : ""}`}
          >
            자산 종류별
          </button>
          <button
            onClick={() => { setGroupMode("account"); setHoveredIndex(null); }}
            className={`${styles.toggleBtn} ${groupMode === "account" ? styles.active : ""}`}
          >
            계좌별
          </button>
        </div>
      </div>

      {allocationData.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>보유한 자산이 없습니다. 거래 내역을 등록해 주세요.</span>
        </div>
      ) : (
        <div className={styles.content}>
          {/* Custom SVG Donut Chart */}
          <div className={styles.chartWrapper}>
            <svg viewBox="0 0 120 120" className={styles.donutSvg}>
              {/* Background circle track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {allocationData.map((item, idx) => {
                const strokeLength = circumference * (item.percentage / 100);
                const strokeOffset = -((accumulatedPercent * circumference) / 100);
                
                // Add to accumulator
                accumulatedPercent += item.percentage;
                
                const isHovered = hoveredIndex === idx;

                return (
                  <circle
                    key={item.id}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                    strokeDasharray={`${strokeLength} ${circumference}`}
                    strokeDashoffset={strokeOffset}
                    transform={`rotate(-90 ${center} ${center})`}
                    className={styles.donutSegment}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      strokeWidth: isHovered ? strokeWidth + 2 : strokeWidth,
                      opacity: hoveredIndex !== null && !isHovered ? 0.4 : 1,
                    }}
                  />
                );
              })}
            </svg>
            
            {/* Text inside the donut hole */}
            <div className={styles.donutCenter}>
              <span className={styles.centerLabel}>
                {activeItem ? activeItem.name : "총 자산"}
              </span>
              <span className={styles.centerValue}>
                {formatVal(activeItem ? activeItem.value : totalAssetsValue)}
              </span>
              <span className={styles.centerPercent}>
                {activeItem ? `${activeItem.percentage.toFixed(1)}%` : "100.0%"}
              </span>
            </div>
          </div>

          {/* Chart Legend List */}
          <div className={styles.legendList}>
            {allocationData.map((item, idx) => (
              <div
                key={item.id}
                className={`${styles.legendItem} ${hoveredIndex === idx ? styles.legendItemHovered : ""}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  opacity: hoveredIndex !== null && hoveredIndex !== idx ? 0.5 : 1
                }}
              >
                <div className={styles.legendLeft}>
                  <div className={styles.colorIndicator} style={{ backgroundColor: item.color }} />
                  <span className={styles.legendName}>{item.name}</span>
                </div>
                <div className={styles.legendRight}>
                  <span className={styles.legendValue}>{formatVal(item.value)}</span>
                  <span className={styles.legendPercent}>{item.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
