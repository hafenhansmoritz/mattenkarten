/// <reference types="vite/client" />
// PWA-Helfer: Service-Worker-Registrierung, Install-Prompt, Standalone-Erkennung.
import { useCallback, useEffect, useState } from "react";

/** Chromium-Event, nicht in lib.dom enthalten. */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

/** Registriert den (von vite-plugin-pwa generierten) Service Worker – nur im Production-Build. */
export function registerSW(): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const base = import.meta.env.BASE_URL || "/";
  // Nur bei echtem Update neu laden, nicht bei der allerersten Installation.
  const hadController = !!navigator.serviceWorker.controller;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((reg) => {
        // Bei Updates: neuer SW übernimmt sofort (skipWaiting + clientsClaim) – Seite einmal neu laden.
        let reloaded = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (reloaded || !hadController) return;
          reloaded = true;
          window.location.reload();
        });
        // Stündlich auf neue Version prüfen (wichtig für lange offene Standalone-Apps).
        setInterval(() => void reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch((err) => console.warn("[pwa] SW-Registrierung fehlgeschlagen", err));
  });
}

/** true, wenn die App als installierte PWA (Homescreen) läuft. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iOS-Safari kennt kein beforeinstallprompt – dort nur Hinweis "Teilen → Zum Home-Bildschirm". */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// Event global abfangen, damit es nicht verloren geht, bevor ein Component den Hook mountet.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export interface InstallPromptState {
  /** Browser bietet nativen Install-Dialog an (Chrome/Edge/Android). */
  canInstall: boolean;
  /** Läuft bereits installiert. */
  installed: boolean;
  /** iOS: manuelle Anleitung zeigen statt Button. */
  iosHint: boolean;
  /** Öffnet den nativen Dialog. Liefert das Ergebnis. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

export function useInstallPrompt(): InstallPromptState {
  const [, force] = useState(0);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onMq = () => setInstalled(isStandalone());
    mq?.addEventListener?.("change", onMq);
    return () => {
      listeners.delete(l);
      window.removeEventListener("appinstalled", onInstalled);
      mq?.removeEventListener?.("change", onMq);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const ev = deferred;
    if (!ev) return "unavailable" as const;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    deferred = null;
    notify();
    if (outcome === "accepted") setInstalled(true);
    return outcome;
  }, []);

  return {
    canInstall: !!deferred && !installed,
    installed,
    iosHint: !installed && isIOS(),
    promptInstall,
  };
}
