const { test, expect } = require('@playwright/test');

test('google search for playwright', async ({ page }) => {
    await page.goto('https://www.google.com/search?q=playwright');
    await page.waitForSelector('h3', { timeout: 10000 });
    await expect(page.locator('h3').first()).toContainText(/playwright/i);
});