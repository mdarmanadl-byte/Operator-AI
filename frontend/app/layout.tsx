import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operator AI | Autonomous Task Execution",
  description: "Create, execute, and inspect autonomous AI tasks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
