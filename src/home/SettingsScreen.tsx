// Zahnrad: Ton, App installieren, Über, Rechtliches – und versteckt der „Klassik“-Modus (altes Kartenspiel).
import { useGame } from "../store";
import { useInstallPrompt } from "../pwa";
import "./home.css";

export function SettingsScreen({ onBack, onLegal, onKlassik }: {
  onBack: () => void; onLegal: (p: "impressum" | "datenschutz") => void; onKlassik: () => void;
}) {
  const { canInstall, iosHint, promptInstall } = useInstallPrompt();
  return (
    <div className="screen more">
      <button className="btn small ghost hm-back" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 30 }}>Einstellungen</h2>
      <SoundSwitch />
      {canInstall && <button className="btn primary big" onClick={() => promptInstall()}>App installieren</button>}
      {iosHint && <p className="muted small">Als App installieren: Teilen → „Zum Home-Bildschirm“.</p>}
      <section className="hm-about">
        <h3 className="display">Über Mattenkarten</h3>
        <p className="muted small">Ein Lernspiel für No-Gi-Anfänger. Mattenkarten ersetzt kein Training mit Trainer. Bei Schmerzen: stoppen und Trainer oder Arzt fragen.</p>
        <a className="btn small" href="/landing/" target="_blank" rel="noopener">Mehr über Mattenkarten</a>
      </section>
      <nav className="more-legal" aria-label="Rechtliches">
        <button type="button" onClick={() => onLegal("impressum")}>Impressum</button>
        <button type="button" onClick={() => onLegal("datenschutz")}>Datenschutz</button>
      </nav>
      <button type="button" className="hm-klassik" onClick={onKlassik}>Klassik: das alte Kartenspiel</button>
    </div>
  );
}

/** Master-Schalter für Ton und Vibration (Standard: an, leise). */
function SoundSwitch() {
  const g = useGame();
  return (
    <div className="mk-switch-row">
      <span><strong>Ton und Vibration</strong><span className="muted small">Matte, Atem, Abklopfen, Gong – leise synthetisiert.</span></span>
      <button type="button" role="switch" className="mk-switch" aria-checked={g.sound} aria-label="Ton und Vibration"
        onClick={() => g.set({ sound: !g.sound })} />
    </div>
  );
}
