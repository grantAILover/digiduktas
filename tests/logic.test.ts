import { describe, expect, it } from "vitest";
import { decideRole, mayDownload } from "@/lib/access";
import { canDisableDownload, detectKind } from "@/lib/files";
import { parseProgressBody } from "@/lib/progress";
import { effectiveAllowDownload, toNewFileRow } from "@/lib/product-files-server";
import { MIN_PRICE_CENTS, parsePriceEur, priceError } from "@/lib/pricing";
import { ACTIVE_CATEGORIES, categoryName, isActiveCategory } from "@/lib/categories";

describe("Kategorijos", () => {
  it("pasirenkamos tik VBE ir mokyklinė medžiaga", () => {
    expect(ACTIVE_CATEGORIES.map((c) => c.slug)).toEqual(["vbe", "mokykline"]);
    expect(isActiveCategory("vbe")).toBe(true);
    expect(isActiveCategory("mokykline")).toBe(true);
    expect(isActiveCategory("sablonai")).toBe(false); // netrukus
    expect(isActiveCategory("e-knygos")).toBe(false); // išjungta (autorių teisės)
    expect(isActiveCategory("muzika")).toBe(false);
    expect(isActiveCategory("")).toBe(false);
  });

  it("senų produktų kategorijų pavadinimai nesulūžta", () => {
    expect(categoryName("e-knygos")).toBe("E-knygos ir gidai");
    expect(categoryName("grafika")).toBe("Grafika ir dizainas");
    expect(categoryName("nezinoma")).toBe("Kita");
  });
});

describe("Kainos", () => {
  it("supranta lietuvišką ir angliško formato kainą", () => {
    expect(parsePriceEur("9,99")).toBe(999);
    expect(parsePriceEur("9.99")).toBe(999);
    expect(parsePriceEur(" 3 ")).toBe(300);
    expect(parsePriceEur("abc")).toBeNull();
    expect(parsePriceEur("-5")).toBeNull();
    expect(parsePriceEur("1.999")).toBeNull();
  });

  it("minimali kaina 3 € — pigesni produktai būtų nuostolingi", () => {
    expect(MIN_PRICE_CENTS).toBe(300);
    expect(priceError(299)).toContain("3,00 €");
    expect(priceError(300)).toBeNull();
    expect(priceError(null)).not.toBeNull();
    // Lūžio taškas: 10 % komisija turi padengti Stripe ~1,5 % + 0,25 €
    expect(MIN_PRICE_CENTS * 0.1).toBeGreaterThanOrEqual(MIN_PRICE_CENTS * 0.015 + 25);
  });
});

describe("Prieigos taisyklės", () => {
  const base = { userId: "u", sellerId: "s", isAdmin: false, hasPaidOrder: false };

  it("kas turi prieigą", () => {
    expect(decideRole({ ...base, userId: "s" })).toBe("owner");
    expect(decideRole({ ...base, isAdmin: true })).toBe("admin");
    expect(decideRole({ ...base, hasPaidOrder: true })).toBe("buyer");
    expect(decideRole(base)).toBeNull();
  });

  it("atsisiųsti: pirkėjui — tik jei leidžia pardavėjas; savininkui/adminui — visada", () => {
    expect(mayDownload("buyer", false)).toBe(false);
    expect(mayDownload("buyer", true)).toBe(true);
    expect(mayDownload("owner", false)).toBe(true);
    expect(mayDownload("admin", false)).toBe(true);
  });
});

describe("Failų tipai", () => {
  it("atpažįsta pagal plėtinį, atsarginis — MIME", () => {
    expect(detectKind("Knyga.PDF")).toBe("pdf");
    expect(detectKind("skyrius 1.MP3")).toBe("audio");
    expect(detectKind("pamoka.m4a")).toBe("audio");
    expect(detectKind("kursas.mp4")).toBe("video");
    expect(detectKind("presetai.zip")).toBe("other");
    expect(detectKind("be-pletinio", "audio/mpeg")).toBe("audio");
  });

  it("atsisiuntimą išjungti galima tik kai VISI failai peržiūrimi naršyklėje", () => {
    expect(canDisableDownload(["pdf", "audio"])).toBe(true);
    expect(canDisableDownload(["pdf", "other"])).toBe(false);
    expect(canDisableDownload([])).toBe(false);
    expect(effectiveAllowDownload(false, ["pdf", "other"])).toBe(true); // ZIP → priverstinai leidžiama
    expect(effectiveAllowDownload(false, ["audio"])).toBe(false);
  });
});

describe("Įkeliamų failų patikra (serveris)", () => {
  const user = "11111111-1111-4111-8111-111111111111";
  const ok = { storagePath: `${user}/x-knyga.pdf`, fileName: "knyga.pdf", mimeType: "application/pdf", sizeBytes: 10 };

  it("priima failą pardavėjo aplanke ir pats nustato tipą", () => {
    expect(toNewFileRow(user, { ...ok, mimeType: "audio/mpeg" })).toMatchObject({ kind: "pdf" });
  });

  it("atmeta svetimą kelią ir '..' (negalima prisegti kito pardavėjo failo)", () => {
    expect(toNewFileRow(user, { ...ok, storagePath: "kitas-vartotojas/failas.pdf" })).toBeNull();
    expect(toNewFileRow(user, { ...ok, storagePath: `${user}/../kitas/failas.pdf` })).toBeNull();
    expect(toNewFileRow(user, { ...ok, fileName: "   " })).toBeNull();
  });
});

describe("Pozicijos duomenų patikra", () => {
  it("priima teisingus, atmeta šiukšles", () => {
    expect(parseProgressBody({ productFileId: "f", positionSeconds: 12.34 })).toEqual({ fileId: "f", seconds: 12.3 });
    expect(parseProgressBody({ productFileId: "f", positionSeconds: -1 })).toBeNull();
    expect(parseProgressBody({ productFileId: "f", positionSeconds: "x" })).toBeNull();
    expect(parseProgressBody({ positionSeconds: 5 })).toBeNull();
    expect(parseProgressBody(null)).toBeNull();
    expect(parseProgressBody({ productFileId: "f", positionSeconds: 1e9 })?.seconds).toBe(48 * 3600);
  });
});
