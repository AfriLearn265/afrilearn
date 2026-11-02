import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

const headings: Record<string, { title: string; sub: string }> = {
  student: { title: "Student login", sub: "Pick up your lessons, assignments and practice where you left off." },
  teacher: { title: "Teacher login", sub: "Open your classrooms, gradebook and question banks." },
  parent: { title: "Parent login", sub: "See your children's results, attendance and teacher feedback." },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const h = headings[sp.as ?? ""] ?? { title: "Welcome back", sub: "Log in to continue learning." };
  return (
    <div>
      <h1 className="text-4xl font-bold">{h.title}</h1>
      <p className="mt-2 text-muted">{h.sub}</p>
      <LoginForm next={sp.next} notice={sp.notice} />
      <p className="mt-8 text-sm text-muted">
        New here? <Link href={sp.as ? `/signup?role=${sp.as}` : "/signup"} className="font-semibold text-adire-700 hover:underline">Create an account</Link>
        {sp.as !== "teacher" && <> or <Link href="/signup?role=teacher" className="font-semibold text-adire-700 hover:underline">apply to teach</Link></>}.
      </p>
    </div>
  );
}
