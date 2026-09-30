"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/** Įsimena, iš kur žmogus atėjo (UTM / draugo nuoroda). Nieko nerodo. */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
