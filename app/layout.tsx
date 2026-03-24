/**
 * Root Layout
 * -----------
 * Standard Next.js layout structure with added support for theme-aware hydration.
 * Includes a blocking script to prevent FOUC (Flash of Unstyled Content).
 */

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "ChainVote — Decentralized Governance",
  description: "Securely create polls, cast votes, and see live results on the Ethereum blockchain.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to set the theme before initial paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('chainvote-theme');
                  var initialTheme = savedTheme;
                  if (!initialTheme) {
                    initialTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.setAttribute('data-theme', initialTheme);
                } catch(err) {
                  // Fallback to dark theme if storage fails
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
