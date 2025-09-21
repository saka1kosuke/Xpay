import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "xPay - 研究室の在庫管理",
  description: "研究室内の食べ物や飲み物の在庫を管理し、簡単に購入できるWebアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <CartProvider>
              <Header />
              <main>{children}</main>
            </CartProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
