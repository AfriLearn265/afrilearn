"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";

type Note = { id: string; title: string; body: string | null; link: string | null; is_read: boolean; created_at: string };

export function NotificationBell() {
  const supabase = createClient();
  const [items, setItems] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    let alive = true;
    const fetchNotes = () =>
      supabase.from("notifications").select("id, title, body, link, is_read, created_at")
        .order("created_at", { ascending: false }).limit(12)
        .then(({ data }: { data: unknown }) => { if (alive) setItems((data as Note[]) ?? []); });
    fetchNotes();
    const t = setInterval(fetchNotes, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  async function markAll() {
    await supabase.rpc("mark_notifications_read", { p_ids: null });
    setItems((xs) => xs.map((x) => ({ ...x, is_read: true })));
  }

  return (
    <div className="relative" ref={box}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true"
        className="relative grid size-10 place-items-center rounded-xl border border-line bg-white text-ink-soft hover:text-ink">
        <Bell className="size-[1.15rem]" aria-hidden="true" />
        <span className="sr-only">Notifications{unread ? `, ${unread} unread` : ""}</span>
        {unread > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[0.7rem] font-bold text-white">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-1.5rem)] animate-fade-in overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">Notifications</p>
            {unread > 0 && <button type="button" onClick={markAll} className="text-sm font-semibold text-adire-700 hover:underline">Mark all as read</button>}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Nothing yet. New assignments, results and messages will show up here.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {items.map((n) => {
                const inner = (
                  <>
                    <p className={`text-sm ${n.is_read ? "font-medium text-ink-soft" : "font-semibold"}`}>{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.body}</p>}
                    <p className="mt-1 text-xs text-faint">{timeAgo(n.created_at)}</p>
                  </>
                );
                return (
                  <li key={n.id} className={n.is_read ? "" : "bg-adire-50/60"}>
                    {n.link ? <Link href={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-wash">{inner}</Link> : <div className="px-4 py-3">{inner}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
