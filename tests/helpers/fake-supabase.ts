// Netikras Supabase klientas testams: lentelės atmintyje, tik tos užklausos,
// kurias naudoja mūsų kodas (select/eq/in/order/maybeSingle/single/insert/update/upsert + storage).
type Row = Record<string, unknown>;
type Filter = (r: Row) => boolean;

export type SignCall = {
  bucket: string;
  path: string;
  ttl: number;
  opts?: { download?: string | boolean };
};

/** Unikalūs stulpeliai (kaip DB indeksai) — pažeidus grąžinama klaida 23505. */
const UNIQUE: Record<string, string[]> = {
  orders: ["stripe_session_id"],
};

export function createFakeSupabase(initial: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = structuredClone(initial);
  const signCalls: SignCall[] = [];
  let userId: string | null = null;

  function from(table: string) {
    const filters: Filter[] = [];
    let selectCols = "*";
    let head = false;
    let order: { col: string; asc: boolean } | null = null;
    let op: "select" | "insert" | "update" | "upsert" = "select";
    let payload: Row | Row[] | null = null;
    let conflictKeys: string[] = [];

    const list = () => (tables[table] ??= []);
    const matching = () => list().filter((r) => filters.every((f) => f(r)));

    // product_files su įdėtu products(...) — kaip PostgREST sąryšis
    const shape = (r: Row): Row =>
      table === "product_files" && selectCols.includes("products(")
        ? { ...r, products: (tables.products ?? []).find((p) => p.id === r.product_id) ?? null }
        : { ...r };

    function run(): { data: Row[] | null; error: { code: string; message: string } | null; count: number | null } {
      if (op === "insert") {
        const rows = (Array.isArray(payload) ? payload : [payload!]).map(
          (r): Row => ({ id: crypto.randomUUID(), ...r }),
        );
        for (const r of rows) {
          for (const col of UNIQUE[table] ?? []) {
            if (r[col] != null && list().some((x) => x[col] === r[col])) {
              return { data: null, error: { code: "23505", message: `duplicate ${col}` }, count: null };
            }
          }
        }
        list().push(...rows);
        return { data: rows.map(shape), error: null, count: rows.length };
      }
      if (op === "update") {
        const rows = matching();
        rows.forEach((r) => Object.assign(r, payload));
        return { data: rows.map(shape), error: null, count: rows.length };
      }
      if (op === "upsert") {
        const row = payload as Row;
        const i = list().findIndex((r) => conflictKeys.every((k) => r[k] === row[k]));
        if (i >= 0) list()[i] = { ...list()[i], ...row };
        else list().push({ ...row });
        return { data: null, error: null, count: null };
      }
      let rows = matching();
      if (order) {
        const { col, asc } = order;
        rows = [...rows].sort((a, b) => {
          const x = a[col] as string | number;
          const y = b[col] as string | number;
          return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
        });
      }
      if (head) return { data: null, error: null, count: rows.length };
      return { data: rows.map(shape), error: null, count: rows.length };
    }

    const builder = {
      select(cols = "*", opts?: { count?: string; head?: boolean }) {
        selectCols = cols;
        head = !!opts?.head;
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      in(col: string, vals: unknown[]) {
        filters.push((r) => vals.includes(r[col]));
        return builder;
      },
      order(col: string, o?: { ascending?: boolean }) {
        order = { col, asc: o?.ascending !== false };
        return builder;
      },
      insert(rows: Row | Row[]) {
        op = "insert";
        payload = rows;
        return builder;
      },
      update(patch: Row) {
        op = "update";
        payload = patch;
        return builder;
      },
      upsert(row: Row, o?: { onConflict?: string }) {
        op = "upsert";
        payload = row;
        conflictKeys = (o?.onConflict ?? "id").split(",").map((k) => k.trim());
        return builder;
      },
      async maybeSingle() {
        const r = run();
        return { data: r.data?.[0] ?? null, error: r.error };
      },
      async single() {
        const r = run();
        if (r.error) return { data: null, error: r.error };
        return r.data?.length
          ? { data: r.data[0], error: null }
          : { data: null, error: { code: "PGRST116", message: "not found" } };
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
      return {
        data: { user: userId ? { id: userId, email: `${userId.slice(0, 4)}@test.lt` } : null },
        error: null,
      };
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
