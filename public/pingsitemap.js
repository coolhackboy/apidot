const fs = require('fs');
const path = require('path');
const https = require('https');
const { parseString } = require('xml2js');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Worker thread code
if (!isMainThread) {
  const { url } = workerData;
  
  https.get(url, { timeout: 10000 }, (res) => {
    parentPort.postMessage({
      url,
      status: res.statusCode,
      isError: res.statusCode >= 400
    });
  }).on('error', (err) => {
    parentPort.postMessage({
      url,
      status: 'ERROR',
      error: err.message,
      isError: true
    });
  });
  
  return;
}

// Main thread code
async function checkSitemap() {
  console.log('Starting sitemap URL check with 2 worker threads...\n');
  
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  parseString(sitemapContent, async (err, result) => {
    if (err) {
      console.error('Error parsing sitemap:', err);
      return;
    }

    const urls = result.urlset.url.map(url => url.loc[0]);
    const results = [];
    let completedCount = 0;
    let errorCount = 0;

    // Function to create a worker for URL checking
    function createWorker(url) {
      return new Promise((resolve) => {
        const worker = new Worker(__filename, {
          workerData: { url }
        });

        worker.on('message', (result) => {
          results.push(result);
          completedCount++;
          
          process.stdout.write(`\rProgress: ${completedCount}/${urls.length} URLs checked`);
          
          if (result.isError) {
            errorCount++;
            console.log(`\n❌ ${result.url} - ${result.status} (${result.error || 'Error'})`);
          } else {
            console.log(`\n✅ ${result.url} - ${result.status}`);
          }
          
          resolve();
        });

        worker.on('error', (err) => {
          console.error(`Worker error for ${url}:`, err);
          resolve();
        });
      });
    }

    // Process URLs in batches of 2 (number of worker threads)
    for (let i = 0; i < urls.length; i += 2) {
      const batch = urls.slice(i, i + 2);
      await Promise.all(batch.map(url => createWorker(url)));
    }

    // Print summary
    console.log('\n\n=== Summary ===');
    console.log(`Total URLs checked: ${urls.length}`);
    console.log(`Successful URLs: ${urls.length - errorCount}`);
    console.log(`Failed URLs: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\nFailed URLs:');
      results
        .filter(r => r.isError)
        .forEach(r => {
          console.log(`- ${r.url}`);
          console.log(`  Status: ${r.status}`);
          if (r.error) console.log(`  Error: ${r.error}`);
        });
    }
  });
}

// Run the checker
checkSitemap();
