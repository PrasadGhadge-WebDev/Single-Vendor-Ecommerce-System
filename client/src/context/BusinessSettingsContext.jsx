/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../api";

const BusinessSettingsContext = createContext({
  settings: null,
  loading: false,
  error: null,
  refresh: async () => {},
});

export const BusinessSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get("/business-settings/public");
      setSettings(data || null);
    } catch (e) {
      setSettings(null);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const title = settings?.storeName || settings?.businessName;
    if (title) document.title = title;
  }, [settings]);

  const value = useMemo(() => ({ settings, loading, error, refresh }), [settings, loading, error, refresh]);

  return <BusinessSettingsContext.Provider value={value}>{children}</BusinessSettingsContext.Provider>;
};

export const useBusinessSettings = () => useContext(BusinessSettingsContext);

export default BusinessSettingsContext;
