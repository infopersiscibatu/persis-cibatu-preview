// @ts-nocheck
/**
 * Pengganti db/pool.js: fungsi `tanya(sql, params)` yang sama persis bentuknya,
 * tetapi berjalan lewat database Lovable Cloud (fungsi jalankan_sql, hanya server).
 */

function literal(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number" || typeof v === "bigint") {
    if (typeof v === "number" && !Number.isFinite(v)) return "NULL";
    return `'${String(v)}'`;
  }
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (Array.isArray(v)) return `'${arrayPg(v).replace(/'/g, "''")}'`;
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function arrayPg(arr) {
  return (
    "{" +
    arr
      .map((x) => {
        if (x === null || x === undefined) return "NULL";
        if (Array.isArray(x)) return arrayPg(x);
        const s = typeof x === "object" ? JSON.stringify(x) : String(x);
        return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
      })
      .join(",") +
    "}"
  );
}

/** Ganti $1..$n dengan nilai literal yang aman (lewati teks dalam tanda kutip). */
export function isiParameter(sql, params = []) {
  if (!params || params.length === 0) return sql;
  let hasil = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") j += 2;
        else if (sql[j] === "'") break;
        else j++;
      }
      hasil += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === "$" && /[0-9]/.test(sql[i + 1] || "")) {
      let j = i + 1;
      while (/[0-9]/.test(sql[j] || "")) j++;
      const n = Number(sql.slice(i + 1, j));
      hasil += literal(params[n - 1]);
      i = j;
      continue;
    }
    hasil += c;
    i++;
  }
  return hasil;
}

let klien = null;
async function admin() {
  if (klien) return klien;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  klien = supabaseAdmin;
  return klien;
}

export async function tanya(sql, params = []) {
  if (/^\s*(begin|commit|rollback|start transaction)\b/i.test(String(sql))) return { rows: [], rowCount: 0 };
  const q = isiParameter(String(sql).trim().replace(/;\s*$/, ""), params);
  const db = await admin();
  const { data, error } = await db.rpc("jalankan_sql", { q });
  if (error) {
    const e = new Error(error.message);
    e.code = error.code;
    e.detail = error.details;
    throw e;
  }
  return { rows: data?.rows ?? [], rowCount: data?.rowCount ?? 0 };
}

export async function adminKlien() {
  return admin();
}
