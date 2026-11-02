import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKETS = new Set(["materials", "submissions", "teacher-documents", "question-images"]);

// Opens a private file. Storage policies decide whether this user may read it;
// on success we redirect to a short-lived signed URL.
export async function GET(req: NextRequest, { params }: { params: Promise<{ bucket: string }> }) {
  const { bucket } = await params;
  const path = req.nextUrl.searchParams.get("path");
  if (!BUCKETS.has(bucket) || !path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  const download = req.nextUrl.searchParams.get("download") === "1";
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300, download ? { download: true } : undefined);
  if (error || !data) return NextResponse.json({ error: "You don't have access to this file, or it no longer exists." }, { status: 403 });
  if (bucket === "materials") {
    await supabase.rpc("touch_material_download", { p_path: path }).then(() => null, () => null);
  }
  return NextResponse.redirect(data.signedUrl);
}
