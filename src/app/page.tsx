"use client";

import React, { useState } from "react";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { DashboardSummary } from "@/components/DashboardSummary";
import { AssetAllocation } from "@/components/AssetAllocation";
import { AssetList } from "@/components/AssetList";
import { AccountManager } from "@/components/AccountManager";
import { TransactionHistory } from "@/components/TransactionHistory";
import { TransactionModal } from "@/components/TransactionModal";

export default function Home() {
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  return (
    <PortfolioProvider>
      <main className="container" style={{ padding: "2rem 1rem", minHeight: "100vh", position: "relative" }}>
        {/* Ambient background glows */}
        <div className="glow-bg" style={{ top: "-50px", left: "10%", opacity: 0.6 }} />
        <div className="glow-bg" style={{ bottom: "10%", right: "10%", opacity: 0.4 }} />

        <div className="animate-fade">
          {/* Top Navigation Control Center */}
          <Navbar />
          
          {/* Top Summary Cards */}
          <DashboardSummary />
          
          {/* Grid Layout (Stacks on mobile, 2 columns on desktop) */}
          <div className="dashboard-grid">
            {/* Left Column: Asset list and transaction tables */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <AssetList onAddTransactionClick={() => setIsTxModalOpen(true)} />
              <TransactionHistory />
            </div>

            {/* Right Column: Donut allocation chart and account cash manager */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <AssetAllocation />
              <AccountManager />
            </div>
          </div>
        </div>

        {/* Floating Transaction Logger Modal */}
        <TransactionModal 
          isOpen={isTxModalOpen} 
          onClose={() => setIsTxModalOpen(false)} 
        />
      </main>
    </PortfolioProvider>
  );
}
