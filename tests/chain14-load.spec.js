import { test, expect } from '@playwright/test';

test.setTimeout(5 * 60 * 1000); // 5 minutes for 20 serial launches

const TEST_URL = 'https://icy-forest-0b5fd4e03.1.azurestaticapps.net/chain-14/';
const INSTANCE_COUNT = 20;

test('open app 20 times in parallel, wait for Oslo button and measure load/network + crashes', async ({ browser }) => {
  const results = [];

  const runInstance = async (i) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    let crashed = false;
    const requestEvents = [];
    const failedRequests = [];
    const responseEvents = [];

    page.on('crash', () => {
      crashed = true;
    });

    page.on('request', (request) => {
      const ts = Date.now();
      requestEvents.push({ url: request.url(), method: request.method(), resourceType: request.resourceType(), timestamp: ts });
    });

    page.on('response', (response) => {
      const ts = Date.now();
      responseEvents.push({ url: response.url(), status: response.status(), resourceType: response.request().resourceType(), timestamp: ts });
    });

    page.on('requestfailed', (request) => {
      failedRequests.push({ url: request.url(), method: request.method(), failure: request.failure()?.errorText, resourceType: request.resourceType() });
    });

    const navStart = Date.now();
    let loadTimeMs = -1;
    let navigationTiming = null;

    try {
      const response = await page.goto(TEST_URL, { waitUntil: 'load', timeout: 120000 });
      loadTimeMs = Date.now() - navStart;

      // Wait until the Oslo button is visible on screen
      await page.getByRole('button', { name: 'oslo' }).waitFor({ timeout: 120000 });

      navigationTiming = await page.evaluate(() => {
        if (!window.performance || !window.performance.timing) return null;
        const t = window.performance.timing;
        return {
          navigationStart: t.navigationStart,
          responseStart: t.responseStart,
          domContentLoadedEventEnd: t.domContentLoadedEventEnd,
          loadEventEnd: t.loadEventEnd,
          domComplete: t.domComplete,
          total: t.loadEventEnd > 0 ? t.loadEventEnd - t.navigationStart : null,
          domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
          ttfb: t.responseStart - t.navigationStart,
        };
      });

      if (!response) {
        failedRequests.push({ url: TEST_URL, failure: 'no response', resourceType: 'document' });
      }

      if (response && response.status() >= 400) {
        failedRequests.push({ url: TEST_URL, failure: `HTTP ${response.status()}`, resourceType: 'document' });
      }

    } catch (error) {
      failedRequests.push({ url: TEST_URL, failure: error.message, resourceType: 'document' });
      loadTimeMs = Date.now() - navStart;
    }

    results.push({
      instance: i,
      crashed,
      loadTimeMs,
      totalRequests: requestEvents.length,
      totalResponses: responseEvents.length,
      failedRequests: failedRequests.length,
      failedDetails: failedRequests,
      navigationTiming,
    });

    await context.close();
  };

  await Promise.all(Array.from({ length: INSTANCE_COUNT }, (_, idx) => runInstance(idx + 1)));

  const failures = results.filter((r) => r.crashed || r.failedRequests > 0);

  console.log('\n=== 20-launch results for ' + TEST_URL + ' ===');
  results.forEach((r) => {
    console.log(`Instance ${r.instance}: crashed=${r.crashed}, loadTimeMs=${r.loadTimeMs}, requests=${r.totalRequests}, responses=${r.totalResponses}, failed=${r.failedRequests}`);
    if (r.navigationTiming) {
      console.log(`  nav timing: ttfb=${r.navigationTiming.ttfb} domContent=${r.navigationTiming.domContentLoaded} total=${r.navigationTiming.total}`);
    }
    if (r.failedDetails.length) {
      r.failedDetails.forEach((f) => console.log(`  failed: ${f.url} -> ${f.failure}`));
    }
  });
  expect(failures.length).toBe(0);
});
