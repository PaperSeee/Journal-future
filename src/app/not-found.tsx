import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo className="h-14 w-14 opacity-80" />
      <div>
        <h1 className="font-display text-3xl font-semibold">404</h1>
        <p className="mt-1 text-ink-soft">Cette page n&apos;existe pas.</p>
      </div>
      <Link href="/" className="btn-primary">
        Retour au dashboard
      </Link>
    </div>
  );
}
