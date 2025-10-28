import { notFound } from "next/navigation";
import CTAButtons from "@/components/CTAButtons";
import ResultCard from "@/components/ResultCard";
import {
  catalog,
  resolveAlternativeModels,
  resolvePrimaryModel,
  resolveResultTemplate
} from "@/lib/datasets";
import type { DroneTypeKey } from "@/lib/types";

type ResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isDroneTypeKey(candidate: string): candidate is DroneTypeKey {
  return candidate in catalog.types;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  const slug = id.toLowerCase();
  if (!isDroneTypeKey(slug)) {
    notFound();
  }

  const typeDetail = catalog.types[slug];
  const template = resolveResultTemplate(slug);
  const primaryModel = resolvePrimaryModel(slug);
  const alternativeModels = resolveAlternativeModels(slug);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <span className="badge badge-primary w-fit">RESULT</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          {template?.title ?? `${typeDetail.label}タイプ`}
        </h1>
        <p className="text-base text-muted">{typeDetail.summary}</p>
  </header>

  <ResultCard
        typeLabel={typeDetail.label}
        template={template}
        primaryModel={primaryModel}
        alternativeModels={alternativeModels}
      />

      {template ? (
        <CTAButtons primary={template.cta} secondary={template.secondaryCta} />
      ) : null}
    </main>
  );
}
