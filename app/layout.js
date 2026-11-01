import "./globals.css";
import Providers from "../components/Providers";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCategories } from "../lib/catalog";

export const revalidate = 60;

export const metadata = {
  title: { default: "Veda — Ayurvedic, Homeopathy & Healthcare", template: "%s | Veda" },
  description: "Ayurvedic, Homeopathy and healthcare essentials delivered across Delhi NCR.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0A6B66" };

export default async function RootLayout({ children }) {
  const categories = await getCategories();
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Figtree:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <Providers>
          <Header categories={categories} />
          <main>{children}</main>
          <Footer categories={categories} />
        </Providers>
      </body>
    </html>
  );
}
