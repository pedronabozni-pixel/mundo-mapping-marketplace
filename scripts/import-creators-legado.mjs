// Importação staging da base legado de creators (Mundo Mapping/MariaDB)
// para a tabela creators_legado no Supabase. FASE 1: nenhuma conta é criada.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-creators-legado.mjs \
//     --schema /caminho/mapping-dump-influenciadores.sql \
//     --data   /caminho/mapping-dump-influenciadores-dados.sql
//
// Segurança (LGPD / minimização):
// - Os dumps NUNCA entram no repositório (ver .gitignore).
// - Campos sensíveis ficam de fora de propósito: password, inf_banco*, inf_pix*,
//   CPF/CNPJ e dados do responsável NÃO são lidos nem enviados.
// - Nenhum registro completo é impresso; logs só com contagens e legacy_id.
//
// Idempotência / re-sync (o sistema antigo continua vivo):
// - Upsert por legacy_id.
// - Registros com ativado=true no Supabase NUNCA são atualizados (quem ativou
//   a conta é dono dos próprios dados) — são pulados no upsert.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ─── CLI / env ────────────────────────────────────────────────────────────────

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const SCHEMA_PATH = arg("schema");
const DATA_PATH = arg("data");
// --dry-run: parseia, filtra e deduplica SEM tocar o Supabase (não exige chaves)
const DRY_RUN = process.argv.includes("--dry-run");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SCHEMA_PATH || !DATA_PATH || (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY))) {
  console.error(
    "Faltam parâmetros. Uso:\n" +
      "  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-creators-legado.mjs " +
      "--schema <estrutura.sql> --data <dados.sql>",
  );
  process.exit(1);
}

const supabase = DRY_RUN
  ? null
  : createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

// ─── Parser do dump MySQL/MariaDB ─────────────────────────────────────────────

/** Extrai a ordem das colunas do CREATE TABLE `nome` no dump de estrutura. */
function parseCreateTableColumns(sql, table) {
  const re = new RegExp("CREATE TABLE [`\"]?" + table + "[`\"]?\\s*\\(([\\s\\S]*?)\\)\\s*ENGINE", "i");
  const m = sql.match(re);
  if (!m) throw new Error(`CREATE TABLE ${table} não encontrado no dump de estrutura`);
  const cols = [];
  for (const rawLine of m[1].split("\n")) {
    const line = rawLine.trim();
    const cm = line.match(/^`([^`]+)`/);
    // pula PRIMARY KEY / KEY / UNIQUE / CONSTRAINT
    if (cm && !/^(PRIMARY|UNIQUE|KEY|CONSTRAINT|FULLTEXT|SPATIAL|INDEX)/i.test(line)) {
      cols.push(cm[1]);
    }
  }
  if (cols.length === 0) throw new Error(`Nenhuma coluna lida para ${table}`);
  return cols;
}

/**
 * Tokenizer de tuplas de um INSERT INTO ... VALUES (...),(...);
 * Trata: strings com \' \\ \" \n etc., '' como aspas escapadas, NULL, números.
 * Retorna arrays de valores (string | null).
 */
function parseTuples(valuesBlob) {
  const rows = [];
  let i = 0;
  const n = valuesBlob.length;
  while (i < n) {
    // acha o início da próxima tupla
    while (i < n && valuesBlob[i] !== "(") i++;
    if (i >= n) break;
    i++; // consome '('
    const row = [];
    let field = "";
    let inString = false;
    let wasQuoted = false; // distingue NULL (palavra-chave) de 'NULL' (string)
    let done = false;
    while (i < n && !done) {
      const c = valuesBlob[i];
      if (inString) {
        if (c === "\\") {
          // escape MySQL: \' \" \\ \n \r \t \0 \Z
          const next = valuesBlob[i + 1];
          const map = { n: "\n", r: "\r", t: "\t", "0": "\0", Z: "\x1a" };
          field += map[next] ?? next;
          i += 2;
          continue;
        }
        if (c === "'") {
          if (valuesBlob[i + 1] === "'") { field += "'"; i += 2; continue; } // '' escapado
          inString = false;
          i++;
          continue;
        }
        field += c;
        i++;
        continue;
      }
      if (c === "'") { inString = true; wasQuoted = true; i++; continue; }
      if (c === "," || c === ")") {
        if (wasQuoted) {
          row.push(field);
        } else {
          const t = field.trim();
          row.push(t === "" || t.toUpperCase() === "NULL" ? null : t);
        }
        field = "";
        wasQuoted = false;
        if (c === ")") done = true;
        i++;
        continue;
      }
      field += c;
      i++;
    }
    rows.push(row);
    // consome separador entre tuplas (",", espaços) ou ";" final
    while (i < n && valuesBlob[i] !== "(" && valuesBlob[i] !== ";") i++;
    if (valuesBlob[i] === ";") {
      // fim deste INSERT; o chamador envia um blob por INSERT, então paramos
      i++;
    }
  }
  return rows;
}

/** Extrai todas as linhas da tabela a partir do dump de dados. */
function parseTableRows(sql, table, schemaCols) {
  const rows = [];
  // casa INSERT INTO `tabela` [(`col`,...)] VALUES ...;
  const re = new RegExp(
    "INSERT INTO [`\"]?" + table + "[`\"]?\\s*(\\([^)]*\\))?\\s*VALUES\\s*",
    "gi",
  );
  let m;
  while ((m = re.exec(sql)) !== null) {
    let cols = schemaCols;
    if (m[1]) {
      cols = [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]);
    }
    // pega o blob de VALUES até o ';' que encerra o statement (fora de string)
    let i = re.lastIndex;
    let inString = false;
    while (i < sql.length) {
      const c = sql[i];
      if (inString) {
        if (c === "\\") { i += 2; continue; }
        if (c === "'") inString = false;
      } else if (c === "'") {
        inString = true;
      } else if (c === ";") {
        break;
      }
      i++;
    }
    const blob = sql.slice(re.lastIndex, i);
    for (const tuple of parseTuples(blob)) {
      if (tuple.length !== cols.length) {
        throw new Error(
          `${table}: tupla com ${tuple.length} valores, esperado ${cols.length} — parser desalinhado, abortando para não corromper dados`,
        );
      }
      const obj = {};
      cols.forEach((col, idx) => (obj[col] = tuple[idx]));
      rows.push(obj);
    }
    re.lastIndex = i;
  }
  return rows;
}

// ─── Helpers de normalização ──────────────────────────────────────────────────

const toInt = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
};
const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).trim());
  return Number.isFinite(n) ? n : null;
};
const toStr = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Lendo dumps (nada é copiado para o repositório)...");
  const schemaSql = readFileSync(SCHEMA_PATH, "utf8");
  const dataSql = readFileSync(DATA_PATH, "utf8");

  const infCols = parseCreateTableColumns(schemaSql, "influenciadores");
  const endCols = parseCreateTableColumns(schemaSql, "enderecos");
  console.log(`Estrutura: influenciadores=${infCols.length} colunas, enderecos=${endCols.length} colunas`);

  const influencers = parseTableRows(dataSql, "influenciadores", infCols);
  const enderecos = parseTableRows(dataSql, "enderecos", endCols);
  console.log(`Lidos: ${influencers.length} influenciadores, ${enderecos.length} enderecos`);

  const endById = new Map(enderecos.map((e) => [String(e.id), e]));

  // ── Filtros (decisão de produto) ────────────────────────────────────────────
  const discarded = { excluido: 0, inativo: 0, status: 0 };
  const filtered = [];
  for (const r of influencers) {
    if (toInt(r.inf_excluido) === 1) { discarded.excluido++; continue; }
    if (toInt(r.inf_ativo) === 0) { discarded.inativo++; continue; }
    const status = (toStr(r.inf_status) ?? "").toUpperCase();
    if (status === "INATIVO" || status === "REPROVADO") { discarded.status++; continue; }
    filtered.push(r);
  }

  // ── Dedup por email_normalizado (mantém updated_at mais recente) ───────────
  const byEmail = new Map();
  let dedupDiscarded = 0;
  const noEmail = [];
  for (const r of filtered) {
    const email = toStr(r.email);
    const norm = email ? email.toLowerCase() : null;
    if (!norm) { noEmail.push(r); continue; }
    const prev = byEmail.get(norm);
    if (!prev) { byEmail.set(norm, r); continue; }
    const a = String(r.updated_at ?? "");
    const b = String(prev.updated_at ?? "");
    if (a > b) byEmail.set(norm, r);
    dedupDiscarded++;
  }
  const deduped = [...byEmail.values(), ...noEmail];

  // ── Mapeamento legado -> creators_legado ───────────────────────────────────
  const records = deduped.map((r) => {
    const email = toStr(r.email);
    const end = r.inf_id_endereco ? endById.get(String(toInt(r.inf_id_endereco))) : undefined;
    return {
      legacy_id: toInt(r.id),
      email,
      email_normalizado: email ? email.toLowerCase() : null,
      nome: toStr(r.inf_nome),
      celular: toStr(r.inf_celular) ?? toStr(r.inf_telefone),
      bio: toStr(r.inf_bio),
      cidade: end ? toStr(end.end_cidade) : null,
      estado: end ? toStr(end.end_estado) : null,
      rede_principal: toStr(r.inf_rede_social_principal),
      instagram: toStr(r.inf_instagram),
      instagram_seguidores: toInt(r.inf_instagram_seguidores),
      tiktok: toStr(r.inf_tiktok),
      tiktok_seguidores: toInt(r.inf_tiktok_seguidores),
      youtube: toStr(r.inf_youtube),
      youtube_inscritos: toInt(r.inf_youtube_inscritos),
      taxa_engajamento: toNum(r.inf_taxa_engajamento_mapping) ?? toNum(r.inf_taxa_engajamento),
      status_legado: toStr(r.inf_status),
      interesse_afiliados: toInt(r.inf_interesse_afiliados) === 1,
      asaas_customer_id: toStr(r.inf_id_asaas),
      asaas_wallet_id: toStr(r.inf_id_wallet),
      criado_em_legado: toStr(r.created_at),
    };
  }).filter((r) => r.legacy_id !== null);

  if (DRY_RUN) {
    console.log("\n=== DRY-RUN (nada enviado ao Supabase) ===");
    console.log(`Total lido (influenciadores):     ${influencers.length}`);
    console.log(`Descartados inf_excluido=1:       ${discarded.excluido}`);
    console.log(`Descartados inf_ativo=0:          ${discarded.inativo}`);
    console.log(`Descartados status INATIVO/REPR.: ${discarded.status}`);
    console.log(`Descartados por dedup de email:   ${dedupDiscarded}`);
    console.log(`Sem email (mantidos):             ${noEmail.length}`);
    console.log(`Prontos para upsert:              ${records.length}`);
    const s = records.slice(0, 3);
    console.log("Amostras (legacy_id | rede | cidade/UF):");
    for (const r of s) console.log(`  ${r.legacy_id} | ${r.rede_principal ?? "-"} | ${r.cidade ?? "-"}/${r.estado ?? "-"}`);
    return;
  }

  // ── Estado atual no Supabase: existentes e ativados ────────────────────────
  console.log("Consultando estado atual de creators_legado (legacy_id, ativado)...");
  const existing = new Map(); // legacy_id -> ativado
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("creators_legado")
      .select("legacy_id, ativado")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Falha lendo creators_legado: ${error.message}`);
    for (const row of data) existing.set(row.legacy_id, Boolean(row.ativado));
    if (data.length < PAGE) break;
  }
  console.log(`Já existem ${existing.size} registros no staging.`);

  const skippedActivated = [];
  const toUpsert = [];
  let willInsert = 0;
  let willUpdate = 0;
  for (const rec of records) {
    const ativado = existing.get(rec.legacy_id);
    if (ativado === true) { skippedActivated.push(rec.legacy_id); continue; }
    if (existing.has(rec.legacy_id)) willUpdate++;
    else willInsert++;
    toUpsert.push(rec);
  }

  // ── Upsert em lotes ─────────────────────────────────────────────────────────
  const BATCH = 500;
  let sent = 0;
  for (let i = 0; i < toUpsert.length; i += BATCH) {
    const batch = toUpsert.slice(i, i + BATCH);
    const { error } = await supabase
      .from("creators_legado")
      .upsert(batch, { onConflict: "legacy_id" });
    if (error) {
      throw new Error(`Falha no upsert (lote a partir do índice ${i}): ${error.message}`);
    }
    sent += batch.length;
    process.stdout.write(`\rUpsert: ${sent}/${toUpsert.length}`);
  }
  console.log();

  // ── Conferência ─────────────────────────────────────────────────────────────
  const { count, error: countErr } = await supabase
    .from("creators_legado")
    .select("*", { count: "exact", head: true });
  if (countErr) throw new Error(`Falha na contagem final: ${countErr.message}`);

  console.log("\n=== RELATÓRIO ===");
  console.log(`Total lido (influenciadores):     ${influencers.length}`);
  console.log(`Descartados inf_excluido=1:       ${discarded.excluido}`);
  console.log(`Descartados inf_ativo=0:          ${discarded.inativo}`);
  console.log(`Descartados status INATIVO/REPR.: ${discarded.status}`);
  console.log(`Descartados por dedup de email:   ${dedupDiscarded}`);
  console.log(`Sem email (mantidos):             ${noEmail.length}`);
  console.log(`Pulados (ativado=true, donos):    ${skippedActivated.length}${skippedActivated.length ? ` -> legacy_ids: ${skippedActivated.slice(0, 20).join(", ")}${skippedActivated.length > 20 ? "..." : ""}` : ""}`);
  console.log(`Enviados no upsert:               ${toUpsert.length} (novos: ${willInsert}, atualizados: ${willUpdate})`);
  console.log(`count(*) creators_legado agora:   ${count}`);

  // 3 amostras (campos não sensíveis apenas)
  const { data: samples } = await supabase
    .from("creators_legado")
    .select("legacy_id, nome, rede_principal, instagram_seguidores, tiktok_seguidores, youtube_inscritos")
    .order("legacy_id", { ascending: true })
    .limit(3);
  console.log("\nAmostras:");
  for (const s of samples ?? []) {
    const seguidores = s.instagram_seguidores ?? s.tiktok_seguidores ?? s.youtube_inscritos ?? "-";
    console.log(`  legacy_id=${s.legacy_id} | ${s.nome} | ${s.rede_principal ?? "-"} | seguidores: ${seguidores}`);
  }
}

main().catch((err) => {
  console.error("ERRO:", err.message);
  process.exit(1);
});
