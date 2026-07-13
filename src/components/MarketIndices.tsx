"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import styles from "./MarketIndices.module.css";

interface IndexData {
  price: number;
  change24h: number;
  currency: string;
}

interface IndexMap {
  [symbol: string]: IndexData;
}

const INDEX_CONFIG = [
  { symbol: "^KS11", name: "코스피", label: "KOSPI", isIndex: true },
  { symbol: "^KQ11", name: "코스닥", label: "KOSDAQ", isIndex: true },
  { symbol: "^IXIC", name: "나스닥", label: "NASDAQ", isIndex: true },
  { symbol: "^GSPC", name: "S&P 500", label: "S&P 500", isIndex: true },
  { symbol: "KRW=X", name: "원/달러 환율", label: "USD/KRW", isIndex: false },
];

export const MarketIndices: React.FC = () => {
  const [data, setData] = useState<IndexMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchIndices = useCallback(async () => {
    try {
      setIsLoading(true);
      const symbolsString = INDEX_CONFIG.map((idx) => idx.symbol).join(",");
      const res = await fetch(`/api/prices?symbols=${symbolsString}`);
      if (!res.ok) throw new Error("Index fetch failed");
      
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch market indices:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch immediately on mount and set up 30s polling
  useEffect(() => {
    fetchIndices();

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchIndices();
      }
    }, 30000); // Poll every 30 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchIndices();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchIndices]);

  const formatPrice = (price: number, isIndex: boolean) => {
    if (!price || price === 0) return "-";
    if (isIndex) {
      return price.toLocaleString("ko-KR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      // Exchange rate
      return "₩" + price.toLocaleString("ko-KR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    }
  };

  return (
    <div className={`glass-card ${styles.container}`}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>글로벌 시장 지수</h3>
          <span className={styles.subtitle}>
            {lastUpdated 
              ? `${lastUpdated.toLocaleTimeString("ko-KR")} 기준 (15초 캐시)` 
              : "시세 동기화 중..."}
          </span>
        </div>
        <button 
          onClick={fetchIndices} 
          disabled={isLoading} 
          className={styles.refreshBtn}
          title="지수 새로고침"
        >
          <RefreshCw size={13} className={isLoading ? styles.spin : ""} />
        </button>
      </div>

      <div className={styles.grid}>
        {INDEX_CONFIG.map((config) => {
          const indexInfo = data[config.symbol];
          const price = indexInfo?.price || 0;
          const change = indexInfo?.change24h || 0;
          const isUp = change > 0;
          const isDown = change < 0;

          return (
            <div key={config.symbol} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.indexName}>{config.name}</span>
                <span className={styles.indexLabel}>{config.label}</span>
              </div>
              <div className={styles.cardBody}>
                <span className={styles.indexPrice}>
                  {formatPrice(price, config.isIndex)}
                </span>
                <div 
                  className={`${styles.changeBadge} ${
                    isUp ? styles.up : isDown ? styles.down : styles.flat
                  }`}
                >
                  {isUp ? (
                    <TrendingUp size={12} />
                  ) : isDown ? (
                    <TrendingDown size={12} />
                  ) : (
                    <Minus size={12} />
                  )}
                  <span>
                    {isUp ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
