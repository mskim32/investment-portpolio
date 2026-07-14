"use client";

import React from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { DollarSign, TrendingUp, Landmark, ArrowUpRight, ArrowDownRight } from "lucide-react";
import styles from "./DashboardSummary.module.css";

export const DashboardSummary: React.FC = () => {
  const {
    totalAssetsValue,
    totalInvestedAmount,
    totalProfitAmount,
    totalProfitPercent,
    activeCurrency,
  } = usePortfolio();

  const formatVal = (val: number) => {
    if (activeCurrency === "KRW") {
      return "₩" + Math.round(val).toLocaleString("ko-KR");
    } else {
      return "$" + val.toLocaleString("en-US", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  };

  const isProfit = totalProfitAmount >= 0;

  // Mini Sparkline SVG paths for rich financial aesthetic
  const upPath = "M0,25 C10,23 20,10 30,12 C40,15 50,5 60,8 C70,10 80,2 90,4 L90,30 L0,30 Z";
  const downPath = "M0,5 C10,8 20,18 30,15 C40,12 50,22 60,20 C70,18 80,26 90,28 L90,30 L0,30 Z";
  const flatPath = "M0,15 C10,14 20,16 30,15 C40,15 50,14 60,15 C70,15 80,16 90,15 L90,30 L0,30 Z";

  return (
    <div className={styles.summaryGrid}>
      {/* Total Assets Card */}
      <div className={`glass-card ${styles.card}`}>
        <div className={styles.cardHeader}>
          <div className={styles.iconContainer}>
            <Landmark size={20} className={styles.icon} />
          </div>
          <span className={styles.cardLabel}>총 순자산 (Net Worth)</span>
        </div>
        <div className={styles.cardBody}>
          <h2 className={styles.cardValue}>{formatVal(totalAssetsValue)}</h2>
          <span className={styles.cardSubtext}>현금성 자산 + 평가 금액</span>
        </div>
        <div className={styles.sparkline}>
          <svg viewBox="0 0 90 30" className={styles.sparklineSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id="glow-assets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,20 C15,18 30,22 45,15 C60,10 75,5 90,2" fill="none" stroke="var(--primary)" strokeWidth="1.5" />
            <path d="M0,20 C15,18 30,22 45,15 C60,10 75,5 90,2 L90,30 L0,30 Z" fill="url(#glow-assets)" />
          </svg>
        </div>
      </div>

      {/* Invested Amount Card */}
      <div className={`glass-card ${styles.card}`}>
        <div className={styles.cardHeader}>
          <div className={styles.iconContainer} style={{ background: "rgba(95, 93, 236, 0.1)" }}>
            <DollarSign size={20} className={styles.icon} style={{ color: "var(--accent-cyan)" }} />
          </div>
          <span className={styles.cardLabel}>총 투자 원금 (Invested)</span>
        </div>
        <div className={styles.cardBody}>
          <h2 className={styles.cardValue}>{formatVal(totalInvestedAmount)}</h2>
          <span className={styles.cardSubtext}>계좌 설정 원금 + 순수 입출금</span>
        </div>
        <div className={styles.sparkline}>
          <svg viewBox="0 0 90 30" className={styles.sparklineSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id="glow-invested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,22 C15,22 30,20 45,21 C60,20 75,18 90,18" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
            <path d="M0,22 C15,22 30,20 45,21 C60,20 75,18 90,18 L90,30 L0,30 Z" fill="url(#glow-invested)" />
          </svg>
        </div>
      </div>

      {/* Profit / Loss Card */}
      <div className={`glass-card ${styles.card} ${isProfit ? styles.profitBorder : styles.lossBorder}`}>
        <div className={styles.cardHeader}>
          <div 
            className={styles.iconContainer} 
            style={{ 
              background: isProfit ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" 
            }}
          >
            <TrendingUp 
              size={20} 
              className={styles.icon} 
              style={{ color: isProfit ? "var(--profit)" : "var(--loss)" }} 
            />
          </div>
          <span className={styles.cardLabel}>총 평가 손익 (Profit & Loss)</span>
        </div>
        <div className={styles.cardBody}>
          <h2 className={`${styles.cardValue} ${isProfit ? styles.profitText : styles.lossText}`}>
            {isProfit ? "+" : ""}{formatVal(totalProfitAmount)}
          </h2>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${isProfit ? styles.profitBadge : styles.lossBadge}`}>
              {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {isProfit ? "+" : ""}{totalProfitPercent.toFixed(2)}%
            </span>
            <span className={styles.cardSubtext}>대비 자산 수익률</span>
          </div>
        </div>
        <div className={styles.sparkline}>
          <svg viewBox="0 0 90 30" className={styles.sparklineSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id="glow-profit" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="0%" 
                  stopColor={isProfit ? "var(--profit)" : "var(--loss)"} 
                  stopOpacity="0.2" 
                />
                <stop 
                  offset="100%" 
                  stopColor={isProfit ? "var(--profit)" : "var(--loss)"} 
                  stopOpacity="0" 
                />
              </linearGradient>
            </defs>
            <path 
              d={isProfit ? "M0,25 C15,22 30,10 45,15 C60,8 75,5 90,2" : "M0,5 C15,8 30,18 45,15 C60,20 75,25 90,28"} 
              fill="none" 
              stroke={isProfit ? "var(--profit)" : "var(--loss)"} 
              strokeWidth="1.5" 
            />
            <path 
              d={isProfit ? "M0,25 C15,22 30,10 45,15 C60,8 75,5 90,2 L90,30 L0,30 Z" : "M0,5 C15,8 30,18 45,15 C60,20 75,25 90,28 L90,30 L0,30 Z"} 
              fill="url(#glow-profit)" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
