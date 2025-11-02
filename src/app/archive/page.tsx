"use client";

import Link from "next/link";
import archiveData from "@/data/catalog.archive.json";

interface ArchiveItem {
  id: string;
  name: string;
  status: string;
  category: string;
  notes?: string;
}

const statusLabel: Record<string, string> = {
  discontinued: "販売終了",
  archive: "アーカイブ",
  legacy: "旧モデル"
};

const categoryLabel: Record<string, string> = {
  consumer: "コンシューマ",
  cinema: "映像制作",
  fpv: "FPV",
  legacy: "レガシー",
  accessories: "アクセサリ"
};

export default function ArchivePage() {
  const items = (archiveData.items ?? []) as ArchiveItem[];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <span className="badge badge-primary self-center sm:self-start">Archive</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">販売終了機種・アクセサリ一覧</h1>
        <p className="text-base text-muted">
          診断結果からは除外した DJI ドローン／アクセサリの履歴リストです。サポートや保守で参照が必要な際にご確認ください。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/diagnose"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            診断ページへ戻る
          </Link>
          <Link
            href="/lineup"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            現行ラインナップを見る
          </Link>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow">
        <table className="w-full table-auto border-separate border-spacing-y-3 text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3">カテゴリ</th>
              <th className="px-3">製品名</th>
              <th className="px-3">ステータス</th>
              <th className="px-3">メモ</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {items.map((item) => (
              <tr key={item.id} className="rounded-2xl bg-slate-50">
                <td className="px-3 py-3 text-xs font-semibold text-slate-500">
                  {categoryLabel[item.category] ?? item.category}
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-slate-900">{item.name}</td>
                <td className="px-3 py-3 text-xs font-semibold text-danger">
                  {statusLabel[item.status] ?? item.status}
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">{item.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-700">
        <h2 className="text-base font-semibold text-slate-900">サポート窓口</h2>
        <p className="mt-2">
          販売終了モデルの修理・点検・パーツ供給については、正規代理店や DJI JAPAN サポートへお問い合わせください。
          オンラインストアに在庫がない場合でも、法人保守サービスで対応できるケースがあります。
        </p>
      </section>
    </main>
  );
}

