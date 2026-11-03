import type { Metadata } from "next";
import { Download, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { PageHero, SectionHeading, Steps } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { getBrand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Get the Android app",
  description: "Install the AfriLearn app on your Android phone: lessons, CBT practice, live classes and results in one tap.",
};

const APK = "/downloads/afrilearn-prototype.apk";

export default async function AppPage() {
  const brand = await getBrand();
  return (
    <>
      <PageHero id="app" photo="heroLearner" title={`${brand.name} on your Android phone.`}
        intro="Lessons, CBT practice, live classes, assignments and results, one tap from your home screen. Your login and progress are the same as on the website.">
        <a href={APK} download className="inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-sun-400 px-7 font-semibold text-ink hover:bg-sun-300">
          <Download className="size-5" aria-hidden="true" />Download for Android
        </a>
        <ButtonLink href="#install" size="lg" variant="onDark">How to install</ButtonLink>
      </PageHero>

      <section className="container-page py-14 sm:py-20">
        <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionHeading title="What you get" />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                { icon: Smartphone, title: "Made for phones", text: "Opens straight to your dashboard, full screen, with no browser bars." },
                { icon: Wifi, title: "Light on data", text: "Pages load fast on mobile data, and test answers save as you go." },
                { icon: Download, title: "Downloads that stay", text: "Practice papers and notes save to your phone's Downloads folder." },
                { icon: ShieldCheck, title: "Same safe account", text: "Your login, results and parent links are exactly as on the website." },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-wash text-adire-700"><Icon className="size-5" aria-hidden="true" /></span>
                  <div>
                    <h3 className="font-sans text-lg font-semibold tracking-normal">{title}</h3>
                    <p className="mt-1 text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden rounded-[1.75rem] border border-line bg-white p-6 text-center lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element -- static QR code */}
            <img src="/icons/app-qr.svg" alt="QR code linking to this page" className="mx-auto size-48" />
            <p className="mt-4 font-semibold">Scan with your phone camera</p>
            <p className="mt-1 text-sm text-muted">It opens this page on your phone, where you can download the app.</p>
          </div>
        </div>
      </section>

      <section id="install" className="scroll-mt-24 border-y border-line bg-white py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading title="How to install" intro="This pilot version is shared directly from our website. It will be on Google Play after the pilot." />
          <Steps className="mt-12" steps={[
            ["Download the file", "Tap Download for Android on this page. Your phone saves a file called afrilearn-prototype.apk."],
            ["Allow the install", "Open the file. If Android asks, tap Settings and switch on Allow from this source for your browser, then go back."],
            ["Tap Install", "Android checks the app and installs it in a few seconds."],
            ["Open and log in", `Find the ${brand.name} icon on your home screen and log in with your usual account.`],
          ]} />
          <p className="mt-10 max-w-2xl text-sm text-muted">
            Needs Android 8 or newer. When a new version comes out, download it again and install it over the old one. On iPhone, open this website in Safari,
            tap Share, then Add to Home Screen.
          </p>
        </div>
      </section>
    </>
  );
}
