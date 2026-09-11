"use client";

import { useRouter } from "next/navigation";

export default function SearchSort({
  q,
  kategorija,
  rikiuoti,
}: {
  q: string;
  kategorija: string | null;
  rikiuoti: string;
}) {
  const router = useRouter();

  function go(next: { q?: string; rikiuoti?: string }) {
    const params = new URLSearchParams();
    if (kategorija) params.set("kategorija", kategorija);
    const newQ = next.q ?? q;
    const newSort = next.rikiuoti ?? rikiuoti;
    if (newQ) params.set("q", newQ);
    if (newSort && newSort !== "naujausi") params.set("rikiuoti", newSort);
    const qs = params.toString();
    router.push(qs ? `/produktai?${qs}` : "/produktai");
  }

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("q") as HTMLInputElement;
          go({ q: input.value.trim() });
        }}
        className="flex flex-1 gap-2"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Ieškoti produktų…"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
        >
          Ieškoti
        </button>
      </form>

      <select
        value={rikiuoti}
        onChange={(e) => go({ rikiuoti: e.target.value })}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
      >
        <option value="naujausi">Naujausi</option>
        <option value="pigiausi">Pigiausi</option>
        <option value="brangiausi">Brangiausi</option>
      </select>
    </div>
  );
}
