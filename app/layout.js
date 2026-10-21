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

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#1f7a45" };

export default async function RootLayout({ children }) {
  const categories = await getCategories();
  return (
    <html lang="en">
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
