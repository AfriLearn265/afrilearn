import { Logo } from "@/components/brand/Logo";
import { getBrand } from "@/lib/brand";

const stops = ["Nursery", "Primary", "Junior Secondary", "Senior Secondary", "WAEC, NECO and JAMB"];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,26rem)_1fr] xl:grid-cols-[minmax(0,30rem)_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-adire-800 p-10 text-white lg:flex">
        <Logo tone="light" />
        <div>
          <p className="font-display text-[2.4rem] font-bold leading-[1.05] tracking-tight">Every class, one path.</p>
          <ol className="relative mt-10 grid gap-5">
            <span aria-hidden="true" className="absolute bottom-3 left-[0.6rem] top-3 w-[3px] rounded-full bg-adire-500" />
            {stops.map((s, i) => (
              <li key={s} className="relative flex items-center gap-4">
                <span className={`relative z-10 size-[1.4rem] rounded-full border-[3px] ${i === stops.length - 1 ? "border-sun-400 bg-sun-400" : "border-white bg-adire-800"}`} />
                <span className="text-adire-50">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-sm text-adire-200">{brand.tagline}</p>
      </aside>
      <main id="main" className="flex flex-col px-5 py-8 md:px-10">
        <div className="lg:hidden"><Logo /></div>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
