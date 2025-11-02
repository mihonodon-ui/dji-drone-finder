import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { catalog } from "@/lib/datasets";
import type { CatalogModel } from "@/lib/types";

function getKindLabel(model: CatalogModel) {
  return model.kind === "payload" ? "ペイロード" : "機体";
}

export default async function ModelDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  const model = catalog.models.find((item) => item.id === resolved.id);
  if (!model) {
    notFound();
  }

  const typeLabels = model.typeTags
    ?.map((tag) => catalog.types[tag]?.label)
    .filter(Boolean)
    .join("／");

  const specsEntries = model.specs ? Object.entries(model.specs) : [];
  const priceRange = `${model.priceJPY.min.toLocaleString("ja-JP")}〜${model.priceJPY.max.toLocaleString("ja-JP")}円`;
  const kindLabel = getKindLabel(model);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="badge badge-primary bg-sky-100 text-xs font-semibold text-primary">
            {kindLabel}
          </span>
          {typeLabels ? (
            <span className="badge badge-primary bg-slate-100 text-xs font-semibold text-slate-600">
              {typeLabels}
            </span>
          ) : null}
          <span className="badge badge-primary bg-slate-100 text-xs font-semibold text-slate-600">
            {priceRange}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{model.name}</h1>
        {model.notes ? (
          <p className="mx-auto max-w-3xl rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-600 sm:mx-0">
            {model.notes}
          </p>
        ) : null}
        {model.bullets?.length ? (
          <ul className="mx-auto max-w-3xl list-disc space-y-2 text-sm text-slate-700 sm:mx-0 sm:pl-5">
            {model.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
      </header>

      <section className="grid gap-6 rounded-3xl bg-white p-6 shadow-xl shadow-sky-100 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center gap-4">
          {model.images?.[0] ? (
            <Image
              src={`/images/${model.images[0]}`}
              alt={model.name}
              width={420}
              height={280}
              className="rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
              画像準備中
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/diagnose"
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              診断に戻る
            </Link>
            <Link
              href="/lineup"
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              ラインナップ一覧
            </Link>
            {model.links?.consult ? (
              <Link
                href={model.links.consult}
                className="rounded-full border border-primary px-5 py-2 font-semibold text-primary transition hover:bg-primary hover:text-white"
              >
                相談する
              </Link>
            ) : null}
            {model.links?.demo ? (
              <Link
                href={model.links.demo}
                className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
              >
                体験会を予約
              </Link>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">主なスペック</h2>
          {specsEntries.length ? (
            <table className="mt-4 w-full table-auto border-separate border-spacing-y-2 text-sm">
              <tbody>
                {specsEntries.map(([key, value]) => (
                  <tr key={key} className="rounded-2xl bg-slate-50">
                    <th className="w-40 px-4 py-2 text-left text-xs font-semibold text-slate-500">
                      {key}
                    </th>
                    <td className="px-4 py-2 text-slate-700">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-4 text-sm text-slate-600">スペック情報は準備中です。</p>
          )}

          <div className="mt-6 text-sm text-muted">
            <p>
              価格目安：<span className="font-semibold text-slate-900">{priceRange}</span>
            </p>
          </div>

          {model.links?.learn ? (
            <div className="mt-6 text-sm">
              <Link
                href={model.links.learn}
                className="text-primary underline-offset-4 transition hover:underline"
              >
                メーカー公式ページを見る
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
