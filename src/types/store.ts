export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  costCents: number;
  priceCents: number;
  shortDescription: string;
  description: string;
  image: string;
  videoUrl?: string;
  hotmartUrl: string;
  rating: number;
  reviewsCount: number;
  isBestSeller?: boolean;
  isAnchor?: boolean;
  stockHint?: string;
  features: string[];
};

export type NewsletterLead = {
  email: string;
  createdAt: string;
};

export type SiteContent = {
  about: {
    title: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
  };
  contact: {
    title: string;
    subtitle: string;
    email: string;
    whatsapp: string;
    hours: string;
  };
};
