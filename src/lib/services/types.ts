import { SITE_URL } from "@/lib/site";

export type ServiceSection = {
  h2: string;
  paragraphs?: string[];
  list?: string[];
  trailingParagraphs?: string[];
};

export type ServiceFaqItem = {
  question: string;
  answer: string;
};

export type ServicePageConfig = {
  slug: string;
  breadcrumb: string;
  title: string;
  description: string;
  h1: string;
  geoBlock: string;
  intro: string;
  sections: ServiceSection[];
  table: {
    headers: string[];
    rows: string[][];
  };
  faq: ServiceFaqItem[];
  conditionName: string;
  conditionDescription: string;
};

export function servicePageUrl(slug: string) {
  return `${SITE_URL}/${slug}`;
}
