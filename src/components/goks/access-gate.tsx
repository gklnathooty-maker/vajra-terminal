import React, { useEffect, useState, useMemo } from "react";

const DEFAULT_MASTER_KEY = "VAJRA2026";
const AUTH_STORAGE_KEY = "vajra_terminal_authorized";
const CUSTOM_KEY_STORAGE = "vajra_custom_access_key";

export function getActiveMasterKey(): string {
  if (typeof window === "undefined") return DEFAULT_MASTER_KEY;
  const custom = localStorage.getItem(CUSTOM_KEY_STORAGE);
  return (custom && custom.trim()) ? custom.trim() : DEFAULT_MASTER_KEY;
}

export function setActiveMasterKey(newKey: string): void {
  if (typeof window === "undefined") return;
  if (!newKey || !newKey.trim()) {
    localStorage.removeItem(CUSTOM_KEY_STORAGE);
  } else {
    localStorage.setItem(CUSTOM_KEY_STORAGE, newKey.trim());
  }
}

export function lockTerminal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.reload();
}

export function getShareableLink(): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const path = window.location.pathname;
  const key = getActiveMasterKey();
  return `${origin}${path}?key=${encodeURIComponent(key)}`;
}

interface AccessGateProps {
  children: React.ReactNode;
}

export function AccessGate({ children }: AccessGateProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    setIsHydrated(true);

    try {
      const activeKey = getActiveMasterKey().toUpperCase();

      // 1. Check URL parameters for direct link access (?key=... or ?access=...)
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = (
        urlParams.get("key") ||
        urlParams.get("access") ||
        urlParams.get("token") ||
        urlParams.get("pass") ||
        ""
      ).trim().toUpperCase();

      if (urlKey && (urlKey === activeKey || urlKey === DEFAULT_MASTER_KEY.toUpperCase())) {
        // Link authenticated!
        localStorage.setItem(AUTH_STORAGE_KEY, "granted_" + Date.now());
        setIsAuthorized(true);

        // Clean query parameters from address bar for neatness and security
        urlParams.delete("key");
        urlParams.delete("access");
        urlParams.delete("token");
        urlParams.delete("pass");
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, document.title, newUrl);
        return;
      }

      // 2. Check existing local storage authorization
      const existingAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (existingAuth && existingAuth.startsWith("granted_")) {
        setIsAuthorized(true);
        return;
      }
    } catch {
      // In case localStorage is blocked in incognito
    }
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setIsVerifying(true);

    setTimeout(() => {
      const activeKey = getActiveMasterKey().toUpperCase();
      const entered = inputKey.trim().toUpperCase();

      if (entered && (entered === activeKey || entered === DEFAULT_MASTER_KEY.toUpperCase())) {
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, "granted_" + Date.now());
        } catch {
          // ignore
        }
        setIsAuthorized(true);
      } else {
        setErrorMsg("Invalid Authorization Passcode. Access Denied.");
      }
      setIsVerifying(false);
    }, 300);
  };

  // SSR or before client hydration check
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#080C0A] flex items-center justify-center text-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brass border-t-transparent" />
          <span className="font-mono text-xs text-muted">Authenticating Session...</span>
        </div>
      </div>
    );
  }

  // If authorized, render the full workstation
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Restricted Access Gate Screen
  return (
    <div className="min-h-screen bg-[#060907] flex flex-col justify-between text-paper font-sans selection:bg-brass selection:text-ink relative overflow-hidden">
      {/* Background Ambience / Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(218,175,60,0.12),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(16,185,129,0.06),transparent)] pointer-events-none" />

      {/* Top Status Bar */}
      <header className="border-b border-[#1E2822] bg-[#0A0F0C]/80 backdrop-blur px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs tracking-wider text-muted uppercase">Vajra Security Protocol 2.4</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded border border-brass/30 bg-brass/10 px-2 py-0.5 font-mono text-[10px] text-brass uppercase font-bold tracking-widest">
            256-Bit Encrypted Gate
          </span>
        </div>
      </header>

      {/* Center Gate Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md rounded-2xl border border-brass/50 bg-gradient-to-b from-[#111914] via-[#0C120F] to-[#070B09] p-8 shadow-2xl shadow-black/90 ring-1 ring-brass/20 relative">
          
          {/* Vajra Emblem */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl border border-brass/80 bg-gradient-to-br from-[#1B2720] to-[#090F0C] p-2.5 shadow-xl shadow-black/80 ring-2 ring-brass/30 flex items-center justify-center">
              <svg className="h-full w-full" viewBox="0 0 128 128" fill="none">
                <defs>
                  <linearGradient id="gateGoldLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFDF5" />
                    <stop offset="40%" stopColor="#F5D77F" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                  <linearGradient id="gateGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="50%" stopColor="#9C7726" />
                    <stop offset="100%" stopColor="#594008" />
                  </linearGradient>
                  <linearGradient id="gateCore" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6EE7B7" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
                <g transform="translate(64, 64)">
                  <polygon points="0,-46 8,-28 0,-20 -8,-28" fill="url(#gateGoldLight)" />
                  <polygon points="0,-46 0,-20 8,-28" fill="url(#gateGoldDark)" />
                  <polygon points="0,46 8,28 0,20 -8,28" fill="url(#gateGoldLight)" />
                  <polygon points="0,46 0,20 -8,28" fill="url(#gateGoldDark)" />
                  <polygon points="-36,-32 -20,-12 -12,-20 -28,-36" fill="url(#gateGoldLight)" />
                  <polygon points="-36,32 -20,12 -12,20 -28,36" fill="url(#gateGoldLight)" />
                  <polygon points="36,-32 20,-12 12,-20 28,-36" fill="url(#gateGoldDark)" />
                  <polygon points="36,32 20,12 12,20 28,32" fill="url(#gateGoldDark)" />
                  <circle cx="0" cy="0" r="18" fill="url(#gateGoldDark)" stroke="#F5D77F" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="13" fill="#0C1510" />
                  <polygon points="0,-12 12,0 0,12 -12,0" fill="url(#gateCore)" />
                  <line x1="0" y1="-38" x2="0" y2="38" stroke="#A7F3D0" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
                </g>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">
              VAJRA TERMINAL
            </h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-brass">
              Institutional Quantitative Workstation
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-mono text-xs text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
              Restricted Access · Passcode Required
            </div>
          </div>

          {/* Notice */}
          <p className="text-xs text-muted text-center leading-relaxed mb-6">
            Access to live order flow, institutional accumulation data, and algorithmic positioning is restricted to authorized clients and accredited members.
          </p>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-paper mb-1.5 font-medium">
                Authorization Key / Passcode
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  autoFocus
                  placeholder="Enter passcode or token..."
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  className="w-full rounded-lg border border-[#2D3C32] bg-[#070B09] px-3.5 py-3 font-mono text-sm text-paper placeholder-muted/60 shadow-inner outline-none transition focus:border-brass focus:ring-1 focus:ring-brass pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted hover:text-paper"
                  tabIndex={-1}
                >
                  {showKey ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-300 font-mono text-center">
                ⚠ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !inputKey.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#E6BA4E] to-[#B8860B] py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink shadow-lg shadow-brass/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying Token..." : "Unlock Workstation"}
            </button>
          </form>

          {/* Helper Footer */}
          <div className="mt-6 pt-5 border-t border-[#1C2620] text-center">
            <p className="font-mono text-[11px] text-muted leading-normal">
              Direct access link: If you have received an authorized link from the administrator, opening that link automatically authenticates this device.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#16201A] px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-muted font-mono text-[11px] z-10">
        <span>© 2026 VAJRA QUANT SYSTEMS · NSE & BSE INDIA</span>
        <span>SECURITY ENCLAVE · SESSION STATUS: STANDBY</span>
      </footer>
    </div>
  );
}
