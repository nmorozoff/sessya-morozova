import type { PrerenderBlogState } from "./types";

let state: PrerenderBlogState = {};

export function setPrerenderBlogState(next: PrerenderBlogState): void {
  state = next;
}

export function getPrerenderBlogState(): PrerenderBlogState {
  return state;
}

export function clearPrerenderBlogState(): void {
  state = {};
}
