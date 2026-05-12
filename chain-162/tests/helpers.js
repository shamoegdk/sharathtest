// @ts-check

/**
 * Accepts the cookie consent dialog if it appears on the page.
 * @param {import('@playwright/test').Page} page
 */
async function acceptCookiesIfPresent(page) {
  try {
    // Wait for the cookie overlay to appear (it may render after the page load event)
    await page.locator('[aria-label="We use cookies"]').waitFor({ timeout: 8000 });
    // Button label varies by locale: English = "Accept all", Norwegian = "Godta alle"
    await page.getByRole('button', { name: /accept all|godta alle/i }).click({ timeout: 5000 });
  } catch {
    // Cookie dialog did not appear — continue
  }
}

module.exports = { acceptCookiesIfPresent };
