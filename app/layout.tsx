import type { Metadata } from "next";
import { Bree_Serif, Rubik } from "next/font/google";
import "./globals.css";

const breeSerif = Bree_Serif({
  weight: "400",
  variable: "--font-bree",
  subsets: ["latin"],
});

const rubik = Rubik({
  weight: ["300", "400", "500", "700"],
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sukha Yoga Trivia",
  description: "Ponete a prueba con trivia de yoga. Jugá, aprendé y desafiá a tus amigos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${breeSerif.variable} ${rubik.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
