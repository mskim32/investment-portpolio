"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Account, AutoTransfer, AutoBuy, AssetType } from "@/types/portfolio";
import { Plus, Trash2, Wallet, X, Check, Edit2, Calendar, Coins, ArrowRightLeft, Sparkles } from "lucide-react";
import styles from "./AccountManager.module.css";

const PRESET_COLORS = [
  "#6366F1", // Indigo
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
];

export const AccountManager: React.FC = () => {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    editAccountCash,
    addAutoTransfer,
    deleteAutoTransfer,
    addAutoBuy,
    deleteAutoBuy,
    accountValuations,
  } = usePortfolio();

  const [isAdding, setIsAdding] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("brokerage");
  const [currency, setCurrency] = useState<Account["currency"]>("KRW");
  const [cash, setCash] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Expansion state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"transfers" | "buys">("transfers");

  // Subform - Auto Transfer states
  const [tfType, setTfType] = useState<"deposit" | "withdraw">("deposit");
  const [tfDay, setTfDay] = useState("10");
  const [tfAmount, setTfAmount] = useState("");
  const [tfDesc, setTfDesc] = useState("");

  // Subform - Auto Buy states
  const [abFreq, setAbFreq] = useState<"weekly" | "monthly">("monthly");
  const [abDayOfWeek, setAbDayOfWeek] = useState("1");
  const [abDayOfMonth, setAbDayOfMonth] = useState("10");
  const [abSymbol, setAbSymbol] = useState("");
  const [abName, setAbName] = useState("");
  const [abQty, setAbQty] = useState("");
  const [abAssetType, setAbAssetType] = useState<AssetType>("stock_kr");

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

  const handleCancel = () => {
    setIsAdding(false);
    setEditingAccountId(null);
    setName("");
    setType("brokerage");
    setCurrency("KRW");
    setCash("");
    setSelectedColor(PRESET_COLORS[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cashVal = Number(cash) || 0;

    if (editingAccountId) {
      updateAccount(editingAccountId, {
        name: name.trim(),
        type,
        currency,
        cash: cashVal,
        initialBalance: cashVal,
        color: selectedColor,
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        currency,
        cash: cashVal,
        color: selectedColor,
        autoTransfers: [],
        autoBuys: [],
      });
    }

    handleCancel();
  };

  const startEditing = (acc: Account) => {
    setEditingAccountId(acc.id);
    setName(acc.name);
    setType(acc.type);
    setCurrency(acc.currency);
    setCash((acc.initialBalance ?? acc.cash).toString());
    setSelectedColor(acc.color || PRESET_COLORS[0]);
    setIsAdding(true);
  };

  const handleCardClick = (id: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't expand if user clicks edit, delete, input, or check buttons
    if (target.closest("button") || target.closest("input") || target.closest("svg")) {
      return;
    }
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddTransferSubmit = (e: React.FormEvent, accId: string) => {
    e.preventDefault();
    const amountVal = Number(tfAmount);
    const dayVal = Number(tfDay);
    if (!amountVal || !dayVal || dayVal < 1 || dayVal > 31) return;

    addAutoTransfer(accId, {
      type: tfType,
      day: dayVal,
      amount: amountVal,
      description: tfDesc.trim() || undefined,
    });
    setTfAmount("");
    setTfDesc("");
  };

  const handleAddBuySubmit = (e: React.FormEvent, accId: string) => {
    e.preventDefault();
    const qtyVal = Number(abQty);
    if (!abSymbol.trim() || !abName.trim() || !qtyVal || qtyVal <= 0) return;

    addAutoBuy(accId, {
      frequency: abFreq,
      dayOfWeek: abFreq === "weekly" ? Number(abDayOfWeek) : undefined,
      dayOfMonth: abFreq === "monthly" ? Number(abDayOfMonth) : undefined,
      symbol: abSymbol.trim().toUpperCase(),
      name: abName.trim(),
      quantity: qtyVal,
      assetType: abAssetType,
    });
    setAbSymbol("");
    setAbName("");
    setAbQty("");
  };

  return (
    <div className={`glass-card ${styles.container}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Wallet size={18} className={styles.headerIcon} />
          <h3 className={styles.title}>내 계좌 관리</h3>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setEditingAccountId(null);
              setIsAdding(true);
            }}
            className="btn btn-secondary btn-sm"
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
          >
            <Plus size={14} /> 계좌 추가
          </button>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className={styles.addForm}>
          <div className={styles.formHeader}>
            <span className={styles.formTitle}>{editingAccountId ? "계좌 정보 수정" : "새 계좌 등록"}</span>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelBtn}
            >
              <X size={16} />
            </button>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>계좌명</label>
            <input
              type="text"
              placeholder="예: 신한투자증권, 개인 코인지갑"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>종류</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="brokerage">증권사 (주식)</option>
                <option value="crypto_wallet">지갑 (가상자산)</option>
                <option value="bank">은행 (예적금)</option>
                <option value="other">기타 자산</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>기준통화</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as any)}>
                <option value="KRW">KRW (원화)</option>
                <option value="USD">USD (달러)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>초기 현금 잔고 (원금)</label>
            <input
              type="number"
              placeholder="0"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
            />
          </div>

          {/* Color Picker */}
          <div className={styles.formGroup}>
            <label className={styles.label}>계좌 테마 색상</label>
            <div className={styles.colorPicker}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`${styles.colorBubble} ${selectedColor === c ? styles.activeColor : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
            {editingAccountId ? "계좌 정보 수정하기" : "계좌 생성하기"}
          </button>
        </form>
      ) : (
        <div className={styles.accountList}>
          {accounts.map((acc) => (
            <div key={acc.id} className={styles.accountItem}>
              {/* Account Header Card */}
              <div 
                className={`${styles.accountCard} ${expandedId === acc.id ? styles.cardActive : ""}`} 
                style={{ borderLeftColor: acc.color }}
                onClick={(e) => handleCardClick(acc.id, e)}
              >
                <div className={styles.accountInfo}>
                  <div className={styles.accountNameRow}>
                    <div className={styles.colorDot} style={{ backgroundColor: acc.color }} />
                    <span className={styles.accountName}>{acc.name}</span>
                    <span className={styles.accountTypeBadge}>
                      {acc.type === "brokerage" ? "증권" : acc.type === "crypto_wallet" ? "지갑" : acc.type === "bank" ? "은행" : "기타"}
                    </span>
                  </div>

                  <div className={styles.cashRow}>
                    <span className={styles.cashValue}>
                      {formatCurrency(accountValuations[acc.id] ?? acc.cash, acc.currency)}
                    </span>
                    <button onClick={() => startEditing(acc)} className={styles.editBtn} title="계좌 정보 수정">
                      <Edit2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Indicators & Delete Account */}
                <div className={styles.actionBlock}>
                  {(acc.autoTransfers?.length || acc.autoBuys?.length) ? (
                    <span className={styles.autoBadge} title="자동 이체/매수 예약 설정됨">
                      <Sparkles size={11} /> Auto
                    </span>
                  ) : null}
                  <button
                    onClick={() => {
                      if (confirm(`'${acc.name}' 계좌를 정말 삭제하시겠습니까?\n이 계좌와 관련된 모든 거래 내역과 자동 일정도 함께 삭제됩니다.`)) {
                        deleteAccount(acc.id);
                      }
                    }}
                    className={styles.deleteBtn}
                    title="계좌 삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Account Expand Details Panel (Auto transfer & Auto buy settings) */}
              {expandedId === acc.id && (
                <div className={styles.detailsPanel}>
                  <div className={styles.subTabRow}>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab("transfers")}
                      className={`${styles.subTabBtn} ${activeSubTab === "transfers" ? styles.subTabActive : ""}`}
                    >
                      <ArrowRightLeft size={12} /> 자동이체 ({acc.autoTransfers?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab("buys")}
                      className={`${styles.subTabBtn} ${activeSubTab === "buys" ? styles.subTabActive : ""}`}
                    >
                      <Coins size={12} /> 자동매수 ({acc.autoBuys?.length || 0})
                    </button>
                  </div>

                  {activeSubTab === "transfers" ? (
                    <div className={styles.subSection}>
                      {/* List existing transfers */}
                      <div className={styles.scheduleList}>
                        {(acc.autoTransfers || []).map((t) => (
                          <div key={t.id} className={styles.scheduleItem}>
                            <div className={styles.scheduleMain}>
                              <span className={`${styles.tfTypeBadge} ${t.type === "deposit" ? styles.tfDeposit : styles.tfWithdraw}`}>
                                {t.type === "deposit" ? "입금" : "출금"}
                              </span>
                              <span className={styles.scheduleText}>
                                매월 <strong>{t.day}일</strong> · {formatCurrency(t.amount, acc.currency)}
                              </span>
                              {t.description && <span className={styles.scheduleDesc}>{t.description}</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteAutoTransfer(acc.id, t.id)}
                              className={styles.scheduleDelBtn}
                              title="삭제"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {(acc.autoTransfers || []).length === 0 && (
                          <span className={styles.noSchedules}>등록된 자동이체 일정이 없습니다.</span>
                        )}
                      </div>

                      {/* Add transfer form */}
                      <form onSubmit={(e) => handleAddTransferSubmit(e, acc.id)} className={styles.subForm}>
                        <span className={styles.subFormTitle}>자동이체 설정 추가</span>
                        <div className={styles.formRow}>
                          <select value={tfType} onChange={(e) => setTfType(e.target.value as any)} className={styles.subSelect}>
                            <option value="deposit">매달 입금</option>
                            <option value="withdraw">매달 출금</option>
                          </select>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="매월 이체일(1-31)"
                            value={tfDay}
                            onChange={(e) => setTfDay(e.target.value)}
                            className={styles.subInput}
                            required
                          />
                        </div>
                        <div className={styles.formRow}>
                          <input
                            type="number"
                            placeholder={`이체금액 (${acc.currency === "USD" ? "$" : "₩"})`}
                            value={tfAmount}
                            onChange={(e) => setTfAmount(e.target.value)}
                            className={styles.subInput}
                            required
                          />
                          <input
                            type="text"
                            placeholder="설명 (예: 월급)"
                            value={tfDesc}
                            onChange={(e) => setTfDesc(e.target.value)}
                            className={styles.subInput}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%", padding: "0.45rem", fontSize: "0.75rem" }}>
                          자동이체 등록
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className={styles.subSection}>
                      {/* List existing buys */}
                      <div className={styles.scheduleList}>
                        {(acc.autoBuys || []).map((b) => (
                          <div key={b.id} className={styles.scheduleItem}>
                            <div className={styles.scheduleMain}>
                              <span className={styles.buyTypeBadge}>
                                {b.frequency === "weekly" ? `매주 ${["일", "월", "화", "수", "목", "금", "토"][b.dayOfWeek || 1]}요일` : `매월 ${b.dayOfMonth}일`}
                              </span>
                              <span className={styles.scheduleText}>
                                <strong>{b.name}</strong> ({b.symbol}) · {b.quantity}주
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteAutoBuy(acc.id, b.id)}
                              className={styles.scheduleDelBtn}
                              title="삭제"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {(acc.autoBuys || []).length === 0 && (
                          <span className={styles.noSchedules}>등록된 자동매수 일정이 없습니다.</span>
                        )}
                      </div>

                      {/* Add buy form */}
                      <form onSubmit={(e) => handleAddBuySubmit(e, acc.id)} className={styles.subForm}>
                        <span className={styles.subFormTitle}>자동매수 설정 추가</span>
                        <div className={styles.formRow}>
                          <select value={abFreq} onChange={(e) => setAbFreq(e.target.value as any)} className={styles.subSelect}>
                            <option value="weekly">매주</option>
                            <option value="monthly">매달</option>
                          </select>
                          {abFreq === "weekly" ? (
                            <select value={abDayOfWeek} onChange={(e) => setAbDayOfWeek(e.target.value)} className={styles.subSelect}>
                              <option value="1">월요일</option>
                              <option value="2">화요일</option>
                              <option value="3">수요일</option>
                              <option value="4">목요일</option>
                              <option value="5">금요일</option>
                              <option value="6">토요일</option>
                              <option value="0">일요일</option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="매월 매수일(1-31)"
                              value={abDayOfMonth}
                              onChange={(e) => setAbDayOfMonth(e.target.value)}
                              className={styles.subInput}
                              required
                            />
                          )}
                        </div>

                        {/* Quick suggestions */}
                        <div className={styles.miniSuggestions}>
                          {[
                            { symbol: "005930.KS", name: "삼성전자", type: "stock_kr" as AssetType },
                            { symbol: "AAPL", name: "애플", type: "stock_us" as AssetType },
                            { symbol: "TSLA", name: "테슬라", type: "stock_us" as AssetType },
                            { symbol: "BTC", name: "비트코인", type: "crypto" as AssetType },
                          ].map((s) => (
                            <button
                              type="button"
                              key={s.symbol}
                              onClick={() => {
                                setAbSymbol(s.symbol);
                                setAbName(s.name);
                                setAbAssetType(s.type);
                              }}
                              className={styles.miniSugBtn}
                            >
                              +{s.name}
                            </button>
                          ))}
                        </div>

                        <div className={styles.formRow}>
                          <input
                            type="text"
                            placeholder="심볼 (AAPL, 005930.KS)"
                            value={abSymbol}
                            onChange={(e) => setAbSymbol(e.target.value)}
                            className={styles.subInput}
                            required
                          />
                          <input
                            type="text"
                            placeholder="종목명"
                            value={abName}
                            onChange={(e) => setAbName(e.target.value)}
                            className={styles.subInput}
                            required
                          />
                        </div>

                        <div className={styles.formRow}>
                          <input
                            type="number"
                            step="any"
                            placeholder="매수 수량"
                            value={abQty}
                            onChange={(e) => setAbQty(e.target.value)}
                            className={styles.subInput}
                            required
                          />
                          <select value={abAssetType} onChange={(e) => setAbAssetType(e.target.value as any)} className={styles.subSelect}>
                            <option value="stock_kr">국내주식</option>
                            <option value="stock_us">미국주식</option>
                            <option value="crypto">가상자산</option>
                            <option value="etc">기타/수기 자산</option>
                          </select>
                        </div>

                        <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%", padding: "0.45rem", fontSize: "0.75rem" }}>
                          자동매수 등록
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
