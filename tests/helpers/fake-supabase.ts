// Netikras Supabase klientas testams: lentelės atmintyje, tik tos užklausos,
// kurias naudoja mūsų kodas (select/eq/order/maybeSingle/single/upsert + storage).
type Row = Record<string, unknown>;

export type SignCall = {
  bucket: string;
  path: string;
  ttl: number;
  opts?: { download?: string | boolean };
};

export function createFakeSupabase(initial: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = structuredClone(initial);
  const signCalls: SignCall[] = [];
  let userId: string | null = null;

  function from(table: string) {
    const filters: [string, unknown][] = [];
    let selectCols = "*";
    let head = false;
    let order: { col: string; asc: boolean } | null = null;
    let upsert: { row: Row; keys: string[] } | null = null;

    const matching = () =>
      (tables[table] ??= []).filter((r) => filters.every(([c, v]) => r[c] === v));

    // product_files su įdėtu products(...) — kaip PostgREST sąryšis
    const shape = (r: Row): Row =>
      table === "product_files" && selectCols.includes("products(")
        ? { ...r, products: (tables.products ?? []).find((p) => p.id === r.product_id) ?? null }
        : { ...r };

    function run() {
      if (upsert) {
        const list = (tables[table] ??= []);
        const { row, keys } = upsert;
        const i = list.findIndex((r) => keys.every((k) => r[k] === row[k]));
        if (i >= 0) list[i] = { ...list[i], ...row };
        else list.push({ ...row });
        return { data: null, error: null, count: null };
      }
      let list = matching();
      if (order) {
        const { col, asc } = order;
        list = [...list].sort((a, b) => {
          const x = a[col] as string | number;
          const y = b[col] as string | number;
          return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
        });
      }
      if (head) return { data: null, error: null, count: list.length };
      return { data: list.map(shape), error: null, count: list.length };
    }

    const builder = {
      select(cols = "*", opts?: { count?: string; head?: boolean }) {
        selectCols = cols;
        head = !!opts?.head;
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return builder;
      },
      order(col: string, o?: { ascending?: boolean }) {
        order = { col, asc: o?.ascending !== false };
        return builder;
      },
      upsert(row: Row, o?: { onConflict?: string }) {
        upsert = { row, keys: (o?.onConflict ?? "id").split(",").map((k) => k.trim()) };
        return builder;
      },
      async maybeSingle() {
        const r = run();
        return { data: r.data?.[0] ?? null, error: null };
      },
      async single() {
        const r = run();
        return r.data?.length
          ? { data: r.data[0], error: null }
          : { data: null, error: { message: "not found" } };
      },
      then<T>(resolve: (v: ReturnType<typeof run>) => T, reject?: (e: unknown) => T) {
        return Promise.resolve(run()).then(resolve, reject);
      },
    };
    return builder;
  }

  const storage = {
    from(bucket: string) {
      return {
        async createSignedUrl(path: string, ttl: number, opts?: SignCall["opts"]) {
          signCalls.push({ bucket, path, ttl, opts });
          const dl = opts?.download ? `&download=${encodeURIComponent(String(opts.download))}` : "";
          return { data: { signedUrl: `https://storage.test/${bucket}/${path}?ttl=${ttl}${dl}` }, error: null };
        },
      };
    },
  };

  const auth = {
    async getUser() {
      return { data: { user: userId ? { id: userId } : null }, error: null };
    },
  };

  return {
    client: { from, storage, auth },
    tables,
    signCalls,
    /** Kas „prisijungęs" (null — niekas). */
    loginAs(id: string | null) {
      userId = id;
    },
  };
}
