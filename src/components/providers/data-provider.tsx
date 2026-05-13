"use client";

import * as React from "react";
import type { AdCampaign, OrderLog, ProfitInputs } from "@/lib/types";
import { readStorage, writeStorage } from "@/lib/storage";
import { buildSeedCampaigns, buildSeedOrderLogs, DEFAULT_PROFIT_INPUTS } from "@/lib/seed";

type DataContextValue = {
  profitInputs: ProfitInputs;
  setProfitInputs: (v: ProfitInputs | ((p: ProfitInputs) => ProfitInputs)) => void;
  orderLogs: OrderLog[];
  setOrderLogs: (v: OrderLog[] | ((p: OrderLog[]) => OrderLog[])) => void;
  campaigns: AdCampaign[];
  setCampaigns: (v: AdCampaign[] | ((p: AdCampaign[]) => AdCampaign[])) => void;
  resetAll: () => void;
  hydrated: boolean;
};

const DataContext = React.createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  const [profitInputs, setProfitInputsState] = React.useState<ProfitInputs>(DEFAULT_PROFIT_INPUTS);
  const [orderLogs, setOrderLogsState] = React.useState<OrderLog[]>([]);
  const [campaigns, setCampaignsState] = React.useState<AdCampaign[]>([]);

  React.useEffect(() => {
    const inputs = readStorage<ProfitInputs>("profitInputs", DEFAULT_PROFIT_INPUTS);
    const logs = readStorage<OrderLog[] | null>("orderLogs", null);
    const camps = readStorage<AdCampaign[] | null>("campaigns", null);
    setProfitInputsState(inputs);
    setOrderLogsState(logs && logs.length > 0 ? logs : buildSeedOrderLogs());
    setCampaignsState(camps && camps.length > 0 ? camps : buildSeedCampaigns());
    setHydrated(true);
  }, []);

  const setProfitInputs: DataContextValue["setProfitInputs"] = React.useCallback((v) => {
    setProfitInputsState((prev) => {
      const next = typeof v === "function" ? (v as (p: ProfitInputs) => ProfitInputs)(prev) : v;
      writeStorage("profitInputs", next);
      return next;
    });
  }, []);

  const setOrderLogs: DataContextValue["setOrderLogs"] = React.useCallback((v) => {
    setOrderLogsState((prev) => {
      const next = typeof v === "function" ? (v as (p: OrderLog[]) => OrderLog[])(prev) : v;
      writeStorage("orderLogs", next);
      return next;
    });
  }, []);

  const setCampaigns: DataContextValue["setCampaigns"] = React.useCallback((v) => {
    setCampaignsState((prev) => {
      const next = typeof v === "function" ? (v as (p: AdCampaign[]) => AdCampaign[])(prev) : v;
      writeStorage("campaigns", next);
      return next;
    });
  }, []);

  const resetAll = React.useCallback(() => {
    const logs = buildSeedOrderLogs();
    const camps = buildSeedCampaigns();
    setProfitInputsState(DEFAULT_PROFIT_INPUTS);
    setOrderLogsState(logs);
    setCampaignsState(camps);
    writeStorage("profitInputs", DEFAULT_PROFIT_INPUTS);
    writeStorage("orderLogs", logs);
    writeStorage("campaigns", camps);
  }, []);

  const value = React.useMemo<DataContextValue>(
    () => ({
      profitInputs,
      setProfitInputs,
      orderLogs,
      setOrderLogs,
      campaigns,
      setCampaigns,
      resetAll,
      hydrated
    }),
    [profitInputs, setProfitInputs, orderLogs, setOrderLogs, campaigns, setCampaigns, resetAll, hydrated]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within <DataProvider>");
  return ctx;
}
