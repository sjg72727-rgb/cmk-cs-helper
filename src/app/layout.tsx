import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "현대차 정몽구 스칼러십 CS 도우미",
  description: "장학생 가이드라인 기반 고객 문의 자동 답변 및 매뉴얼 제시 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased selection:bg-blue-100 selection:text-blue-900 font-sans">
        {children}
      </body>
    </html>
  );
}
