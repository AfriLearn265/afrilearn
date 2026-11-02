import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { brand } from "@/config/brand";

const columns = [
  { title: "Learn", links: [["Classes", "/#classes"], ["Exam preparation", "/#exams"], ["Pricing", "/#pricing"], ["Questions", "/#faq"]] },
  { title: "Join", links: [["Create a student account", "/signup?role=student"], ["Register as a parent", "/signup?role=parent"], ["Apply to teach", "/signup?role=teacher"], ["Log in", "/login"]] },
  { title: "Trust", links: [["Privacy", "/privacy"], ["Terms of use", "/terms"], ["Child safety", "/privacy#children"], ["Verify a certificate", "/verify"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-adire-900 text-adire-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-adire-200">{brand.tagline} Lessons, live classes and exam practice for every Nigerian learner.</p>
          <a href={`mailto:${brand.supportEmail}`} className="mt-4 inline-block text-sm font-semibold text-white underline-offset-4 hover:underline">{brand.supportEmail}</a>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="font-sans text-sm font-semibold tracking-normal text-white">{col.title}</h2>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {col.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="text-adire-200 hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-adire-300">© {new Date().getFullYear()} {brand.name}. Built in {brand.country} for African learners.</p>
      </div>
    </footer>
  );
}
