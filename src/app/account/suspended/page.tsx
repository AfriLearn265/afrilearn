import { Logo } from "@/components/brand/Logo";
import { brand } from "@/config/brand";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Account suspended" };

export default function Suspended() {
  return (
    <main id="main" className="container-page grid min-h-dvh max-w-xl content-center gap-6 py-16">
      <Logo />
      <h1 className="text-4xl font-bold">This account is suspended</h1>
      <p className="text-lg text-muted">An administrator has paused access to this account. Email <a className="font-semibold text-adire-700" href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> and we will explain what happened and what you can do next.</p>
      <form action={signOut}><Button type="submit" variant="outline">Log out</Button></form>
    </main>
  );
}
