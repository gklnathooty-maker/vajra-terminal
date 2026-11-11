import { useEffect } from "react";
import { useDesk } from "@/lib/goks/store";

export function useGlobalTerminalHotkeys({
  onOpenCommandPalette,
  onOpenHelp,
}: {
  onOpenCommandPalette: () => void;
  onOpenHelp: () => void;
}) {
  const setSection = useDesk((s) => s.setSection);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // If user is currently typing in an input, textarea or contenteditable, ignore single key shortcuts
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Global shortcut: Ctrl+K or Cmd+K or /
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        onOpenHelp();
        return;
      }

      if (isInput) return;

      // Section shortcuts (Bloomberg-style single key function jump)
      switch (e.key.toLowerCase()) {
        case "t":
          e.preventDefault();
          setSection("technicals");
          break;
        case "m":
          e.preventDefault();
          setSection("agent");
          break;
        case "f":
          e.preventDefault();
          setSection("flow");
          break;
        case "c":
          e.preventDefault();
          setSection("camarilla");
          break;
        case "i":
          e.preventDefault();
          setSection("institutional");
          break;
        case "r":
          e.preventDefault();
          setSection("risk");
          break;
        case "s":
          e.preventDefault();
          setSection("screener");
          break;
        case "h":
          e.preventDefault();
          setSection("heatmap");
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenCommandPalette, onOpenHelp, setSection]);
}

