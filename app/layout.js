import "./globals.css";
import Providers from "../components/Providers";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: { default: "Veda — Ayurvedic, Homeopathy & Healthcare", template: "%s | Veda" },
  description: "Ayurvedic, Homeopathy and healthcare essentials delivered across Delhi NCR.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#2f5d46" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
