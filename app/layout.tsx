import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micro Defense: Wizard's Market",
  description: "A canvas tower-defense game for AP Microeconomics practice.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
