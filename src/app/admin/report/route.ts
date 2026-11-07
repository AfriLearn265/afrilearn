import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Row = (string | number | null | undefined)[];

const cell = (v: string | number | null | undefined) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/** The dashboard's numbers as a spreadsheet (CSV opens in Excel and Google Sheets). Administrators only. */
export async function GET(request: Request) {
  await requireRole("admin");
  const range = Number(new URL(request.url).searchParams.get("range"));
  const days = [7, 30, 90].includes(range) ? range : 30;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_insights", { p_days: days });
  if (error || !data) return new Response("The report couldn't be made. Try again.", { status: 500 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- shape documented in database/updates/2026-11-07-scheme-and-insights.sql
  const d = data as any;
  const k = d.kpis;
  const today = new Date().toISOString().slice(0, 10);
  const rows: Row[] = [
    [`AfriLearn report, last ${days} days, made ${today}`], [],
    ["Measure", `Last ${days} days`, `Previous ${days} days`],
    ["New accounts", k.signups, k.signups_prev], ["Active pupils", k.active, k.active_prev],
    ["Videos watched", k.videos, k.videos_prev], ["Quizzes taken", k.quizzes, k.quizzes_prev],
    ["Revenue (naira)", Number(k.revenue) / 100, Number(k.revenue_prev) / 100],
    ["Average lesson rating", k.rating ?? "", ""], ["Pupils", k.pupils, ""], ["Parents", k.parents, ""], ["Active teachers", k.teachers, ""],
    [],
    ["Class", "Pupils", `Active (last ${days} days)`, "Teachers", "Topics this term", "Topic completions this term"],
    ...d.classes.map((c: Record<string, unknown>) => [c.name, c.pupils, c.active, c.teachers, c.term_topics, c.term_done] as Row),
    [],
    ["Class", "Subject", "Topics", "With video", "With notes", "With quiz"],
    ...d.coverage.map((c: Record<string, unknown>) => [c.class_name, c.subject_name, c.topics, c.with_video, c.with_notes, c.with_quiz] as Row),
    [],
    ["Popular lesson", "Class", "Video views", "Quiz plays", "Rating"],
    ...d.top_lessons.map((l: Record<string, unknown>) => [l.title, l.class_name, l.views, l.plays, l.stars] as Row),
    [],
    ["Teacher", "Videos", `New videos (last ${days} days)`, "Video views", "Classrooms"],
    ...d.teachers.map((t: Record<string, unknown>) => [t.full_name, t.videos, t.videos_recent, t.views, t.classrooms] as Row),
    [],
    ["Daily", "New accounts", "Videos watched", "Quizzes taken"],
    ...d.daily.map((x: Record<string, unknown>) => [x.day, x.signups, x.videos, x.quizzes] as Row),
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="afrilearn-report-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
