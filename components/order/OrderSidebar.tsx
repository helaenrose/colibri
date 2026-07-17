import { prisma } from "@/src/lib/prisma";
import Logo from "../ui/Logo";
import CategoryTreeNav from "./CategoryTreeNav";
import { buildCategoryTree, type CategoryNode } from "@/src/lib/category-utils";
import { categories as seedCategories } from "@/prisma/data/categories";
import type { Category } from "@prisma/client";

const getTree = async (): Promise<CategoryNode[]> => {
    try {
        const categories = await prisma.category.findMany();
        if (categories.length === 0) throw new Error("empty");
        return buildCategoryTree(categories);
    } catch {
        return buildCategoryTree(seedCategories as unknown as Category[]);
    }
};

const OrderSidebar = async () => {
    const tree = await getTree();

    return (
        <aside className="w-full max-w-full min-w-0 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur md:h-screen md:w-80 md:border-b-0 md:border-r md:overflow-y-auto">
            <div className="sticky top-0 z-20 border-b border-gray-100 bg-[linear-gradient(145deg,_#ffffff,_#f8fafc)] px-4 py-3 sm:px-5 md:static md:py-4">
                <Logo />
                <div className="mt-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-sm">Selecciona tu categoria</p>
                </div>
            </div>

            <nav className="pb-2" aria-label="Menu principal de categorias">
                <h3 className="w-full bg-slate-900 py-2.5 text-center text-sm font-bold uppercase tracking-[0.2em] text-white sm:text-base md:py-3 md:text-lg md:tracking-wide">
                    Menu
                </h3>
                <CategoryTreeNav tree={tree} />
            </nav>
        </aside>
    );
};

export default OrderSidebar;
