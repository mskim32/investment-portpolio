"use client";

import React, { useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Transaction, AssetType } from "@/types/portfolio";
import { X, Plus, Calendar, Coins, DollarSign, Tag, Info } from "lucide-react";
import styles from "./TransactionModal.module.css";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

// Quick suggestions for easy testing and wow factor
const SUGGESTIONS = [
  { symbol: "005930.KS", name: "삼성전자", assetType: "stock_kr" as AssetType },
  { symbol: "AAPL", name: "Apple Inc.", assetType: "stock_us" as AssetType },
  { symbol: "TSLA", name: "Tesla Inc.", assetType: "stock_us" as AssetType },
  { symbol: "BTC", name: "Bitcoin", assetType: "crypto" as AssetType },
  { symbol: "ETH", name: "Ethereum", assetType: "crypto" as AssetType },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, editingTransaction }) => {
  const { accounts, addTransaction, editTransaction } = usePortfolio();

  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState<Transaction["type"]>("buy");
  const [assetType, setAssetType] = useState<AssetType>("stock_kr");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");
  const [date, setDate] = useState("");
  const [customYield, setCustomYield] = useState("");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<"symbol" | "name" | null>(null);

  // Search autocomplete symbol or name effect
  useEffect(() => {
    const query = activeSearchField === "symbol" ? symbol : activeSearchField === "name" ? name : "";
    
    if (assetType === "etc" || !query.trim() || (activeSearchField === "symbol" && symbol === name) || (activeSearchField === "name" && name === symbol)) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${assetType}`);
        const json = await res.json();
        if (json.success && json.quotes) {
          setSearchResults(json.quotes);
          setShowDropdown(json.quotes.length > 0);
        } else {
          setSearchResults([]);
          setShowDropdown(false);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [symbol, name, activeSearchField, assetType]);

  const handleSelectQuote = (quote: { symbol: string; name: string; assetType: AssetType }) => {
    setSymbol(quote.symbol);
    setName(quote.name);
    setAssetType(quote.assetType);
    setSearchResults([]);
    setShowDropdown(false);
    setActiveSearchField(null);
  };

  // Default setup on open or when editingTransaction changes
  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setAccountId(editingTransaction.accountId);
        setType(editingTransaction.type);
        setAssetType(editingTransaction.assetType);
        setSymbol(editingTransaction.symbol);
        setName(editingTransaction.name);
        setQuantity(editingTransaction.quantity > 0 ? editingTransaction.quantity.toString() : "");
        setPrice(editingTransaction.price.toString());
        setFee(editingTransaction.fee ? editingTransaction.fee.toString() : "");
        setDate(editingTransaction.date);
        setCustomYield(editingTransaction.customYield !== undefined ? editingTransaction.customYield.toString() : "");
      } else {
        if (accounts.length > 0) {
          setAccountId(accounts[0].id);
        }
        setType("buy");
        setAssetType("stock_kr");
        setSymbol("");
        setName("");
        setQuantity("");
        setPrice("");
        setFee("");
        setCustomYield("");
        // Default date to today
        const today = new Date().toISOString().split("T")[0];
        setDate(today);
      }
    }
  }, [isOpen, editingTransaction, accounts]);

  if (!isOpen) return null;

  const handleSuggestionClick = (sug: typeof SUGGESTIONS[0]) => {
    setSymbol(sug.symbol);
    setName(sug.name);
    setAssetType(sug.assetType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      alert("거래를 등록할 계좌를 먼저 선택해 주세요.");
      return;
    }

    const qtyVal = Number(quantity);
    const priceVal = Number(price);
    const feeVal = Number(fee) || 0;

    const isTrade = type === "buy" || type === "sell";

    if (isTrade) {
      const isSymbolRequired = assetType !== "etc";
      if ((isSymbolRequired && !symbol.trim()) || !name.trim() || qtyVal <= 0 || priceVal <= 0) {
        alert(isSymbolRequired ? "모든 자산 상세 정보(심볼, 이름, 수량, 가격)를 입력해 주세요." : "자산 이름, 수량, 가격을 모두 입력해 주세요.");
        return;
      }
    } else {
      // Deposit/Withdrawal uses price field as cash amount
      if (priceVal <= 0) {
        alert("올바른 거래 금액을 입력해 주세요.");
        return;
      }
    }

    const txData = {
      accountId,
      type,
      assetType,
      symbol: isTrade ? (assetType === "etc" ? `ETC_${name.trim()}` : symbol.trim().toUpperCase()) : "CASH",
      name: isTrade ? name.trim() : `${type === "deposit" ? "입금" : "출금"}`,
      quantity: isTrade ? qtyVal : 0,
      price: priceVal,
      date,
      fee: feeVal > 0 ? feeVal : undefined,
      customYield: isTrade && assetType === "etc" && customYield.trim() !== "" ? Number(customYield) : undefined,
    };

    if (editingTransaction) {
      editTransaction(editingTransaction.id, txData);
    } else {
      addTransaction(txData);
    }

    // Reset Form
    setSymbol("");
    setName("");
    setQuantity("");
    setPrice("");
    setFee("");
    setCustomYield("");
    onClose();
  };

  const activeAccount = accounts.find((a) => a.id === accountId);
  const currencySymbol = activeAccount?.currency === "USD" ? "$" : "₩";

  return (
    <div className={styles.overlay}>
      <div className={`glass-card ${styles.modal} animate-slide-up`}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Plus size={18} className={styles.headerIcon} />
            <h3 className={styles.title}>{editingTransaction ? "거래 기록 수정" : "거래 기록 등록"}</h3>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className={styles.emptyAccounts}>
            <Info size={28} />
            <p>등록된 계좌가 없습니다. 먼저 메인 화면에서 계좌를 하나 이상 등록해 주세요!</p>
            <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: "1rem" }}>
              닫기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Account Select */}
            <div className={styles.formGroup}>
              <label className={styles.label}>해당 계좌</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Tx Type Toggles */}
            <div className={styles.formGroup}>
              <label className={styles.label}>거래 구분</label>
              <div className={styles.typeSelector}>
                {(["buy", "sell", "deposit", "withdraw"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      if (t === "deposit" || t === "withdraw") {
                        setAssetType("cash");
                      } else if (assetType === "cash") {
                        setAssetType("stock_kr");
                      }
                    }}
                    className={`${styles.typeBtn} ${type === t ? styles[`typeActive_${t}`] : ""}`}
                  >
                    {t === "buy" ? "매수" : t === "sell" ? "매도" : t === "deposit" ? "입금" : "출금"}
                  </button>
                ))}
              </div>
            </div>

            {(type === "buy" || type === "sell") && (
              <>
                {/* Asset Type Select */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>자산 분류</label>
                  <select value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
                    <option value="stock_us">미국 주식</option>
                    <option value="stock_kr">한국 주식</option>
                    <option value="crypto">암호화폐</option>
                    <option value="etc">기타/수기 자산</option>
                  </select>
                </div>

                {/* Quick suggestions */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>간편 입력 추천</label>
                  <div className={styles.suggestions}>
                    {SUGGESTIONS.map((sug) => (
                      <button
                        key={sug.symbol}
                        type="button"
                        onClick={() => handleSuggestionClick(sug)}
                        className={styles.sugBtn}
                      >
                        {sug.name} ({sug.symbol})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symbol & Name */}
                <div className={styles.formRow}>
                  {assetType !== "etc" ? (
                    <>
                      <div className={styles.formGroup} style={{ position: "relative" }}>
                        <label className={styles.label}>티커/심볼</label>
                        <div className={styles.autocompleteContainer}>
                          <input
                            type="text"
                            placeholder="예: AAPL, 005930.KS"
                            value={symbol}
                            onChange={(e) => {
                              setSymbol(e.target.value);
                              setActiveSearchField("symbol");
                            }}
                            onFocus={() => {
                              setActiveSearchField("symbol");
                              if (searchResults.length > 0) setShowDropdown(true);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setShowDropdown(false);
                                setActiveSearchField(null);
                              }, 200);
                            }}
                            required
                            autoComplete="off"
                          />

                          {showDropdown && activeSearchField === "symbol" && searchResults.length > 0 && (
                            <div className={styles.dropdownList}>
                              {searchResults.map((quote) => (
                                <button
                                  key={quote.symbol}
                                  type="button"
                                  className={styles.dropdownItem}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectQuote(quote);
                                  }}
                                >
                                  <div className={styles.dropdownLeft}>
                                    <span className={styles.dropdownSymbol}>{quote.symbol}</span>
                                    <span className={styles.dropdownName}>{quote.name}</span>
                                  </div>
                                  <span className={`${styles.dropdownType} ${styles[`dropdownType_${quote.assetType}`]}`}>
                                    {quote.assetType === "stock_kr"
                                      ? "한국 주식"
                                      : quote.assetType === "stock_us"
                                      ? "미국 주식"
                                      : quote.assetType === "crypto"
                                      ? "가상자산"
                                      : "기타/수기"}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {isSearching && activeSearchField === "symbol" && (
                            <div className={styles.dropdownList}>
                              <div className={styles.searchingText}>검색 중...</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.formGroup} style={{ position: "relative" }}>
                        <label className={styles.label}>종목명</label>
                        <div className={styles.autocompleteContainer}>
                          <input
                            type="text"
                            placeholder="예: 애플, 삼성전자"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              setActiveSearchField("name");
                            }}
                            onFocus={() => {
                              setActiveSearchField("name");
                              if (searchResults.length > 0) setShowDropdown(true);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setShowDropdown(false);
                                setActiveSearchField(null);
                              }, 200);
                            }}
                            required
                            autoComplete="off"
                          />

                          {showDropdown && activeSearchField === "name" && searchResults.length > 0 && (
                            <div className={styles.dropdownList}>
                              {searchResults.map((quote) => (
                                <button
                                  key={quote.symbol}
                                  type="button"
                                  className={styles.dropdownItem}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectQuote(quote);
                                  }}
                                >
                                  <div className={styles.dropdownLeft}>
                                    <span className={styles.dropdownSymbol}>{quote.symbol}</span>
                                    <span className={styles.dropdownName}>{quote.name}</span>
                                  </div>
                                  <span className={`${styles.dropdownType} ${styles[`dropdownType_${quote.assetType}`]}`}>
                                    {quote.assetType === "stock_kr"
                                      ? "한국 주식"
                                      : quote.assetType === "stock_us"
                                      ? "미국 주식"
                                      : quote.assetType === "crypto"
                                      ? "가상자산"
                                      : "기타/수기"}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {isSearching && activeSearchField === "name" && (
                            <div className={styles.dropdownList}>
                              <div className={styles.searchingText}>검색 중...</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.formGroup} style={{ flex: "1 1 100%" }}>
                      <label className={styles.label}>종목명</label>
                      <input
                        type="text"
                        placeholder="예: 국고채3년, 운용사 포트폴리오 자산 (자유 입력)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>

                {/* Quantity & Unit Price */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>거래 수량</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>체결 단가 ({currencySymbol})</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Custom Yield for etc asset */}
                {assetType === "etc" && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>운용수익률 (%)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="예: 5.5 (선택 사항)"
                        value={customYield}
                        onChange={(e) => setCustomYield(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup} style={{ visibility: "hidden" }} />
                  </div>
                )}

                {/* Fee & Date */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>수수료 ({currencySymbol})</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>체결일</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {(type === "deposit" || type === "withdraw") && (
              <>
                {/* Cash Flow Amount */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>거래 금액 ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Date */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>거래일</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <div className={styles.formActions}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                취소
              </button>
              <button type="submit" className="btn btn-primary">
                {editingTransaction ? "기록 수정" : "기록 저장"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
