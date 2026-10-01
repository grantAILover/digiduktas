import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  exchangeOk: true,
  verifyOk: true,
  calls: [] as string[],
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: async () => {
        h.calls.push("exchange");
        return { error: h.exchangeOk ? null : { message: "code verifier not found" } };
      },
      verifyOtp: async () => {
        h.calls.push("verify");
        return { error: h.verifyOk ? null : { message: "expired" } };
      },
    },
  }),
}));

import { GET } from "@/app/auth/confirm/route";

beforeEach(() => {
  h.exchangeOk = true;
  h.verifyOk = true;
  h.calls = [];
});

async function confirm(query: string) {
  const res = await GET(new NextRequest(`https://digiduktas.lt/auth/confirm${query}`));
  return res.headers.get("location");
}

describe("El. pašto patvirtinimas — /auth/confirm", () => {
  it("standartinis Supabase laiškas (?code=) → prisijungęs, į pradžią", async () => {
    expect(await confirm("?code=abc")).toBe("https://digiduktas.lt/");
    expect(h.calls).toEqual(["exchange"]);
  });

  it("nuoroda atidaryta kitame įrenginyje → el. paštas patvirtintas, prašom prisijungti", async () => {
    h.exchangeOk = false;
    expect(await confirm("?code=abc")).toBe("https://digiduktas.lt/auth?patvirtinta=1");
  });

  it("savas šablonas (?token_hash=&type=) → patvirtina", async () => {
    expect(await confirm("?token_hash=t&type=email")).toBe("https://digiduktas.lt/");
    expect(h.calls).toEqual(["verify"]);
  });

  it("pasibaigusi ar panaudota nuoroda → aiškus pranešimas", async () => {
    expect(await confirm("?error=access_denied&error_code=otp_expired")).toBe(
      "https://digiduktas.lt/auth?klaida=nuoroda",
    );
    h.verifyOk = false;
    expect(await confirm("?token_hash=t&type=email")).toBe("https://digiduktas.lt/auth?klaida=nuoroda");
    expect(await confirm("")).toBe("https://digiduktas.lt/auth?klaida=nuoroda");
  });

  it("next leidžia tik vidinius kelius (ne į svetimą svetainę)", async () => {
    expect(await confirm("?code=abc&next=/parduoti")).toBe("https://digiduktas.lt/parduoti");
    expect(await confirm("?code=abc&next=//evil.com")).toBe("https://digiduktas.lt/");
    expect(await confirm("?code=abc&next=https://evil.com")).toBe("https://digiduktas.lt/");
  });
});
