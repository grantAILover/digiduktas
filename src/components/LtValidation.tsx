"use client";

import { useEffect } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function messageFor(el: Field): string {
  const v = el.validity;
  if (v.valueMissing) {
    if (el instanceof HTMLInputElement && el.type === "checkbox") return "Pažymėkite šį laukelį, jei norite tęsti.";
    if (el instanceof HTMLInputElement && el.type === "file") return "Pasirinkite failą.";
    if (el instanceof HTMLSelectElement) return "Pasirinkite vieną iš variantų.";
    return "Užpildykite šį laukelį.";
  }
  if (v.typeMismatch && el instanceof HTMLInputElement && el.type === "email") {
    return "Įveskite teisingą el. pašto adresą.";
  }
  if (v.tooShort && "minLength" in el) return `Per trumpa — bent ${el.minLength} simbolių.`;
  if (v.tooLong && "maxLength" in el) return `Per ilga — daugiausia ${el.maxLength} simbolių.`;
  if (v.patternMismatch) return "Neteisingas formatas.";
  if (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch) return "Netinkama reikšmė.";
  return "";
}

/**
 * Naršyklės formų pranešimai („Please fill out this field") rodomi naršyklės kalba.
 * Šis komponentas visoje svetainėje pakeičia juos lietuviškais. Nieko nerodo.
 */
export default function LtValidation() {
  useEffect(() => {
    const onInvalid = (e: Event) => {
      const el = e.target as Field;
      if (!el?.validity) return;
      // Neperrašom sąmoningai nustatytų kitų pranešimų
      if (el.validity.customError && !el.dataset.ltMsg) return;
      el.setCustomValidity("");
      const msg = messageFor(el);
      if (msg) {
        el.dataset.ltMsg = "1";
        el.setCustomValidity(msg);
      }
    };
    const reset = (e: Event) => {
      const el = e.target as Field;
      if (el?.dataset?.ltMsg) {
        el.setCustomValidity("");
        delete el.dataset.ltMsg;
      }
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", reset, true);
    document.addEventListener("change", reset, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", reset, true);
      document.removeEventListener("change", reset, true);
    };
  }, []);
  return null;
}
