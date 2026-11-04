import { Logo } from "@/components/brand/Logo";
import { Mascot, Sparkle } from "@/components/brand/Mascot";
import { AdirePattern } from "@/components/landing/Marketing";
import { getBrand } from "@/lib/brand";

const classes = [
  ["1", "bg-tangerine-400"], ["2", "bg-sun-400"], ["3", "bg-lime-400"],
  ["4", "bg-sky-400"], ["5", "bg-bubble-400"], ["6", "bg-grape-300"],
] as const;

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,27rem)_1fr] xl:grid-cols-[minmax(0,31rem)_1fr]">
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-grape-700 p-10 text-white lg:flex">
        <div aria-hidden="true" className="sky-dots absolute inset-0 -z-10" />
        <AdirePattern id="auth-pattern" className="-z-10 text-grape-500/40" />
        <Logo tone="light" />
        <div>
          <p className="font-display text-[2.6rem] font-semibold leading-[1.02]">Six classes.<br />One happy journey.</p>
          <ol className="mt-8 flex gap-2" aria-label="Primary 1 to Primary 6">
            {classes.map(([n, bg], i) => (
              <li key={n} className={`sticker-sm grid size-11 place-items-center rounded-xl font-display text-xl font-semibold text-ink ${bg} ${i % 2 ? "rotate-3" : "-rotate-3"}`}>
                <span className="sr-only">Primary </span>{n}
              </li>
            ))}
          </ol>
          <div className="relative mt-10 w-72">
            <span aria-hidden="true" className="absolute inset-[10%] -z-10 rounded-full bg-sun-400" />
            <Sparkle className="absolute -right-4 top-2 size-8" color="#FF6BAA" />
            <Mascot pose="wave" prop="book" className="w-full" />
          </div>
        </div>
        <p className="text-sm text-grape-200">{brand.tagline}</p>
      </aside>
      <main id="main" className="flex flex-col px-5 py-8 md:px-10">
        <div className="lg:hidden"><Logo /></div>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
