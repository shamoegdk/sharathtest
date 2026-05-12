// @ts-check
const { acceptCookiesIfPresent } = require('../helpers');

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.navMenuButton = page.getByRole('button', { name: 'Open navigation menu' });
    this.logInLink = page.getByText('Log in').first();
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.successMessage = page.getByText('Login successful', { exact: true });
    this.errorMessage = page.getByText('Incorrect login information', { exact: false }).last();
  }

  async goto() {
    await this.page.goto('/en/chain-162');
    console.log('Navigated to login page',this.page);
    await acceptCookiesIfPresent(this.page);
  }

  async login(email, password) {
    await this.navMenuButton.click();
    await this.logInLink.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

module.exports = { LoginPage };
