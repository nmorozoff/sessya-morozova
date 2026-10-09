import { describe, expect, it } from "vitest";
import { inferSourceFromReferrer, isSameSiteReferrer } from "./utm";

describe("inferSourceFromReferrer", () => {
  it("maps ChatGPT", () => {
    expect(inferSourceFromReferrer("https://chatgpt.com/c/abc")).toEqual({
      utm_source: "chatgpt.com",
      utm_medium: "referral",
      source_inferred: true,
    });
  });

  it("maps Yandex", () => {
    expect(inferSourceFromReferrer("https://yandex.ru/search/?text=психолог")).toEqual({
      utm_source: "yandex",
      utm_medium: "organic",
      source_inferred: true,
    });
  });

  it("maps generic host", () => {
    expect(inferSourceFromReferrer("https://example.org/page")).toEqual({
      utm_source: "example.org",
      utm_medium: "referral",
      source_inferred: true,
    });
  });
});

describe("isSameSiteReferrer", () => {
  it("treats own domains as internal", () => {
    expect(isSameSiteReferrer("https://www.morozovanatalia.ru/blog", "www.morozovanatalia.ru")).toBe(
      true,
    );
    expect(isSameSiteReferrer("https://morozova-natalya.ru/", "morozova-natalya.ru")).toBe(true);
  });

  it("keeps external referrers", () => {
    expect(isSameSiteReferrer("https://chatgpt.com/", "www.morozovanatalia.ru")).toBe(false);
  });
});
