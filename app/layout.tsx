import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "onetime — encrypted secrets that vanish",
  description:
    "End-to-end encrypted one-time sharing. The server cannot read your data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-rule">
            <div className="mx-auto max-w-2xl px-6 sm:px-8 py-5 flex items-center justify-between">
              <a href="/" className="font-mono text-base tracking-tight">
                onetime<span className="text-muted">/</span>
              </a>
              <span className="font-mono text-[10px] sm:text-xs text-muted uppercase tracking-widest">
                AES-256-GCM &middot; E2EE
              </span>
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-rule">
            <div className="mx-auto max-w-2xl px-6 sm:px-8 py-4 font-mono text-[10px] sm:text-xs text-muted uppercase tracking-widest flex items-center justify-between">
              <span>// key never leaves your browser</span>
              <a
                href="/about"
                className="hover:text-ink transition-colors"
              >
                // how this works →
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
