import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Fitbharat: fitness app",
  description: "Fitness app for every individual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
