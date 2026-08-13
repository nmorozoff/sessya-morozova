import type { ReactNode } from "react";
import { PrerenderBlogContext, getPrerenderBlogContextValue } from "./context";

export function PrerenderBlogProvider({ children }: { children: ReactNode }) {
  return (
    <PrerenderBlogContext.Provider value={getPrerenderBlogContextValue()}>
      {children}
    </PrerenderBlogContext.Provider>
  );
}
