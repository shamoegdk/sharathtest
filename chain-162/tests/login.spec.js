// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');

// Store credentials in environment variables:
// set TEST_EMAIL=your@email.com
// set TEST_PASSWORD=yourpassword
const EMAIL = process.env.TEST_EMAIL || 'testsharathm@gmail.com';
const PASSWORD = process.env.TEST_PASSWORD || 'Auto@12345';

test.describe('Login', () => {

  test('successful login shows success message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, PASSWORD);
    await expect(loginPage.successMessage).toBeVisible();
  });

  test('invalid credentials shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong@example.com', 'wrongpassword');
    await expect(loginPage.errorMessage).toBeVisible();
  });

});
