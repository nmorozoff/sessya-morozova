/**
 * Extract FAQ Q/A from article HTML and merge FAQPage into schema.org JSON-LD.
 */

const FAQ_HEADER = /частые вопросы/i;

export function stripInlineHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseHtmlBlocks(html) {
  const blocks = [];
  const re = /<(h2|h3|p)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const tag = match[0].match(/^<(h2|h3|p)/i)?.[1]?.toLowerCase();
    if (!tag) continue;
    const inner = match[0].replace(/^<[^>]+>/, "").replace(/<\/[^>]+>$/, "");
    blocks.push({ tag, text: stripInlineHtml(inner) });
  }
  return blocks;
}

function isQuestionHeading(text) {
  const t = text.trim();
  if (!t) return false;
  if (t.match(FAQ_HEADER)) return false;
  if (t.endsWith("?")) return true;
  return /^(можно|нужно|что|как|почему|когда|где|сколько|чем|стоит|нормально|отличается)/i.test(t);
}

function collectFaqPairs(blocks, startIndex) {
  const pairs = [];
  let i = startIndex;

  while (i < blocks.length) {
    const block = blocks[i];
    if (block.tag === "h2" && FAQ_HEADER.test(block.text)) {
      i += 1;
      continue;
    }
    if (block.tag === "h2" && !isQuestionHeading(block.text)) {
      if (pairs.length > 0) break;
    }
    if (block.tag === "h3" || (block.tag === "h2" && isQuestionHeading(block.text))) {
      const question = block.text;
      const answers = [];
      i += 1;
      while (i < blocks.length && blocks[i].tag === "p") {
        const answer = blocks[i].text;
        if (answer && !/^запись на бесплатную/i.test(answer) && !/^ещё больше полезного/i.test(answer)) {
          answers.push(answer);
        }
        i += 1;
      }
      const text = answers.join(" ").trim();
      if (question && text) {
        pairs.push({ question, answer: text });
      }
      continue;
    }
    i += 1;
  }

  return pairs;
}

export function extractFaqPairs(html, { griefFallback = false } = {}) {
  const blocks = parseHtmlBlocks(html);
  let start = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i].tag === "h2" && FAQ_HEADER.test(blocks[i].text)) {
      start = i + 1;
      break;
    }
  }

  let pairs = start > 0 ? collectFaqPairs(blocks, start) : [];

  if (pairs.length === 0 && griefFallback) {
    pairs = [];
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (block.tag !== "h2" || !isQuestionHeading(block.text)) continue;
      const answers = [];
      let j = i + 1;
      while (j < blocks.length && blocks[j].tag === "p") {
        answers.push(blocks[j].text);
        j += 1;
      }
      const text = answers.join(" ").trim();
      if (text) pairs.push({ question: block.text, answer: text });
      i = j - 1;
    }
    pairs = pairs.slice(-7);
  }

  return pairs;
}

export function buildFaqPageNode(pairs, pageUrl) {
  if (!pairs.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: pairs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export function mergeSchemaWithFaq(schemaContent, bodyHtml, { slug, siteUrl, description }) {
  let parsed;
  try {
    parsed = JSON.parse(schemaContent);
  } catch {
    return schemaContent;
  }

  const pageUrl = `${siteUrl}/blog/${slug}/`;
  const griefFallback = slug.startsWith("gore-");
  const pairs = extractFaqPairs(bodyHtml, { griefFallback });
  const faqNode = buildFaqPageNode(pairs, pageUrl);

  const graph = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
  const withoutFaq = graph.filter((n) => n && n["@type"] !== "FAQPage");

  for (const node of withoutFaq) {
    if (node["@type"] !== "BlogPosting") continue;
    if (description) node.description = description;
    if (siteUrl) {
      node.url = pageUrl;
      node.mainEntityOfPage = { "@type": "WebPage", "@id": pageUrl };
      if (typeof node["@id"] === "string") {
        node["@id"] = `${pageUrl}#article`;
      }
    }
  }

  const nextGraph = faqNode ? [...withoutFaq, faqNode] : withoutFaq;
  return `${JSON.stringify({ "@context": "https://schema.org", "@graph": nextGraph }, null, 2)}\n`;
}
