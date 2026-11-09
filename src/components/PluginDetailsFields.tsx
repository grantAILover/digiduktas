// Plugino formų laukai: reikalavimai, demo nuoroda, diegimo instrukcija
const inputCls =
  "rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand";

export default function PluginDetailsFields({
  defaults,
}: {
  defaults?: { requirements?: string | null; demo_url?: string | null; install_guide?: string | null };
}) {
  return (
    <>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Reikalavimai
        <textarea
          name="requirements"
          rows={3}
          defaultValue={defaults?.requirements ?? ""}
          placeholder={"Pvz.\nClaude Pro arba aukštesnė paskyra\nWindows 10+ arba macOS\nGmail paštas"}
          className={inputCls}
        />
        <span className="text-xs font-normal text-muted">Rodoma plugino puslapyje prieš pirkimą. Kiekvienas punktas — naujoje eilutėje.</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Demo vaizdo įrašas (nebūtina)
        <input
          name="demo_url"
          type="url"
          defaultValue={defaults?.demo_url ?? ""}
          placeholder="https://www.youtube.com/watch?v=…"
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Diegimo instrukcija
        <textarea
          name="install_guide"
          rows={8}
          defaultValue={defaults?.install_guide ?? ""}
          placeholder={"1. Atsisiųskite failą buhalteris.zip\n2. Atidarykite Claude → …\n3. …"}
          className={inputCls}
        />
        <span className="text-xs font-normal text-muted">
          Matys tik pirkėjai — skiltyje „Mano pirkiniai“, atidarę pluginą.
        </span>
      </label>
    </>
  );
}
