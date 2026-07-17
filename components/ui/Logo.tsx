import Image from "next/image";
import Link from "next/link";
import { getBusinessProfile, getBusinessLogo } from "@/src/lib/business-profile";

const Logo = async () => {
    const profile = await getBusinessProfile();
    const logoSrc = getBusinessLogo(profile.image);
    const unoptimized = logoSrc.startsWith("http") && !logoSrc.includes("res.cloudinary.com");

    return (
        <Link
            href="/"
            aria-label="Ir al inicio"
            className="mx-auto mb-4 block w-fit rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
            <span className="relative mx-auto block h-20 w-20 rounded-full sm:h-24 sm:w-24">
                <Image
                    fill
                    priority
                    unoptimized={unoptimized}
                    alt={`Logotipo de ${profile.name}`}
                    src={logoSrc}
                    sizes="(max-width: 640px) 80px, 96px"
                    className="h-20 w-20 rounded-full bg-black object-contain p-2 sm:h-24 sm:w-24"
                />
            </span>
            <span className="mt-2 block text-center text-sm font-black uppercase tracking-[0.12em] text-slate-900">
                {profile.name}
            </span>
        </Link>
    );
};

export default Logo;
