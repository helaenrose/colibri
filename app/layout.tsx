import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import TopNavbar from "@/components/ui/TopNavbar";
import { getBusinessProfile } from "@/src/lib/business-profile";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getBusinessProfile();
  return {
    title: {
      default: `${profile.name} | Tienda en linea`,
      template: `%s | ${profile.name}`,
    },
    description: `Compra en linea en ${profile.name}. Abarrotes, bebidas y productos de limpieza con pedido rapido.`,
    openGraph: {
      title: `${profile.name} | Tienda en linea`,
      description: `Catalogo en linea de ${profile.name} con pedido rapido y retiro en tienda.`,
      type: "website",
      locale: "es_MX",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${manrope.className} bg-gray-100`}>
        <TopNavbar />
        {children}
      </body>
    </html>
  );
}
