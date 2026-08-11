import { prisma } from "@/src/lib/prisma";
import Logo from "../ui/Logo";
import CatalogSidebarDrawer from "./CatalogSidebarDrawer";
import { type SearchScope } from "./CatalogSearch";
import { buildCategoryTree, pruneEmptyCategories, type CategoryNode } from "@/src/lib/category-utils";
import { categories as seedCategories } from "@/prisma/data/categories";
import type { Category } from "@prisma/client";

const getTree = async (): Promise<CategoryNode[]> => {
    try {
        const categories = await prisma.category.findMany();
        if (categories.length === 0) throw new Error("empty");

        // Ids de categorias que tienen al menos un producto asociado directamente
        const grouped = await prisma.product.groupBy({
            by: ["categoryId"],
            where: { active: true, stock: { gt: 0 } },
            _count: { _all: true },
        });
        const withProducts = new Set(grouped.map((g) => g.categoryId));

        const tree = buildCategoryTree(categories);
        // Oculta categorias (y departamentos) sin productos en su subarbol
        return pruneEmptyCategories(tree, withProducts);
    } catch {
        return buildCategoryTree(seedCategories as unknown as Category[]);
    }
};

// Aplana el arbol en orden jerarquico para el selector de ambito de busqueda
const flattenScopes = (nodes: CategoryNode[], acc: SearchScope[] = []): SearchScope[] => {
    for (const node of nodes) {
        acc.push({ slug: node.slug, name: node.name, level: node.level });
        if (node.children.length > 0) flattenScopes(node.children, acc);
    }
    return acc;
};

const OrderSidebar = async () => {
    const tree = await getTree();
    const scopes = flattenScopes(tree);

    return <CatalogSidebarDrawer logo={<Logo />} tree={tree} scopes={scopes} />;
};

export default OrderSidebar;
