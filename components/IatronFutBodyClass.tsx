"use client";

import { useEffect } from "react";

/**
 * Aplica classe no body para o tema Iatron Futurista (viewport e fundo escuros).
 */
export function IatronFutBodyClass() {
  useEffect(() => {
    document.body.classList.add("iatron-fut-body");
    return () => document.body.classList.remove("iatron-fut-body");
  }, []);
  return null;
}
