// KI-Coach nur zeigen, wenn /api/coach antwortet und ein Schlüssel gesetzt ist (Ergebnis pro Sitzung gemerkt).
import { useEffect, useState } from "react";

let known: boolean | null = null;

export function useCoachAvailable(): boolean {
  const [ok, setOk] = useState<boolean>(known ?? false);
  useEffect(() => {
    if (known !== null) return;
    let live = true;
    void import("../coach/client").then((m) => m.coachAvailable()).then((v) => {
      known = v;
      if (live) setOk(v);
    }).catch(() => { known = false; });
    return () => { live = false; };
  }, []);
  return ok;
}
