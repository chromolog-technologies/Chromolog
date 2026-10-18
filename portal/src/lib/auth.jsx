import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "./api";
import { setCurrency, setTimeZone } from "./format";

const AuthContext = createContext(null);

export const ROLE_LABELS = {
  admin: "Admin",
  marketing: "Marketing",
  accounts: "Accounts",
  project: "Project team",
  employee: "Employee",
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: !!getToken(), user: null, settings: null });

  const applySession = useCallback((user, settings) => {
    if (settings) {
      setCurrency(settings.currency, settings.currency_symbol);
      setTimeZone(settings.timezone);
    }
    setState({ loading: false, user, settings });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("auth/logout", { method: "POST" });
    } catch {
      // Token may already be invalid; sign out locally regardless.
    }
    setToken(null);
    setState({ loading: false, user: null, settings: null });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setState({ loading: false, user: null, settings: null });
    });
    if (!getToken()) return;
    api("me")
      .then((d) => applySession(d.user, d.settings))
      .catch(() => {
        setToken(null);
        setState({ loading: false, user: null, settings: null });
      });
  }, [applySession]);

  const login = useCallback(
    async (email, password, remember) => {
      const d = await api("auth/login", { method: "POST", body: { email, password } });
      setToken(d.token, remember);
      const me = await api("me");
      applySession(me.user, me.settings);
    },
    [applySession]
  );

  const refreshSettings = useCallback(async () => {
    const d = await api("settings");
    setCurrency(d.settings.currency, d.settings.currency_symbol);
    setState((s) => ({ ...s, settings: d.settings }));
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, refreshSettings }),
    [state, login, logout, refreshSettings]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** True when the user is admin or has one of the roles. */
export function can(user, ...roles) {
  return !!user && (user.role === "admin" || roles.includes(user.role));
}
