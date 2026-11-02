import React from "react";
import "./globals.css";

export const metadata = {
  title: "ArogyaSaathi Web Admin Console",
  description: "Enterprise Health Management, Program Coordination & Surveillance"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}
