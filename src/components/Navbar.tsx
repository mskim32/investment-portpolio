"use client";

import React, { useRef } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  RefreshCw, 
  Download, 
  Upload, 
  Briefcase, 
  TrendingUp,
  DollarSign,
  Coins,
  Trash2
} from "lucide-react";
import styles from "./Navbar.module.css";

export const Navbar: React.FC = () => {
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    activeCurrency,
    setActiveCurrency,
    refreshPrices,
    isLoadingPrices,
    exportData,
    importData,
    clearAllData,
  } = usePortfolio();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleResetClick = () => {
    if (confirm("정말로 모든 데이터를 초기화하시겠습니까? 등록된 모든 계좌, 거래 내역 및 자동 거래 일정이 전부 삭제됩니다. 이 작업은 되돌릴 수 없습니다.")) {
      clearAllData();
      alert("모든 데이터가 초기화되었습니다. 빈 상태에서 실제 데이터를 입력해 보세요!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const success = importData(result);
        if (success) {
          alert("데이터를 성공적으로 불러왔습니다!");
        } else {
          alert("데이터 가져오기에 실패했습니다. 올바른 JSON 형식이 아닙니다.");
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  };

  return (
    <nav className={`glass-card ${styles.navbar}`}>
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          <TrendingUp size={20} color="#fff" />
        </div>
        <div>
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>Antigravity Portfolio</h1>
            <div className={styles.liveIndicator} title="30초 간격 실시간 자동 시세 반영 중">
              <span className={`${styles.liveDot} ${isLoadingPrices ? styles.pulsing : ""}`} />
              <span className={styles.liveText}>
                {isLoadingPrices ? "갱신중" : "Live"}
              </span>
            </div>
          </div>
          <span className={styles.subtitle}>통합 자산 관리 시스템</span>
        </div>
      </div>

      <div className={styles.controls}>
        {/* Account Selector */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>
            <Briefcase size={14} /> 계좌 필터
          </label>
          <select
            value={selectedAccountId || ""}
            onChange={(e) => setSelectedAccountId(e.target.value || null)}
            className={styles.select}
          >
            <option value="">모든 계좌 합산</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Currency Switcher */}
        <div className={styles.controlGroup}>
          <span className={styles.label}>
            기준 통화
          </span>
          <div className={styles.currencyToggle}>
            <button
              onClick={() => setActiveCurrency("KRW")}
              className={`${styles.toggleBtn} ${activeCurrency === "KRW" ? styles.active : ""}`}
            >
              KRW
            </button>
            <button
              onClick={() => setActiveCurrency("USD")}
              className={`${styles.toggleBtn} ${activeCurrency === "USD" ? styles.active : ""}`}
            >
              USD
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            onClick={() => refreshPrices()}
            disabled={isLoadingPrices}
            className={`btn btn-secondary ${styles.actionBtn}`}
            title="실시간 시세 새로고침"
          >
            <RefreshCw size={15} className={isLoadingPrices ? styles.spin : ""} />
            <span className={styles.btnText}>새로고침</span>
          </button>

          <button
            onClick={exportData}
            className={`btn btn-secondary ${styles.actionBtn}`}
            title="데이터 백업 (JSON)"
          >
            <Download size={15} />
            <span className={styles.btnText}>내보내기</span>
          </button>

          <button
            onClick={handleImportClick}
            className={`btn btn-secondary ${styles.actionBtn}`}
            title="데이터 복원 (JSON)"
          >
            <Upload size={15} />
            <span className={styles.btnText}>불러오기</span>
          </button>

          <button
            onClick={handleResetClick}
            className={`btn btn-secondary ${styles.actionBtn}`}
            style={{ color: "var(--loss)", borderColor: "rgba(220, 38, 38, 0.15)", background: "rgba(220, 38, 38, 0.05)" }}
            title="모든 데이터 초기화 (빈 포트폴리오로 시작)"
          >
            <Trash2 size={15} />
            <span className={styles.btnText}>초기화</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: "none" }}
          />
        </div>
      </div>
    </nav>
  );
};
