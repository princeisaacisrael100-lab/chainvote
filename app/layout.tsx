import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChainVote — On-Chain Polling",
  description: "Create polls, cast votes, see live results on Ethereum.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
