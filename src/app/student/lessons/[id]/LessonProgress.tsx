"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function LessonProgress({ lessonId, initial, nextHref }: { lessonId: string; initial: string | null; nextHref: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Opening a lesson marks it as started.
  useEffect(() => {
    if (initial) return;
    createClient().rpc("update_lesson_progress", { p_lesson: lessonId, p_percent: 10 })
      .then(({ error }: { error: { message: string } | null }) => { if (!error) setStatus("in_progress"); });
  }, [initial, lessonId]);

  function complete() {
    start(async () => {
      const { error } = await createClient().rpc("update_lesson_progress", { p_lesson: lessonId, p_percent: 100 });
      if (error) return setError(error.message);
      setStatus("completed");
      router.refresh();
      if (nextHref) router.push(nextHref);
    });
  }

  if (status === "completed") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="inline-flex items-center gap-2 font-semibold text-leaf-700"><CheckCircle2 className="size-5" aria-hidden="true" />Lesson complete, +10 points</p>
        {nextHref && <Button variant="outline" onClick={() => router.push(nextHref)}>Next lesson</Button>}
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <Button variant="accent" onClick={complete} loading={pending} className="justify-self-start">{nextHref ? "Mark complete and continue" : "Mark lesson complete"}</Button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
    </div>
  );
}
