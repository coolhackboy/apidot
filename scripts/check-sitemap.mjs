import https from "node:https";
import http from "node:http";

const DEFAULT_BASE_URL = (process.env.NEXT_PUBLIC_WEB_URL || "https://apidot.ai").replace(/\/+$/, "");
const sitemapUrl = process.argv[2] || `${DEFAULT_BASE_URL}/sitemap.xml`;
const CONCURRENCY = 8;
const TIMEOUT_MS = 15000;

const requestText = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const request = client.get(url, { timeout: TIMEOUT_MS }, (response) => {
      const chunks = [];

      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        const redirectedUrl = new URL(response.headers.location, url).toString();
        requestText(redirectedUrl).then(resolve, reject);
        return;
      }

      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve({
          statusCode: response.statusCode || 0,
          body,
        });
      });
    });

    request.on("timeout", () => {
      request.destroy(new Error(`Timed out after ${TIMEOUT_MS}ms`));
    });
    request.on("error", reject);
  });

const checkUrl = async (url) => {
  try {
    const { statusCode } = await requestText(url);

    return {
      url,
      statusCode,
      ok: statusCode >= 200 && statusCode < 400,
    };
  } catch (error) {
    return {
      url,
      statusCode: "ERROR",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const extractLocs = (xml) =>
  Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim()).filter(Boolean);

const runPool = async (items, worker) => {
  const results = [];
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
      process.stdout.write(`\rChecked ${results.filter(Boolean).length}/${items.length} URLs`);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, runWorker));
  process.stdout.write("\n");

  return results;
};

const main = async () => {
  console.log(`Fetching sitemap: ${sitemapUrl}`);
  const { statusCode, body } = await requestText(sitemapUrl);

  if (statusCode < 200 || statusCode >= 400) {
    throw new Error(`Failed to fetch sitemap. Status: ${statusCode}`);
  }

  const urls = [...new Set(extractLocs(body))];
  if (urls.length === 0) {
    throw new Error("No <loc> URLs found in sitemap.");
  }

  console.log(`Found ${urls.length} URLs. Checking with concurrency ${CONCURRENCY}...`);
  const results = await runPool(urls, checkUrl);
  const failed = results.filter((result) => !result.ok);

  console.log("\n=== Sitemap Check Summary ===");
  console.log(`Sitemap: ${sitemapUrl}`);
  console.log(`Total URLs: ${results.length}`);
  console.log(`Successful URLs: ${results.length - failed.length}`);
  console.log(`Failed URLs: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed URLs:");
    failed.forEach((result) => {
      console.log(`- ${result.url}`);
      console.log(`  Status: ${result.statusCode}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
