import "./globals.css";
import "@xyflow/react/dist/style.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Associated Accounts Admin",
  description: "Manage ERC-8092 associations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
      </body>
    </html>
  );
}


