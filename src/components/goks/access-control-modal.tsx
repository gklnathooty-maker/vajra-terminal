import React, { useState, useEffect } from "react";
import { getActiveMasterKey, setActiveMasterKey, lockTerminal, getShareableLink } from "./access-gate";

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessControlModal({ isOpen, onClose }: AccessControlModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [currentKey, setCurrentKey] = useState<string>("");
  const [newKey, setNewKey] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const k = getActiveMasterKey();
      setCurrentKey(k);
      setNewKey(k);
      setSaveStatus("");
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareLink = typeof window !== "undefined" ? getShareableLink() : "";

  const handleCopy = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newKey.trim();
    if (!trimmed) return;
    setActiveMasterKey(trimmed);
    setCurrentKey(trimmed);
    setSaveStatus("Passcode successfully updated!");
    setTimeout(() => setSaveStatus(""), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-brass/70 bg-[#0C120F] p-6 shadow-2xl font-mono text-xs text-paper ring-1 ring-brass/30">
        <div className="flex items-center justify-between border-b border-[#223028] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base text-brass">🔒</span>
            <h3 className="font-bold uppercase tracking-wider text-paper text-sm">
              Link-Only Access Control
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-paper cursor-pointer font-bold px-1"
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <p className="text-muted leading-relaxed mb-4 text-[11px]">
          Your terminal is protected by an Institutional Security Gate. Anyone without your key will see a restricted access screen. Send your secret link to grant 1-click access.
        </p>

        {/* Shareable Link Box */}
        <div className="rounded-lg border border-[#2D3E33] bg-[#070B09] p-3.5 mb-5">
          <label className="block text-[11px] text-brass uppercase font-bold mb-1.5">
            Your 1-Click Secret Access Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-1 rounded border border-[#1E2922] bg-[#0A0F0C] px-3 py-2 text-[11px] text-emerald-400 select-all outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`rounded px-3.5 py-2 font-bold uppercase transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-brass text-ink hover:brightness-110"
              }`}
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
          <p className="text-[10px] text-muted mt-2">
            Tip: Anyone who opens this link is authenticated instantly with zero password typing.
          </p>
        </div>

        {/* Change Master Passcode */}
        <form onSubmit={handleSaveKey} className="rounded-lg border border-[#223028] bg-[#080D0A] p-3.5 mb-5">
          <label className="block text-[11px] text-paper uppercase font-bold mb-1.5">
            Custom Access Passcode
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="e.g. VAJRA2026"
              className="flex-1 rounded border border-[#1E2922] bg-[#0A0F0C] px-3 py-2 text-xs text-paper outline-none focus:border-brass"
            />
            <button
              type="submit"
              disabled={!newKey.trim() || newKey.trim() === currentKey}
              className="rounded bg-panel border border-brass/50 px-3 py-2 text-brass hover:bg-brass hover:text-ink transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed uppercase font-bold"
            >
              Update Key
            </button>
          </div>
          {saveStatus && (
            <p className="text-[10px] text-emerald-400 mt-2 font-bold">{saveStatus}</p>
          )}
        </form>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1C2620]">
          <button
            type="button"
            onClick={lockTerminal}
            className="rounded border border-red-500/40 bg-red-950/30 px-3 py-2 text-red-300 hover:bg-red-900/50 transition-colors cursor-pointer text-[11px]"
          >
            🔒 Lock Terminal Now
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-panel border border-line px-4 py-2 text-muted hover:text-paper cursor-pointer text-[11px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
