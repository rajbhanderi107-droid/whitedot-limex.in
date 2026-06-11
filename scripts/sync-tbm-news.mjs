import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL = 'https://tb-m.com/eng/news/';
const OUTPUT_PATH = path.resolve('public/data/tbm-news.json');
const MAX_ITEMS = 12;
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36';
const CATEGORY_LABELS = new Map([
  ['お知らせ', 'Notice'],
  ['プレスリリース', 'Press release'],
  ['メディア掲載', 'Media coverage'],
]);

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function textFromHtml(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMatch(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].trim() : '';
}

function toEnglishUrl(url) {
  try {
    const parsed = new URL(url, SOURCE_URL);
    if (parsed.hostname === 'tb-m.com' && parsed.pathname.startsWith('/news/')) {
      parsed.pathname = `/eng${parsed.pathname}`;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function toAbsoluteAssetUrl(url) {
  if (!url) return '';
  try {
    return encodeURI(decodeURI(new URL(url, SOURCE_URL).toString()));
  } catch {
    return encodeURI(url);
  }
}

function containsJapanese(value) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEnglishTitle(href) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(href, {
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': BROWSER_UA,
      },
    });

    if (!response.ok) return '';

    const html = await response.text();
    const title = textFromHtml(firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/));
    if (title && !containsJapanese(title)) return title;
    if (attempt < 2) await sleep(350);
  }

  return '';
}

function parseNews(html) {
  const articles = [...html.matchAll(/<article\s+class="list-item">([\s\S]*?)<\/article>/g)];

  return articles.slice(0, MAX_ITEMS).map(([, article]) => {
    const href = toEnglishUrl(firstMatch(article, /<a\s+href="([^"]+)"/));
    const image = toAbsoluteAssetUrl(firstMatch(article, /<img\s+src="([^"]+)"/));
    const date = textFromHtml(firstMatch(article, /<time[^>]*>([\s\S]*?)<\/time>/));
    const isoDate = firstMatch(article, /<time\s+datetime="([^"]+)"/);
    const category = textFromHtml(firstMatch(article, /<p\s+class="category">([\s\S]*?)<\/p>/));
    const title = textFromHtml(firstMatch(article, /<h2>([\s\S]*?)<\/h2>/));
    const tags = [...article.matchAll(/<li>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/li>/g)]
      .map(([, tag]) => textFromHtml(tag))
      .filter(Boolean);

    return {
      title,
      date,
      isoDate,
      category: CATEGORY_LABELS.get(category) ?? category,
      tags,
      href,
      image,
    };
  }).filter((item) => item.title && item.href);
}

const response = await fetch(SOURCE_URL, {
  headers: {
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': BROWSER_UA,
  },
});

if (!response.ok) {
  throw new Error(`TBM news fetch failed: ${response.status} ${response.statusText}`);
}

const html = await response.text();
const listingItems = parseNews(html);
const previousItems = await readFile(OUTPUT_PATH, 'utf8')
  .then((raw) => JSON.parse(raw).items ?? [])
  .catch(() => []);
const previousByHref = new Map(previousItems.map((item) => [item.href, item]));
const items = await Promise.all(
  listingItems.map(async (item) => {
    const previous = previousByHref.get(item.href);
    const previousTitle = previous && !containsJapanese(previous.title) ? previous.title : '';

    return {
      ...item,
      title: await fetchEnglishTitle(item.href) || previousTitle || item.title,
    };
  }),
);

if (items.length === 0) {
  throw new Error('TBM news sync found no articles; page markup may have changed.');
}

const payload = {
  source: 'TBM Co., Ltd.',
  sourceUrl: SOURCE_URL,
  syncedAt: new Date().toISOString(),
  items,
};

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(`${OUTPUT_PATH}.tmp`, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
await rename(`${OUTPUT_PATH}.tmp`, OUTPUT_PATH);

console.log(`Synced ${items.length} TBM news items to ${OUTPUT_PATH}`);
