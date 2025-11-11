import Image from "next/image";
import Link from "next/link";

const flowSteps = [
  {
    title: "STEP1：用途を選択",
    desc: "9 種類の用途カードから気になるタイプをタップ。代表機体と代替候補がその場で把握できます。"
  },
  {
    title: "STEP2：タイプ別の質問",
    desc: "タイプに応じて質問内容が変化。不要な問いは出てこないのでテンポよく進められます。"
  },
  {
    title: "STEP3：1 機体まで確定",
    desc: "抽出された機体を上位／下位候補やペイロード情報と合わせて比較し、次のアクションへ繋げられます。"
  }
];

const typeHighlights = [
  {
    label: "趣味・旅撮タイプ",
    highlight: "Mini / Air シリーズで夜景も Vlog も幅広く対応",
    accent: "bg-sky-50 text-sky-700 border-sky-100"
  },
  {
    label: "点検・防災タイプ",
    highlight: "Matrice 350 / 400 と Zenmuse で赤外線・望遠・サーマルまで網羅",
    accent: "bg-amber-50 text-amber-700 border-amber-100"
  },
  {
    label: "測量・物流タイプ",
    highlight: "RTK 搭載機や FlyCart 30 など業務要件を満たす構成",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100"
  }
];

const marqueeImages = [
  "mini5pro.png",
  "mini4pro.png",
  "mini4k.png",
  "mini3.png",
  "air3s.png",
  "mavic4pro.png",
  "avata2.png",
  "m350rtk.png"
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
      <section className="w-full rounded-[32px] border border-slate-200 bg-white px-6 py-10 text-center shadow-xl shadow-slate-200/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">30秒診断</p>
        <div className="mt-6 space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            用途にぴったりな <span className="text-primary">DJI ドローン</span> を見つけましょう
          </h1>
          <p className="text-base text-muted sm:text-lg">
            STEP1 の用途カードでタイプを選ぶだけで、最新ラインナップから代表機体と候補をすぐ把握。
            さらに希望者は詳細診断（STEP2）で 1 機体まで絞り込めます。まずは気軽に診断を触ってみてください。
          </p>
        </div>
        <div className="mx-auto mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-sm">
          <Link
            href="/step1"
            className="flex items-center justify-center rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:bg-sky-500"
          >
            診断を始める
          </Link>
          <Link
            href="/lineup"
            className="rounded-full border border-slate-200 px-8 py-4 text-sm font-semibold text-slate-700 underline-offset-4 transition hover:border-primary hover:text-primary"
          >
            ラインナップを確認する
          </Link>
        </div>
        <div className="mt-8 space-y-3">
          <HeroMarquee direction="normal" />
          <HeroMarquee direction="reverse" />
        </div>
        <p className="mt-4 text-xs text-muted">
          流れ：用途を選ぶ → タイプ別の質問 → 推奨機体を 1 台まで確定
        </p>
      </section>

      <section className="grid w-full gap-6 rounded-3xl bg-white p-6 text-left shadow-lg sm:grid-cols-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">最新ラインナップを一望</h2>
          <p className="mt-2 text-sm text-muted">
            Mini 5 Pro から Dock 3 まで 2025 年時点の販売中モデルを反映。更新も JSON カタログを差し替えるだけです。
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">用途優先の診断で迷わない</h2>
          <p className="mt-2 text-sm text-muted">
            用途カードには要点・参考価格・別候補を集約。やりたいことから逆算できるので、最初の選択で迷いません。
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">ボタンは 2 つだけ</h2>
          <p className="mt-2 text-sm text-muted">
            「診断を始める」「ラインナップを確認する」のみを提示。シンプルな導線で GA4 などの計測設定も容易です。
          </p>
        </div>
      </section>

      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">診断の進み方</h2>
            <p className="text-sm text-muted">
              3 ステップだけで必要最低限の質問に絞り、回答の重複をなくしました。最後まで迷わず進めます。
            </p>
          </div>
          <Link href="/diagnose" className="text-sm font-semibold text-primary underline-offset-4 hover:text-sky-500">
            詳細診断のコンセプトを見る
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {flowSteps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-slate-800"
            >
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">用途タイプ別の例</h2>
            <p className="text-sm text-muted">
              趣味・防災・測量などの特徴をあらかじめ掴んでおくと、STEP1 の選択がよりスムーズになります。
            </p>
          </div>
          <Link
            href="/lineup/types"
            className="text-sm font-semibold text-primary underline-offset-4 transition hover:text-sky-500"
          >
            タイプ別ラインナップを見る
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {typeHighlights.map((card) => (
            <article
              key={card.label}
              className={`flex flex-col gap-3 rounded-2xl border px-4 py-5 ${card.accent}`}
            >
              <h3 className="text-lg font-semibold">{card.label}</h3>
              <p className="text-sm font-medium">{card.highlight}</p>
              <p className="text-xs text-slate-600">詳細は STEP1 の用途カードやタイプ別ラインナップで確認できます。</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

type HeroMarqueeProps = {
  direction: "normal" | "reverse";
};

function HeroMarquee({ direction }: HeroMarqueeProps) {
  return (
    <div className="hero-marquee-container overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
      <div
        className={`flex w-[200%] gap-6 py-4 ${
          direction === "reverse" ? "hero-marquee-track-reverse" : "hero-marquee-track"
        }`}
      >
        {[...marqueeImages, ...marqueeImages].map((src, index) => (
          <div key={`${src}-${index}`} className="relative h-24 w-40 flex-shrink-0">
            <Image
              src={`/images/${src}`}
              alt={src.replace(".png", "")}
              fill
              sizes="160px"
              className="object-contain opacity-80 transition hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
