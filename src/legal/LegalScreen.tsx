// Impressum & Datenschutz in der App. Einzige Quelle sind die statischen Seiten
// public/landing/{impressum,datenschutz}.html – hier wird nur deren <article id="legal"> geladen.
import { useEffect, useState } from "react";
import "./legal.css";

export type LegalPage = "impressum" | "datenschutz";
const TITLE: Record<LegalPage, string> = { impressum: "Impressum", datenschutz: "Datenschutz" };
export const legalUrl = (page: LegalPage) => `/landing/${page}.html`;

/** Holt den Rechtstext-Block aus der statischen Seite (gleiche Herkunft, eigener Inhalt). */
export function extractLegal(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = doc.getElementById("legal");
  if (!el) return null;
  el.querySelectorAll("script, iframe, object, embed").forEach((n) => n.remove());
  // Relative Links der statischen Seite auf /landing/ beziehen
  el.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (!/^([a-z]+:|\/|#)/i.test(href)) a.setAttribute("href", `/landing/${href}`);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });
  return el.innerHTML;
}

export function LegalScreen({ page, onBack }: { page: LegalPage; onBack: () => void }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setHtml(null);
    setFailed(false);
    fetch(legalUrl(page), { headers: { accept: "text/html" } })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => {
        const body = extractLegal(t);
        if (!live) return;
        if (body) setHtml(body);
        else setFailed(true);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [page]);

  return (
    <div className="screen lg-screen">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      {html ? (
        <div className="lg-body" dangerouslySetInnerHTML={{ __html: html }} />
      ) : failed ? (
        <div className="lg-body">
          <h1>{TITLE[page]}</h1>
          <p>Der Text konnte gerade nicht geladen werden – vermutlich bist du offline.</p>
          <p><a href={legalUrl(page)} target="_blank" rel="noopener">{TITLE[page]} im Browser öffnen</a></p>
        </div>
      ) : (
        <p className="muted" role="status">{TITLE[page]} wird geladen …</p>
      )}
    </div>
  );
}
