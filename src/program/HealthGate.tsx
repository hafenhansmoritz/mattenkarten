// Gesundheitshinweis vor dem ersten Matten-Drill – einmal bestätigen, lokal gemerkt.
import { useState, type ReactNode } from "react";

export const HEALTH_KEY = "mk.health.ok.v1";

export function healthAccepted(): boolean {
  try {
    return !!localStorage.getItem(HEALTH_KEY);
  } catch {
    return false;
  }
}

export function HealthGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(healthAccepted);
  if (ok) return <>{children}</>;
  const accept = () => {
    try {
      localStorage.setItem(HEALTH_KEY, JSON.stringify({ v: 1, at: new Date().toISOString() }));
    } catch {
      /* Speichern nicht möglich – dann fragen wir beim nächsten Mal wieder */
    }
    setOk(true);
  };
  return (
    <div className="pg-panel pg-health" role="region" aria-labelledby="pg-health-h">
      <span className="label">Bevor du dich bewegst</span>
      <h3 id="pg-health-h" className="display pg-h">Kurz zur Sicherheit</h3>
      <ul className="pg-health-list">
        <li><b>Bei Schmerzen sofort stoppen.</b> Ziehen ist okay, stechender Schmerz, Schwindel oder Taubheit nicht.</li>
        <li><b>Vorerkrankungen?</b> Bei Problemen mit Rücken, Nacken, Gelenken, Herz-Kreislauf oder in der Schwangerschaft vorher eine Ärztin oder einen Arzt fragen.</li>
        <li><b>Weicher Untergrund und Platz:</b> Matte, Teppich oder Rasen – nicht auf hartem Boden, nichts Kantiges in der Nähe.</li>
        <li>Langsam und ohne Partner. Würfe und Techniken am Partner nur im Training mit Trainer.</li>
      </ul>
      <p className="muted small">Die Drills sind einfache Bewegungsübungen zur Orientierung, kein Trainings- oder Therapieplan. Du übst auf eigene Verantwortung.</p>
      <button className="btn primary big" onClick={accept}>Verstanden – los geht's</button>
    </div>
  );
}
