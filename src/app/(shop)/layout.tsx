import { AddedToBag } from "@/components/AddedToBag";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreProvider } from "@/components/StoreProvider";
import { UtilityBar } from "@/components/UtilityBar";
import { site } from "@/config/site";
import { buildCategoryTree, getCatalog, getSettings, headerCategories } from "@/lib/catalog";
import { buildNav } from "@/lib/nav";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [{ categories, brands }, { header }] = await Promise.all([getCatalog(), getSettings()]);
  const tree = buildCategoryTree(categories);
  const nav = buildNav(headerCategories(tree, header.categoryIds), tree, brands);
  return (
    <StoreProvider>
      <AnnouncementBar items={site.announcements} />
      <UtilityBar />
      <Header nav={nav} />
      <main className="flex-1">{children}</main>
      <Footer nav={nav} />
      <AddedToBag />
    </StoreProvider>
  );
}
