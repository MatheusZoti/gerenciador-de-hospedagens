import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "Hospedagens CRM",
    template: "%s · Hospedagens CRM",
  },
  description: "CRM de gerenciamento de hospedagens: funil de vendas, reservas e financeiro.",
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geistSans.variable}>
      <body className="min-h-svh font-sans">{children}</body>
    </html>
  );
}
