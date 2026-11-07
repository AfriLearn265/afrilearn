import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { WaveEdge } from "@/components/brand/Mascot";
import { getBrand } from "@/lib/brand";

const columns = [
  { title: "Learn", links: [["Primary 1 to 6", "/classes"], ["Courses", "/courses"], ["Free worksheets", "/resources"], ["Pricing", "/pricing"]] },
  { title: "Join", links: [["Create a pupil account", "/signup?role=parent"], ["For parents", "/parents"], ["For teachers", "/teachers"], ["Log in", "/login"]] },
  { title: "Help", links: [["Questions people ask", "/faq"], ["Verify a certificate", "/verify"], ["Privacy and child safety", "/privacy"], ["Terms of use", "/terms"], ["Credits", "/credits"]] },
];

export async function SiteFooter() {
  const brand = await getBrand();
  return (
    <footer className="relative mt-auto bg-grape-900 text-grape-100">
      <WaveEdge flip fill="var(--color-paper)" className="absolute inset-x-0 -top-px" />
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 pb-12 pt-20 md:grid-cols-[1.3fr_repeat(3,1fr)] md:pb-14 md:pt-24">
        <div className="col-span-2 md:col-span-1">
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-grape-200">{brand.tagline} Videos, notes and fun quizzes for Primary 1 to Primary 6.</p>
          <a href={`mailto:${brand.supportEmail}`} className="mt-4 inline-block text-sm font-semibold text-white underline-offset-4 hover:underline">{brand.supportEmail}</a>
          <p className="mt-6 max-w-xs rounded-2xl border border-white/15 bg-white/5 p-3.5 text-sm text-grape-200">
            <span className="mb-1 block font-display font-semibold text-sun-300">Coming soon</span>
            Live classes with teachers, and the {brand.name} app with lessons you can save and watch offline.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="font-display text-base font-semibold text-sun-300">{col.title}</h2>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {col.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="text-grape-200 hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-grape-300">© {new Date().getFullYear()} {brand.name}. Made in {brand.country} for curious young learners.</p>
      </div>
    </footer>
  );
}
