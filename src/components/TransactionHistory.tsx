"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Transaction } from "@/types/portfolio";
import { Trash2, Edit2, History, ArrowUpRight, ArrowDownRight, CornerDownLeft, CornerUpRight } from "lucide-react";
import styles from "./TransactionHistory.module.css";

interface TransactionHistoryProps {
  onEditTransactionClick: (tx: Transaction) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ onEditTransactionClick }) => {
  const {
    transactions,
    accounts,
    deleteTransaction,
    activeCurrency,
    exchangeRate,
  } = usePortfolio();

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

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

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || "알 수 없는 계좌";
  };

  const getTxTypeBadge = (type: Transaction["type"]) => {
    switch (type) {
      case "buy":
        return <span className={`${styles.badge} ${styles.badgeBuy}`}>매수</span>;
      case "sell":
        return <span className={`${styles.badge} ${styles.badgeSell}`}>매도</span>;
      case "deposit":
        return <span className={`${styles.badge} ${styles.badgeDeposit}`}>입금</span>;
      case "withdraw":
        return <span className={`${styles.badge} ${styles.badgeWithdraw}`}>출금</span>;
    }
  };

  const getTxTypeIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "buy":
        return <ArrowDownRight size={14} className={styles.iconBuy} />;
      case "sell":
        return <ArrowUpRight size={14} className={styles.iconSell} />;
      case "deposit":
        return <CornerDownLeft size={14} className={styles.iconDeposit} />;
      case "withdraw":
        return <CornerUpRight size={14} className={styles.iconWithdraw} />;
    }
  };

  const filteredTransactions = React.useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
      .filter((t) => {
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (accountFilter !== "all" && t.accountId !== accountFilter) return false;
        return true;
      });
  }, [transactions, typeFilter, accountFilter]);

  return (
    <div className={`glass-card ${styles.container}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <History size={18} className={styles.headerIcon} />
          <h3 className={styles.title}>최근 거래 내역</h3>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">모든 계좌</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">모든 구분</option>
            <option value="buy">매수</option>
            <option value="sell">매도</option>
            <option value="deposit">입금</option>
            <option value="withdraw">출금</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {filteredTransactions.length === 0 ? (
        <div className={styles.emptyState}>
          <span>거래 내역이 없습니다.</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>계좌</th>
                  <th>구분</th>
                  <th>자산명 (심볼)</th>
                  <th style={{ textAlign: "right" }}>거래 수량</th>
                  <th style={{ textAlign: "right" }}>거래 단가 / 금액</th>
                  <th style={{ textAlign: "right" }}>총 거래 금액</th>
                  <th style={{ textAlign: "center" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const account = accounts.find((a) => a.id === tx.accountId);
                  const currency = tx.currency || account?.currency || (tx.assetType === "stock_kr" ? "KRW" : "USD");
                  const isTrade = tx.type === "buy" || tx.type === "sell";
                  const totalAmount = isTrade ? tx.quantity * tx.price : tx.price;

                  return (
                    <tr key={tx.id}>
                      <td style={{ color: "var(--text-secondary)" }}>{tx.date}</td>
                      <td>{getAccountName(tx.accountId)}</td>
                      <td>
                        <div className={styles.typeCol}>
                          {getTxTypeIcon(tx.type)}
                          {getTxTypeBadge(tx.type)}
                        </div>
                      </td>
                      <td>
                        {isTrade ? (
                          <div className={styles.assetCol}>
                            <span className={styles.assetName}>{tx.name}</span>
                            <span className={styles.assetSymbol}>{tx.symbol}</span>
                          </div>
                        ) : (
                          <span className={styles.cashLabel}>현금 흐름</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isTrade ? tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "-"}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                        {formatCurrency(tx.price, currency)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatCurrency(totalAmount, currency)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className={styles.actionGroup}>
                          <button
                            onClick={() => onEditTransactionClick(tx)}
                            className={styles.editBtn}
                            title="수정"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("정말로 이 거래 내역을 삭제하시겠습니까? 계좌 잔고가 되돌아갑니다.")) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className={styles.deleteBtn}
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className={styles.mobileList}>
            {filteredTransactions.map((tx) => {
              const account = accounts.find((a) => a.id === tx.accountId);
              const currency = tx.currency || account?.currency || (tx.assetType === "stock_kr" ? "KRW" : "USD");
              const isTrade = tx.type === "buy" || tx.type === "sell";
              const totalAmount = isTrade ? tx.quantity * tx.price : tx.price;

              return (
                <div key={tx.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <span className={styles.mobileDate}>{tx.date}</span>
                    <div className={styles.actionGroup}>
                      <button
                        onClick={() => onEditTransactionClick(tx)}
                        className={styles.editBtn}
                        title="수정"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("정말로 이 거래 내역을 삭제하시겠습니까? 계좌 잔고가 되돌아갑니다.")) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className={styles.deleteBtn}
                        title="삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.mobileCardMain}>
                    <div className={styles.mobileAssetInfo}>
                      <div className={styles.typeCol}>
                        {getTxTypeIcon(tx.type)}
                        {getTxTypeBadge(tx.type)}
                      </div>
                      {isTrade ? (
                        <div className={styles.assetCol} style={{ marginLeft: "0.25rem" }}>
                          <span className={styles.assetName}>{tx.name}</span>
                          <span className={styles.assetSymbol}>{tx.symbol}</span>
                        </div>
                      ) : (
                        <span className={styles.cashLabel} style={{ marginLeft: "0.25rem" }}>현금 흐름</span>
                      )}
                    </div>
                    <div className={styles.mobileAmountInfo}>
                      <span className={styles.mobileTotalAmount}>
                        {formatCurrency(totalAmount, currency)}
                      </span>
                      <span className={styles.mobileAccountName}>
                        {getAccountName(tx.accountId)}
                      </span>
                    </div>
                  </div>

                  {isTrade && (
                    <div className={styles.mobileCardDetails}>
                      <span>수량: {tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                      <span>단가: {formatCurrency(tx.price, currency)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
