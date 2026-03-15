import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlgoViz — Algorithm Visualizer",
  description:
    "Interactive algorithm visualization tool for sorting, pathfinding, and searching algorithms. Built with Next.js and Framer Motion.",
  keywords: ["algorithms", "visualizer", "sorting", "pathfinding", "searching", "computer science"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
