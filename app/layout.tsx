import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PickSix — Champions League with friends",
  description: "Create a private Champions League prediction league, invite friends, and own every matchday.",
};

import { Providers } from "@/components/providers";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
