import type { Metadata } from "next";
import "../styles/globals.css";
import "../styles/tokens.css";

export const metadata: Metadata = {
  title: "DJI ドローン診断",
  description:
    "ライト診断とプロ診断で用途に合った DJI ドローンをおすすめします。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gradient-to-b from-slate-100 via-white to-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

