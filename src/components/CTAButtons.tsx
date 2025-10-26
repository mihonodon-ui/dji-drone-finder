"use client";

import Link from "next/link";

interface CTA {
  label: string;
  href: string;
}

interface CTAButtonsProps {
  primary?: CTA;
  secondary?: CTA;
}

export function CTAButtons({ primary, secondary }: CTAButtonsProps) {
  if (!primary && !secondary) return null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {primary ? (
        <Link
          href={primary.href}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-sky-500"
        >
          {primary.label}
        </Link>
      ) : null}
      {secondary ? (
        <Link
          href={secondary.href}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
        >
          {secondary.label}
        </Link>
      ) : null}
    </div>
  );
}

export default CTAButtons;

