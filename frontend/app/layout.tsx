import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game on Paper",
  description: "College football and NFL game analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex gap-6 items-center">
            <span className="font-bold text-white text-lg">Game on Paper</span>
            <a href="/cfb" className="text-gray-300 hover:text-white text-sm">CFB</a>
            <a href="/nfl" className="text-gray-300 hover:text-white text-sm">NFL</a>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
