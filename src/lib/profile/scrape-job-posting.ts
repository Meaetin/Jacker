import { load } from "cheerio";

interface ScrapedJobPosting {
  jobDescription: string;
  jobTitle: string | null;
  companyName: string | null;
  sourceUrl: string;
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string }> {
  const directResponse = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.google.com/",
    },
    redirect: "follow",
  });

  if (directResponse.ok) {
    return {
      html: await directResponse.text(),
      finalUrl: directResponse.url ?? url,
    };
  }

  if (![401, 403, 429].includes(directResponse.status)) {
    throw new Error(`Failed to load URL (${directResponse.status})`);
  }

  // Fallback for pages that block direct bot-like requests.
  const noProtocolUrl = url.replace(/^https?:\/\//i, "");
  const mirrorUrl = `https://r.jina.ai/http://${noProtocolUrl}`;
  const mirrorResponse = await fetch(mirrorUrl, { redirect: "follow" });

  if (!mirrorResponse.ok) {
    throw new Error(`Failed to load URL (${directResponse.status})`);
  }

  return {
    html: await mirrorResponse.text(),
    finalUrl: url,
  };
}

function cleanText(value: string | undefined | null): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function parseTitleAndCompany(value: string | null): { title: string | null; company: string | null } {
  if (!value) {
    return { title: null, company: null };
  }

  const atMatch = value.match(/^(.*?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return {
      title: cleanText(atMatch[1]),
      company: cleanText(atMatch[2]),
    };
  }

  const splitMatch = value.split(/\s[\-|:|]\s/).map((chunk) => cleanText(chunk)).filter(Boolean) as string[];
  if (splitMatch.length >= 2) {
    return {
      title: splitMatch[0] ?? null,
      company: splitMatch[1] ?? null,
    };
  }

  return { title: cleanText(value), company: null };
}

function extractJobDescription($: ReturnType<typeof load>): string | null {
  const candidates = [
    "[data-testid='job-description']",
    ".job-description",
    ".description",
    "#job-description",
    "#jobDescriptionText",
    "[itemprop='description']",
    "main article",
    "article",
    "main",
  ];

  let bestText = "";

  for (const selector of candidates) {
    $(selector).each((_, el) => {
      const text = cleanText($(el).text()) ?? "";
      if (text.length > bestText.length) {
        bestText = text;
      }
    });
  }

  if (bestText.length >= 120) {
    return bestText;
  }

  return cleanText($("body").text());
}

export async function scrapeJobPosting(url: string): Promise<ScrapedJobPosting> {
  const { html, finalUrl } = await fetchHtml(url);
  const $ = load(html);

  $("script, style, noscript, svg, iframe").remove();

  const ogTitle = cleanText($("meta[property='og:title']").attr("content"));
  const pageTitle = cleanText($("title").text());
  const h1Title = cleanText($("h1").first().text());
  const titleCandidate = h1Title ?? ogTitle ?? pageTitle;

  const inferredFromTitle = parseTitleAndCompany(titleCandidate);
  const jobTitle = h1Title ?? inferredFromTitle.title;

  const ogSiteName = cleanText($("meta[property='og:site_name']").attr("content"));
  const authorName = cleanText($("meta[name='author']").attr("content"));
  const companyName = ogSiteName ?? authorName ?? inferredFromTitle.company;

  const jobDescription = extractJobDescription($);
  if (!jobDescription || jobDescription.length < 50) {
    throw new Error("Could not extract enough job description content from URL");
  }

  return {
    jobDescription: jobDescription.slice(0, 60000),
    jobTitle,
    companyName,
    sourceUrl: finalUrl,
  };
}
