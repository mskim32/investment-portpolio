"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { AssetHolding, AssetType } from "@/types/portfolio";
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  SlidersHorizontal,
  FolderOpen
} from "lucide-react";
import styles from "./AssetList.module.css";

interface AssetListProps {
  onAddTransactionClick: () => void;
}

export const AssetList: React.FC<AssetListProps> = ({ onAddTransactionClick }) => {
  const {
    holdings,
    prices,
    exchangeRate,
    activeCurrency,
    sortBy,
    setSortBy,
    isLoadingPrices,
  } = usePortfolio();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | AssetType>("all");

  const formatCurrency = (val: number, currency: "KRW" | "USD") => {
    if (currency === "KRW") {
      return "₩" + Math.round(val).toLocaleString("ko-KR");
    } else {
      return "$" + val.toLocaleString("en-US", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  };

  // Helper to format values in consolidated active currency
  const formatActiveVal = (amountInAssetCurrency: number, assetCurrency: "KRW" | "USD") => {
    let val = amountInAssetCurrency;
    if (assetCurrency === "USD" && activeCurrency === "KRW") {
      val *= exchangeRate;
    } else if (assetCurrency === "KRW" && activeCurrency === "USD") {
      val /= exchangeRate;
    }
    return formatCurrency(val, activeCurrency);
  };

  const getAssetBadgeColor = (type: AssetType) => {
    switch (type) {
      case "stock_kr": return styles.badgeKr;
      case "stock_us": return styles.badgeUs;
      case "crypto": return styles.badgeCrypto;
      default: return styles.badgeCash;
    }
  };

  const getAssetBadgeLabel = (type: AssetType) => {
    switch (type) {
      case "stock_kr": return "국내주식";
      case "stock_us": return "미국주식";
      case "crypto": return "가상자산";
      default: return "현금";
    }
  };

  // Filter holdings based on search and selected tab
  const filteredHoldings = React.useMemo(() => {
    return holdings.filter((h) => {
      // Tab filter
      if (activeTab !== "all" && h.assetType !== activeTab) return false;
      
      // Search filter
      const query = searchQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(query) || 
        h.symbol.toLowerCase().includes(query)
      );
    });
  }, [holdings, activeTab, searchQuery]);

  return (
    <div className={`glass-card ${styles.container}`}>
      {/* List Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <FolderOpen size={18} className={styles.headerIcon} />
          <h3 className={styles.title}>보유 자산 현황</h3>
          {isLoadingPrices && <span className={styles.loadingPulse}>시세 동기화 중...</span>}
        </div>
        <button 
          onClick={onAddTransactionClick}
          className="btn btn-primary btn-sm"
        >
          <Plus size={15} /> 거래 기록 추가
        </button>
      </div>

      {/* Filters and Controls */}
      <div className={styles.controlsRow}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="종목명 또는 심볼 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.sortBox}>
          <SlidersHorizontal size={14} className={styles.sortIcon} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.sortSelect}
          >
            <option value="amount_desc">평가금액 높은순</option>
            <option value="amount_asc">평가금액 낮은순</option>
            <option value="profit_desc">수익률 높은순</option>
            <option value="profit_asc">수익률 낮은순</option>
            <option value="name_asc">가나다순</option>
          </select>
        </div>
      </div>

      {/* Asset Tabs */}
      <div className={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab("all")}
          className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabActive : ""}`}
        >
          전체 자산
        </button>
        <button
          onClick={() => setActiveTab("stock_us")}
          className={`${styles.tabBtn} ${activeTab === "stock_us" ? styles.tabActive : ""}`}
        >
          미국주식
        </button>
        <button
          onClick={() => setActiveTab("stock_kr")}
          className={`${styles.tabBtn} ${activeTab === "stock_kr" ? styles.tabActive : ""}`}
        >
          국내주식
        </button>
        <button
          onClick={() => setActiveTab("crypto")}
          className={`${styles.tabBtn} ${activeTab === "crypto" ? styles.tabActive : ""}`}
        >
          가상자산
        </button>
      </div>

      {/* Main Content */}
      {filteredHoldings.length === 0 ? (
        <div className={styles.emptyState}>
          <span>검색된 조건의 보유 자산이 없습니다.</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>자산명</th>
                  <th>분류</th>
                  <th style={{ textAlign: "right" }}>보유 수량</th>
                  <th style={{ textAlign: "right" }}>평균 매수가</th>
                  <th style={{ textAlign: "right" }}>현재가</th>
                  <th style={{ textAlign: "right" }}>평가금액</th>
                  <th style={{ textAlign: "right" }}>평가손익 (수익률)</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map((h) => {
                  const isProfit = h.profitAmount >= 0;
                  const priceInfo = prices[h.symbol];
                  
                  return (
                    <tr key={h.symbol}>
                      <td>
                        <div className={styles.assetNameCol}>
                          <span className={styles.assetName}>{h.name}</span>
                          <span className={styles.assetSymbol}>{h.symbol}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getAssetBadgeColor(h.assetType)}`}>
                          {getAssetBadgeLabel(h.assetType)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>
                        {h.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                        {formatCurrency(h.avgBuyPrice, h.currency)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.priceContainer}>
                          <span>{formatCurrency(h.currentPrice, h.currency)}</span>
                          {priceInfo && (
                            <span 
                              className={`${styles.priceChange} ${
                                priceInfo.change24h >= 0 ? styles.up : styles.down
                              }`}
                            >
                              {priceInfo.change24h >= 0 ? "+" : ""}
                              {priceInfo.change24h.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        <div className={styles.valuationContainer}>
                          <span>{formatActiveVal(h.totalCurrentAmount, h.currency)}</span>
                          {h.currency !== activeCurrency && (
                            <span className={styles.secondaryVal}>
                              {formatCurrency(h.totalCurrentAmount, h.currency)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.profitContainer}>
                          <span className={isProfit ? styles.profit : styles.loss}>
                            {isProfit ? "+" : ""}
                            {formatActiveVal(h.profitAmount, h.currency)}
                          </span>
                          <span className={`${styles.profitRate} ${isProfit ? styles.profitBg : styles.lossBg}`}>
                            {isProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {h.profitPercent.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className={styles.mobileCardsContainer}>
            {filteredHoldings.map((h) => {
              const isProfit = h.profitAmount >= 0;
              const priceInfo = prices[h.symbol];

              return (
                <div key={h.symbol} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div>
                      <span className={styles.mobileAssetName}>{h.name}</span>
                      <span className={styles.mobileAssetSymbol}>{h.symbol}</span>
                    </div>
                    <span className={`${styles.badge} ${getAssetBadgeColor(h.assetType)}`}>
                      {getAssetBadgeLabel(h.assetType)}
                    </span>
                  </div>

                  <div className={styles.mobileCardGrid}>
                    <div className={styles.mobileGridItem}>
                      <span className={styles.mobileLabel}>보유수량</span>
                      <span className={styles.mobileValue}>
                        {h.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                    </div>
                    <div className={styles.mobileGridItem} style={{ textAlign: "right" }}>
                      <span className={styles.mobileLabel}>평가금액</span>
                      <span className={styles.mobileValueHighlight}>
                        {formatActiveVal(h.totalCurrentAmount, h.currency)}
                      </span>
                    </div>
                    <div className={styles.mobileGridItem}>
                      <span className={styles.mobileLabel}>평균매수가 / 현재가</span>
                      <span className={styles.mobileValueSub}>
                        {formatCurrency(h.avgBuyPrice, h.currency)} / {formatCurrency(h.currentPrice, h.currency)}
                      </span>
                    </div>
                    <div className={styles.mobileGridItem} style={{ textAlign: "right" }}>
                      <span className={styles.mobileLabel}>수익금액 (수익률)</span>
                      <div className={styles.mobileProfitContainer}>
                        <span className={isProfit ? styles.profit : styles.loss} style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                          {isProfit ? "+" : ""}{formatActiveVal(h.profitAmount, h.currency)}
                        </span>
                        <span className={`${styles.profitRate} ${isProfit ? styles.profitBg : styles.lossBg}`} style={{ padding: "0.1rem 0.35rem", fontSize: "0.65rem" }}>
                          {h.profitPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
