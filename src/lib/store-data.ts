import { promises as fs } from "fs";
import path from "path";
import type { NewsletterLead, Product, SiteContent } from "@/types/store";

const productsPath = path.join(process.cwd(), "src/data/products.json");
const newsletterPath = path.join(process.cwd(), "src/data/newsletter-leads.json");
const siteContentPath = path.join(process.cwd(), "src/data/site-content.json");

export async function getProducts(): Promise<Product[]> {
  // Leitura local em JSON para simular um banco simples da loja.
  const data = await fs.readFile(productsPath, "utf8");
  return JSON.parse(data) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.slug === slug);
}

export async function updateProduct(slug: string, payload: Product): Promise<Product | null> {
  const products = await getProducts();
  const index = products.findIndex((product) => product.slug === slug);

  if (index === -1) {
    return null;
  }

  products[index] = payload;
  // Persistencia local: o painel admin salva no arquivo products.json.
  await fs.writeFile(productsPath, JSON.stringify(products, null, 2), "utf8");
  return products[index];
}

function nextProductId(products: Product[]) {
  const maxId = products.reduce((max, product) => {
    const current = Number.parseInt(product.id.replace(/^p/, ""), 10);
    if (Number.isNaN(current)) return max;
    return Math.max(max, current);
  }, 0);
  return `p${maxId + 1}`;
}

export async function createProduct(payload: Product): Promise<Product> {
  const products = await getProducts();
  const withId = { ...payload, id: payload.id || nextProductId(products) };
  products.push(withId);
  await fs.writeFile(productsPath, JSON.stringify(products, null, 2), "utf8");
  return withId;
}

export async function deleteProduct(slug: string): Promise<boolean> {
  const products = await getProducts();
  const filtered = products.filter((product) => product.slug !== slug);

  if (filtered.length === products.length) {
    return false;
  }

  await fs.writeFile(productsPath, JSON.stringify(filtered, null, 2), "utf8");
  return true;
}

export async function saveNewsletterLead(email: string): Promise<NewsletterLead> {
  const lead: NewsletterLead = {
    email,
    createdAt: new Date().toISOString()
  };

  const data = await fs.readFile(newsletterPath, "utf8");
  const list = JSON.parse(data) as NewsletterLead[];

  if (!list.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
    // Evita e-mails duplicados na lista de newsletter.
    list.push(lead);
    await fs.writeFile(newsletterPath, JSON.stringify(list, null, 2), "utf8");
  }

  return lead;
}

export async function getSiteContent(): Promise<SiteContent> {
  const data = await fs.readFile(siteContentPath, "utf8");
  return JSON.parse(data) as SiteContent;
}

export async function updateSiteContent(payload: SiteContent): Promise<SiteContent> {
  await fs.writeFile(siteContentPath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(priceCents / 100);
}
