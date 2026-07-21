import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import TopNavbar from "@/components/ui/TopNavbar";
import { getBusinessProfile, getBusinessLogo } from "@/src/lib/business-profile";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

// URL absoluta del sitio, necesaria para que las miniaturas de OG (WhatsApp, etc.) carguen bien.
function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getBusinessProfile();
  const siteUrl = getSiteUrl();
  // Logo cargado en el administrador (o el de respaldo). getBusinessLogo puede
  // devolver una ruta relativa; metadataBase la convierte en absoluta para OG.
  const logo = getBusinessLogo(profile.image);
  const title = `${profile.name} | Tienda en linea`;
  const description = `Catalogo en linea de ${profile.name} con pedido rapido y retiro en tienda.`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${profile.name}`,
    },
    description: `Compra en linea en ${profile.name}. Abarrotes, bebidas y productos de limpieza con pedido rapido.`,
    icons: {
      icon: logo,
      apple: logo,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_MX",
      siteName: profile.name,
      images: [
        {
          url: logo,
          width: 512,
          height: 512,
          alt: profile.name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [logo],
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
