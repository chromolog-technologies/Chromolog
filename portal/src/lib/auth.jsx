import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler } from "./api";
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
  const [state, setState] = useState({ loading: true, user: null, settings: null, expired: false });

  const applySession = useCallback((user, settings) => {
    if (settings) {
      setCurrency(settings.currency, settings.currency_symbol);
      setTimeZone(settings.timezone);
    }
    setState({ loading: false, user, settings, expired: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("auth/logout", { method: "POST" });
    } catch {
      // Session may already have ended; sign out locally regardless.
    }
    setState({ loading: false, user: null, settings: null, expired: false });
  }, []);

  useEffect(() => {
    // Session ended on the server (idle timeout, password changed elsewhere, account disabled).
    setUnauthorizedHandler(() => setState((s) => ({ loading: false, user: null, settings: null, expired: !!s.user })));
    api("me")
      .then((d) => applySession(d.user, d.settings))
      .catch(() => setState({ loading: false, user: null, settings: null, expired: false }));
  }, [applySession]);

  const login = useCallback(
    async (email, password, remember) => {
      await api("auth/login", { method: "POST", body: { email, password, remember } });
      const me = await api("me");
      applySession(me.user, me.settings);
    },
    [applySession]
  );

  const refreshMe = useCallback(async () => {
    const me = await api("me");
    applySession(me.user, me.settings);
  }, [applySession]);

  const refreshSettings = useCallback(async () => {
    const d = await api("settings");
    setCurrency(d.settings.currency, d.settings.currency_symbol);
    setState((s) => ({ ...s, settings: d.settings }));
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, refreshMe, refreshSettings }),
    [state, login, logout, refreshMe, refreshSettings]
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
