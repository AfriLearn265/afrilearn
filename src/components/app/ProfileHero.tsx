import type { ReactNode } from "react";
import { AdirePattern } from "@/components/landing/Marketing";
import { Avatar } from "@/components/app/Avatar";
import { ImageUpload } from "@/components/app/ImageUpload";
import { saveAvatar } from "@/lib/profile-actions";

export type ProfileStat = { label: string; value: ReactNode };

/** The top of a profile: adire banner, photo, name, a few tags and the person's key numbers. */
export function ProfileHero({ id, userId, name, avatarUrl, subtitle, tags, stats }: {
  id: string; userId: string; name: string; avatarUrl: string | null; subtitle: ReactNode; tags: string[]; stats: ProfileStat[];
}) {
  return (
    <section aria-labelledby={`${id}-name`} className="overflow-hidden rounded-[1.75rem] border border-line bg-white">
      <div className="relative isolate h-28 overflow-hidden bg-adire-900 sm:h-36">
        <AdirePattern id={`${id}-adire`} className="-z-10 text-adire-700/80" />
        <span aria-hidden="true" className="absolute -right-6 -top-10 size-36 rounded-full bg-sun-400 sm:size-44" />
      </div>
      <div className="px-5 pb-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="-mt-12 rounded-full bg-white p-1.5 sm:-mt-14">
            <Avatar name={name} url={avatarUrl} className="size-24 text-3xl sm:size-28" />
          </div>
          <ImageUpload userId={userId} kind="avatar" hasImage={!!avatarUrl} save={saveAvatar} label={avatarUrl ? "Change photo" : "Add a photo"} />
        </div>
        <h1 id={`${id}-name`} className="mt-3 text-[1.75rem] font-bold leading-tight sm:text-3xl">{name}</h1>
        <p className="mt-1 text-muted">{subtitle}</p>
        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="About">
            {tags.map((t) => <li key={t} className="rounded-full bg-wash px-3 py-1 text-sm font-medium text-adire-800">{t}</li>)}
          </ul>
        )}
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-paper px-4 py-3">
              <dt className="text-[0.8rem] text-muted">{s.label}</dt>
              <dd className="mt-0.5 font-display text-2xl font-bold tabular">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
