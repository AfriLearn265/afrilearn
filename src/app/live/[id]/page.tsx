import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { jaasToken, liveProvider } from "@/lib/live";
import { Notice } from "@/components/ui/Field";
import { Logo } from "@/components/brand/Logo";
import { JitsiRoom } from "./JitsiRoom";

export const metadata = { title: "Live class" };

export default async function LiveRoom({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const supabase = await createClient();
  const back = session.profile.role === "teacher" ? "/teacher/live" : "/student/live";
  const { data, error } = await supabase.rpc("check_in_live_class", { p_live: id });
  const { data: lc } = await supabase.from("live_classes").select("title, classrooms(name)").eq("id", id).maybeSingle();

  if (error || !data) {
    return (
      <main className="container-page grid min-h-dvh max-w-lg content-center gap-4">
        <Logo />
        <Notice tone="error" title="You can't join this class right now.">{error?.message}</Notice>
        <Link href={back} className="font-semibold text-adire-700">Back to live classes</Link>
      </main>
    );
  }
  const { room_name, role, attendance } = data as { room_name: string; role: string; attendance?: string };
  const moderator = role === "teacher";
  const p = liveProvider();
  const user = { id: session.userId, name: session.profile.full_name, email: session.email, moderator };
  const cfg = p.kind === "jaas"
    ? { domain: "8x8.vc", scriptSrc: `https://8x8.vc/${p.appId}/external_api.js`, roomName: `${p.appId}/${room_name}`, jwt: jaasToken(p, user) }
    : { domain: "meet.jit.si", scriptSrc: "https://meet.jit.si/external_api.js", roomName: room_name, jwt: null };

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-line bg-white px-4 py-3 md:px-6">
        <Link href={back} className="inline-flex items-center gap-1 text-sm font-semibold text-adire-700"><ChevronLeft className="size-4" aria-hidden="true" />Leave</Link>
        <div className="min-w-0 text-center">
          <p className="truncate font-display font-bold">{lc?.title}</p>
          <p className="truncate text-sm text-muted">{(lc?.classrooms as unknown as { name: string } | null)?.name}{attendance ? `, attendance marked ${attendance}` : moderator ? ", you are the host" : ""}</p>
        </div>
        <span className="w-12 sm:w-14" aria-hidden="true" />
      </header>
      {p.kind === "public" && (
        <div className="px-4 pt-3 md:px-6"><Notice tone="warning">Demo mode: this call uses the free public Jitsi server, which ends embedded calls after 5 minutes. Add JaaS keys in the server settings for unlimited classes.</Notice></div>
      )}
      <div className="flex-1 p-2 sm:p-4 md:p-6">
        <JitsiRoom {...cfg} displayName={session.profile.full_name} email={session.email} moderator={moderator} onLeaveHref={back} />
      </div>
    </div>
  );
}
