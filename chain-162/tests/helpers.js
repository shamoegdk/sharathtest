// @ts-check

/**
 * Accepts the cookie consent dialog if it appears on the page.
 * @param {import('@playwright/test').Page} page
 */
async function acceptCookiesIfPresent(page) {
  try {
    await page.getByRole('button', { name: 'Accept all' }).click({ timeout: 5000 });
  } catch {
    // Cookie dialog did not appear — continue
  }
}

module.exports = { acceptCookiesIfPresent };
