// const { test, expect } = require('@playwright/test');

// test('successful login with valid credentials', async ({ page }) => {
//   await page.goto('https://the-internet.herokuapp.com/login');

//   await page.fill('#username', 'tomsmith');
//   await page.fill('#password', 'SuperSecretPassword!');
//   await page.click('button[type="submit"]');

//   await expect(page.locator('#flash')).toContainText('You logged into a secure area!');
// });

// test('shows error message for invalid credentials', async ({ page }) => {
//   await page.goto('https://the-internet.herokuapp.com/login');

//   await page.fill('#username', 'invalid');
//   await page.fill('#password', 'invalid');
//   await page.click('button[type="submit"]');

//   await expect(page.locator('#flash')).toContainText('Your username is invalid!');
// });



const { test, expect } = require('@playwright/test');
test("login", async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
}
)


