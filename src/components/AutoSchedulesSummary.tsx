"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { ArrowRightLeft, Coins, Trash2, Calendar, AlertCircle } from "lucide-react";
import styles from "./AutoSchedulesSummary.module.css";

export const AutoSchedulesSummary: React.FC = () => {
  const { accounts, deleteAutoTransfer, deleteAutoBuy } = usePortfolio();
  const [activeTab, setActiveTab] = useState<"transfers" | "buys">("transfers");

  // Collect all auto transfers with account context
  const allTransfers = React.useMemo(() => {
    const list: Array<{
      accountId: string;
      accountName: string;
      accountColor: string;
      currency: "KRW" | "USD";
      id: string;
      day: number;
      amount: number;
      type: "deposit" | "withdraw";
      description?: string;
    }> = [];

    accounts.forEach((acc) => {
      if (acc.autoTransfers) {
        acc.autoTransfers.forEach((tf) => {
          list.push({
            accountId: acc.id,
            accountName: acc.name,
            accountColor: acc.color || "#6366F1",
            currency: acc.currency,
            ...tf,
          });
        });
      }
    });

    // Sort by day of month
    return list.sort((a, b) => a.day - b.day);
  }, [accounts]);

  // Collect all auto buys with account context
  const allBuys = React.useMemo(() => {
    const list: Array<{
      accountId: string;
      accountName: string;
      accountColor: string;
      id: string;
      frequency: "weekly" | "monthly";
      dayOfWeek?: number;
      dayOfMonth?: number;
      symbol: string;
      name: string;
      quantity: number;
      assetType: string;
    }> = [];

    accounts.forEach((acc) => {
      if (acc.autoBuys) {
        acc.autoBuys.forEach((ab) => {
          list.push({
            accountId: acc.id,
            accountName: acc.name,
            accountColor: acc.color || "#6366F1",
            ...ab,
          });
        });
      }
    });

    // Sort: monthly by day of month, weekly by day of week
    return list.sort((a, b) => {
      if (a.frequency !== b.frequency) {
        return a.frequency === "monthly" ? -1 : 1; // Monthly first
      }
      if (a.frequency === "monthly") {
        return (a.dayOfMonth || 0) - (b.dayOfMonth || 0);
      } else {
        return (a.dayOfWeek || 0) - (b.dayOfWeek || 0);
      }
    });
  }, [accounts]);

  const formatCurrency = (val: number, currency: "KRW" | "USD") => {
    if (currency === "KRW") {
      return "₩" + Math.round(val).toLocaleString("ko-KR");
    } else {
      return "$" + val.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  };

  const getDayOfWeekName = (day?: number) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[day ?? 1] + "요일";
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case "stock_kr":
        return "국내주식";
      case "stock_us":
        return "미국주식";
      case "crypto":
        return "가상자산";
      default:
        return "기타";
    }
  };

  return (
    <div className={`glass-card ${styles.container}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Calendar size={18} className={styles.headerIcon} />
          <h3 className={styles.title}>전체 자동 일정 목록</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabRow}>
        <button
          type="button"
          onClick={() => setActiveTab("transfers")}
          className={`${styles.tabBtn} ${activeTab === "transfers" ? styles.tabActive : ""}`}
        >
          <ArrowRightLeft size={13} />
          <span>자동이체 ({allTransfers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("buys")}
          className={`${styles.tabBtn} ${activeTab === "buys" ? styles.tabActive : ""}`}
        >
          <Coins size={13} />
          <span>자동매수 ({allBuys.length})</span>
        </button>
      </div>

      {/* List content */}
      <div className={styles.contentBody}>
        {activeTab === "transfers" ? (
          allTransfers.length === 0 ? (
            <div className={styles.emptyState}>
              <AlertCircle size={16} className={styles.emptyIcon} />
              <span>등록된 자동이체 일정이 없습니다.</span>
            </div>
          ) : (
            <div className={styles.list}>
              {allTransfers.map((t) => (
                <div key={t.id} className={styles.item} style={{ borderLeftColor: t.accountColor }}>
                  <div className={styles.itemMain}>
                    <div className={styles.accountRow}>
                      <span
                        className={styles.accountTag}
                        style={{
                          backgroundColor: `${t.accountColor}12`,
                          color: t.accountColor,
                          borderColor: `${t.accountColor}25`,
                        }}
                      >
                        {t.accountName}
                      </span>
                      <span className={styles.scheduleText}>
                        매월 <strong>{t.day}일</strong> 자동 이체
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={`${styles.typeBadge} ${t.type === "deposit" ? styles.deposit : styles.withdraw}`}>
                        {t.type === "deposit" ? "입금" : "출금"}
                      </span>
                      <span className={styles.amountText}>{formatCurrency(t.amount, t.currency)}</span>
                      {t.description && <span className={styles.descText}>· {t.description}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`'${t.accountName}' 계좌의 자동이체 일정을 삭제하시겠습니까?`)) {
                        deleteAutoTransfer(t.accountId, t.id);
                      }
                    }}
                    className={styles.deleteBtn}
                    title="일정 삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : allBuys.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={16} className={styles.emptyIcon} />
            <span>등록된 자동매수 일정이 없습니다.</span>
          </div>
        ) : (
          <div className={styles.list}>
            {allBuys.map((b) => (
              <div key={b.id} className={styles.item} style={{ borderLeftColor: b.accountColor }}>
                <div className={styles.itemMain}>
                  <div className={styles.accountRow}>
                    <span
                      className={styles.accountTag}
                      style={{
                        backgroundColor: `${b.accountColor}12`,
                        color: b.accountColor,
                        borderColor: `${b.accountColor}25`,
                      }}
                    >
                      {b.accountName}
                    </span>
                    <span className={styles.scheduleText}>
                      {b.frequency === "weekly" ? `매주 ${getDayOfWeekName(b.dayOfWeek)}` : `매월 ${b.dayOfMonth}일`} 자동 매수
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.assetBadge}>{getAssetTypeLabel(b.assetType)}</span>
                    <span className={styles.nameText}>
                      <strong>{b.name}</strong> ({b.symbol})
                    </span>
                    <span className={styles.qtyText}>{b.quantity}주</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`'${b.accountName}' 계좌의 자동매수 일정을 삭제하시겠습니까?`)) {
                      deleteAutoBuy(b.accountId, b.id);
                    }
                  }}
                  className={styles.deleteBtn}
                  title="일정 삭제"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
