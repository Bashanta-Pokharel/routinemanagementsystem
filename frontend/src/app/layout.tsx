import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniSchedule - Smart University & College Timetable System",
  description: "Dynamic university & college routine management and constraint optimization system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans dark:bg-slate-950 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
