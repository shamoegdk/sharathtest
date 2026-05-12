// @ts-check

/**
 * Accepts the cookie consent dialog if it appears on the page.
 * @param {import('@playwright/test').Page} page
 */
async function acceptCookiesIfPresent(page) {
  const overlay = page.locator('[aria-label="We use cookies"]');
  try {
    // Wait for the cookie overlay to appear (it may render after the page load event)
    await overlay.waitFor({ state: 'visible', timeout: 10000 });
    // Click Accept all and wait until the overlay is fully gone before returning
    await page.getByRole('button', { name: /accept all|godta alle/i }).click();
    await overlay.waitFor({ state: 'hidden', timeout: 10000 });
  } catch {
    // Cookie dialog did not appear — continue
  }
}

module.exports = { acceptCookiesIfPresent };
