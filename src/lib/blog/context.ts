import { createContext, useContext } from "react";
import { getPrerenderBlogState } from "./prerender-state";
import type { PrerenderBlogState } from "./types";

export const PrerenderBlogContext = createContext<PrerenderBlogState>({});

export function usePrerenderBlog(): PrerenderBlogState {
  return useContext(PrerenderBlogContext);
}

export function getPrerenderBlogContextValue(): PrerenderBlogState {
  return getPrerenderBlogState();
}
