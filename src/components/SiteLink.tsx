import { SITE_URL } from "@/lib/site";

export const SiteLink = ({ children }: { children?: React.ReactNode }) => (
  <a href={SITE_URL} className="text-foreground underline" target="_blank" rel="noopener noreferrer">
    {children ?? SITE_URL}
  </a>
);
