import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Naath — Learn & Translate Nuer",
  description:
    "Translate between English and Nuer (nus_Latn), browse the dictionary, and learn with spaced-repetition flashcards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
