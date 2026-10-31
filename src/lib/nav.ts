import { site } from "@/config/site";
import type { Brand, CategoryNode } from "./types";

export type NavLink = { label: string; href: string };
export type NavColumn = { title: string; href: string; links: NavLink[]; split?: boolean };
export type NavItem = {
  label: string;
  href: string;
  featured: NavLink[];
  columns: NavColumn[];
  promo: { image: string; title: string; text: string; cta: NavLink } | null;
  activities: NavLink[];
  shopAll: NavLink | null;
};

const PERSON_DEPARTMENTS: Record<string, string> = { women: "Women's", men: "Men's" };

const links = (node: CategoryNode | undefined): NavLink[] =>
  node?.children.map((c) => ({ label: c.name, href: `/c/${c.slug}` })) ?? [];

/** The header menu: one entry per top-level category, then Brands and What's New. */
export function buildNav(tree: CategoryNode[], brands: Brand[]): NavItem[] {
  const accessories = tree.find((c) => c.slug === "accessories");
  const bags = tree.find((c) => c.slug === "bags");

  const departments = tree.map((dept): NavItem => {
    const possessive = PERSON_DEPARTMENTS[dept.slug];
    // Three-level departments (Sports › Tennis › Overgrip) get one column per group.
    const columns: NavColumn[] = dept.children.some((c) => c.children.length > 0)
      ? dept.children.map((group) => ({ title: group.name, href: `/c/${group.slug}`, links: links(group) }))
      : [
          {
            title: possessive ? `${possessive} Clothes` : dept.name,
            href: `/c/${dept.slug}`,
            links: links(dept),
            split: dept.children.length > 5,
          },
        ];
    // Clothing departments also show accessories and bags, like lululemon.com.
    if (possessive && (accessories || bags)) {
      columns.push({
        title: "Accessories",
        href: `/c/${accessories?.slug ?? bags!.slug}`,
        links: [...links(bags), ...links(accessories)].slice(0, 10),
      });
    }
    const name = possessive ?? dept.name;
    return {
      label: dept.name,
      href: `/c/${dept.slug}`,
      featured: [
        { label: "What's New", href: `/whats-new?dept=${dept.slug}` },
        { label: "Bestsellers", href: `/bestsellers?dept=${dept.slug}` },
        ...dept.children.slice(0, 4).map((c) => ({ label: c.name, href: `/c/${c.slug}` })),
        { label: "Shop by Brand", href: "/brands" },
        { label: "We Made Too Much", href: `/sale?dept=${dept.slug}` },
      ],
      columns,
      promo: dept.image
        ? {
            image: dept.image,
            title: `${name} essentials.`,
            text: dept.description,
            cta: { label: `Shop All ${name}`, href: `/c/${dept.slug}` },
          }
        : null,
      activities: possessive
        ? site.activities.map((a) => ({ label: a, href: `/c/${dept.slug}?activity=${encodeURIComponent(a)}` }))
        : [],
      shopAll: { label: `Shop All ${dept.name}`, href: `/c/${dept.slug}` },
    };
  });

  const featuredBrand = brands.find((b) => b.image);
  return [
    ...departments,
    {
      label: "Brands",
      href: "/brands",
      featured: [
        { label: "All Brands", href: "/brands" },
        { label: "What's New", href: "/whats-new" },
        { label: "Bestsellers", href: "/bestsellers" },
      ],
      columns: [
        {
          title: "Shop by Brand",
          href: "/brands",
          links: brands.map((b) => ({ label: b.name, href: `/brands/${b.slug}` })),
          split: brands.length > 6,
        },
      ],
      promo: featuredBrand
        ? {
            image: featuredBrand.image!,
            title: featuredBrand.name,
            text: featuredBrand.description,
            cta: { label: `Shop ${featuredBrand.name}`, href: `/brands/${featuredBrand.slug}` },
          }
        : null,
      activities: [],
      shopAll: { label: "Shop All Brands", href: "/brands" },
    },
    {
      label: "What's New",
      href: "/whats-new",
      featured: [],
      columns: [],
      promo: null,
      activities: [],
      shopAll: null,
    },
  ];
}
