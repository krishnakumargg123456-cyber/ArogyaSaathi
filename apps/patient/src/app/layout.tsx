import React from "react";
import "./globals.css";

export const metadata = {
  title: "ArogyaSaathi Patient & Family Portal",
  description: "Secure Digital Health Records & Appointment Management for Rural Families"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-100 text-gray-800">{children}</body>
    </html>
  );
}

