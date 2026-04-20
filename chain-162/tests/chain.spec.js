// @ts-check
const { test, expect } = require('@playwright/test');
const { acceptCookiesIfPresent } = require('./helpers');

test.describe('Chain-162 Page', () => {

  test('page loads successfully', async ({ page }) => {
    await page.goto('/en/chain-162');
    await acceptCookiesIfPresent(page);
    await expect(page).toHaveURL(/chain-162/);
    await expect(page).toHaveTitle(/.+/);
  });

  test('logo is visible after accepting cookies', async ({ page }) => {
    await page.goto('/en/chain-162');
    await acceptCookiesIfPresent(page);
    const logo = page.getByRole('link', { name: 'Logo' });
    await expect(logo).toBeVisible({ timeout: 15000 });
  });

});
