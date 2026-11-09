// Plugino papildoma informacija: reikalavimai, demo nuoroda, diegimo instrukcija.
// Be serverio importų — naudojama ir formose.

export type PluginDetailsInput = {
  requirements?: string;
  demoUrl?: string;
  installGuide?: string;
};

export type PluginDetails = {
  requirements: string | null;
  demo_url: string | null;
  install_guide: string | null;
};

const clean = (v: string | undefined, max: number) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};

/** Patikrina laukus. Demo — tik http(s) nuoroda (kad nebūtų „javascript:" ir pan.). */
export function parsePluginDetails(input: PluginDetailsInput): { data?: PluginDetails; error?: string } {
  const demo = clean(input.demoUrl, 500);
  if (demo) {
    let ok = false;
    try {
      ok = ["http:", "https:"].includes(new URL(demo).protocol);
    } catch {}
    if (!ok) return { error: "Demo nuoroda turi prasidėti https:// (pvz. YouTube ar Loom nuoroda)." };
  }
  return {
    data: {
      requirements: clean(input.requirements, 2000),
      demo_url: demo,
      install_guide: clean(input.installGuide, 20000),
    },
  };
}
