#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const backup = process.argv[2] ?? "/Users/mac/Desktop/Supabase-Full-Backup/SQL/full_database.backup";
const outputDir = process.argv[3] ?? "/private/tmp/myuni-supabase-missing-restore";

const targets = {
  identity: {
    tables: [
      "certificate_issuance_queue",
      "modules",
      "org_smtp_configs",
      "panel_organizations",
      "user_module_access",
    ],
    functions: [],
    excludedForeignKeys: [],
  },
  learning: {
    tables: [
      "myuni_analytics",
      "myuni_documents",
      "myuni_edge",
      "myuni_edge_content",
      "myuni_edge_data",
      "myuni_edge_progress",
      "myuni_edge_sections",
      "myuni_kurum_course_lessons_user",
      "myuni_kurum_courses",
      "myuni_kurum_enrollments",
      "myuni_kurum_home",
      "myuni_kurum_lessons_data",
      "myuni_kurum_personalized_education",
      "myuni_kurum_personalized_education_user",
      "myuni_kurum_user_notes",
      "myuni_kurum_user_progress",
      "myuni_session_attendance",
      "myuni_user_notes",
      "myuni_videos_backup",
      "unicom_event_control",
      "unicom_event_enrollments",
      "unicom_event_enrollments_attendance",
      "unicom_event_sessions",
      "unicom_event_sessions_attendance",
      "unicom_events",
      "unicom_home",
      "unicom_sponsors",
      "unicom_topics",
      "unicom_topics_meta",
      "unicom_user_data",
    ],
    functions: [
      "update_myuni_edge_data_timestamp()",
      "update_myuni_kurum_personalized_education_updated_at()",
      "update_myuni_kurum_personalized_education_user_updated_at()",
      "update_unicom_event_control_updated_at()",
      "update_unicom_sponsors_updated_at()",
      "update_updated_at_generic()",
    ],
    excludedForeignKeys: [],
  },
  forms: {
    tables: [
      "myuni_contacts",
      "myuni_opportunity_applications",
      "myuni_opportunity_application_status_history",
      "partners",
      "unilab_vision_votes",
    ],
    functions: [],
    // myuni_opportunities is intentionally located in the Learning database.
    excludedForeignKeys: ["myuni_opportunity_applications_opportunity_id_fkey"],
  },
};

const objectTypes = [
  "SEQUENCE OWNED BY",
  "PUBLICATION TABLE",
  "FK CONSTRAINT",
  "TABLE DATA",
  "ROW SECURITY",
  "SEQUENCE SET",
  "FUNCTION",
  "SEQUENCE",
  "CONSTRAINT",
  "TRIGGER",
  "POLICY",
  "DEFAULT",
  "COMMENT",
  "INDEX",
  "TABLE",
];

mkdirSync(outputDir, { recursive: true });

const schemaFile = join(outputDir, "public-schema-reference.sql");
execFileSync("pg_restore", [
  "--schema-only",
  "--schema=public",
  "--no-owner",
  "--no-privileges",
  `--file=${schemaFile}`,
  backup,
]);

const schema = readFileSync(schemaFile, "utf8");
const sequenceOwners = new Map();
for (const match of schema.matchAll(/ALTER SEQUENCE public\."?([^"\s]+)"? OWNED BY public\."?([^".\s]+)"?\./g)) {
  sequenceOwners.set(match[1], match[2]);
}

const indexTables = new Map();
for (const match of schema.matchAll(/CREATE (?:UNIQUE )?INDEX "?([^"\s]+)"? ON (?:ONLY )?public\."?([^"\s(]+)"?/g)) {
  indexTables.set(match[1], match[2]);
}

const toc = execFileSync("pg_restore", ["--list", backup], { encoding: "utf8" });
const tocLines = toc.split(/\r?\n/).filter((line) => /^\d+;/.test(line));

function parseTocLine(line) {
  const body = line.replace(/^\d+;\s+\d+\s+\d+\s+/, "");
  const type = objectTypes.find((candidate) => body.startsWith(`${candidate} public `));
  if (!type) return null;
  const detailWithOwner = body.slice(`${type} public `.length);
  const lastSpace = detailWithOwner.lastIndexOf(" ");
  return { type, detail: detailWithOwner.slice(0, lastSpace) };
}

function firstToken(value) {
  return value.match(/^"([^"]+)"|^(\S+)/)?.slice(1).find(Boolean);
}

function shouldInclude(parsed, config) {
  const tables = new Set(config.tables);
  const functions = new Set(config.functions);
  const { type, detail } = parsed;

  if (["TABLE", "TABLE DATA", "DEFAULT", "CONSTRAINT", "TRIGGER", "POLICY", "ROW SECURITY"].includes(type)) {
    return tables.has(firstToken(detail));
  }

  if (type === "FK CONSTRAINT") {
    const [table, constraint] = detail.split(/\s+/);
    return tables.has(table) && !config.excludedForeignKeys.includes(constraint);
  }

  if (type === "FUNCTION") return functions.has(detail);

  if (["SEQUENCE", "SEQUENCE SET", "SEQUENCE OWNED BY"].includes(type)) {
    return tables.has(sequenceOwners.get(firstToken(detail)));
  }

  if (type === "INDEX") return tables.has(indexTables.get(firstToken(detail)));

  if (type === "COMMENT") {
    const [subjectType, subject] = detail.split(/\s+/, 2);
    if (subjectType === "TABLE") return tables.has(subject);
    if (subjectType === "COLUMN") return tables.has(subject.split(".")[0]);
    return false;
  }

  if (type === "PUBLICATION TABLE") {
    const [, table] = detail.split(/\s+/, 2);
    return tables.has(table);
  }

  return false;
}

for (const [target, config] of Object.entries(targets)) {
  const selected = tocLines.filter((line) => {
    const parsed = parseTocLine(line);
    return parsed && shouldInclude(parsed, config);
  });

  const listFile = join(outputDir, `${target}.list`);
  const sqlFile = join(outputDir, `${target}.sql`);
  writeFileSync(listFile, `${selected.join("\n")}\n`, { mode: 0o600 });

  execFileSync("pg_restore", [
    `--use-list=${listFile}`,
    "--no-owner",
    "--no-privileges",
    `--file=${sqlFile}`,
    backup,
  ]);

  const counts = new Map();
  for (const line of selected) {
    const type = parseTocLine(line).type;
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const summary = [...counts.entries()].map(([type, count]) => `${type}=${count}`).join(", ");
  console.log(`${target}: ${config.tables.length} tables, ${selected.length} objects (${summary})`);
  console.log(`  ${sqlFile}`);
}

console.log("No generated SQL was written to the repository.");
