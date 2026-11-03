import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

/** Counts a free download, then sends the visitor to the file. Only approved public items resolve. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = createPublicClient();
  const { data } = await db.rpc("public_resources");
  const item = ((data ?? []) as { id: string; url: string }[]).find((r) => r.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.rpc("touch_public_resource", { p_id: id });
  const target = item.url.startsWith("/") ? new URL(item.url, req.nextUrl.origin) : new URL(item.url);
  if (target.protocol !== "https:" && target.origin !== req.nextUrl.origin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.redirect(target, 302);
}
