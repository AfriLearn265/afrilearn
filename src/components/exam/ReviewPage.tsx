import { createClient } from "@/lib/supabase/server";
import { Notice } from "@/components/ui/Field";
import { ButtonLink } from "@/components/ui/Button";
import { AttemptReview, type Review } from "./AttemptReview";

/** Server wrapper shared by the student, teacher and parent review routes. */
export async function ReviewPage({ attemptId, back, backLabel, showStudent }: { attemptId: string; back: string; backLabel: string; showStudent?: boolean }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_attempt_review", { p_attempt: attemptId });
  return (
    <div className="grid gap-6">
      <ButtonLink href={back} variant="ghost" size="sm" className="justify-self-start">{backLabel}</ButtonLink>
      {error || !data ? (
        <Notice tone="error" title="This result couldn't be opened.">{error?.message}</Notice>
      ) : (
        <AttemptReview review={data as Review} showStudent={showStudent} />
      )}
    </div>
  );
}
