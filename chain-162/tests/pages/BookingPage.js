// @ts-check
const { acceptCookiesIfPresent } = require('../helpers');

class BookingPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Step 1 – Landing
    this.searchBox = page.getByPlaceholder(/search for salon/i);

    // Step 2 – Area & Salon selection
    this.selectSalonsHeading = page.getByRole('heading', { name: /select salons/i });
    this.selectSalonButton   = page.getByRole('button',  { name: /velg salong/i });

    // Step 3 – Resource mode (headings are English, buttons stay Norwegian)
    this.firstAvailableCard = page.getByRole('heading', { name: /first available hairdresser|første ledige/i });

    // Step 4 – Service selection
    this.selectTreatmentButton = page.getByRole('button', { name: /velg behandling/i });

    // Step 5 – Confirm Booking page (visible before login)
    this.bookingSummaryHeading = page.getByRole('heading', { name: 'Confirm Booking' });
    this.smsReminderCheckbox   = page.getByRole('checkbox', { name: /sms reminder/i });
    this.emailReminderCheckbox = page.getByRole('checkbox', { name: /email reminder/i });
    this.noteTextarea          = page.getByPlaceholder(/^dp$/i);

    // Bottom bar confirm button (used both before login and after login to finalize)
    this.confirmButton = page.getByRole('button', { name: 'Confirm' });

    // Login modal
    this.emailInput         = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput      = page.getByRole('textbox', { name: 'Password' });
    this.loginButton        = page.getByRole('button',  { name: 'Login' });
    this.createAccountLink  = page.getByRole('link',    { name: 'Create Account' });
    this.forgotPasswordLink = page.getByRole('link',    { name: 'Forgot password' });

    // Forgot password page (Norwegian labels regardless of locale)
    this.forgotPasswordEmailInput = page.getByRole('textbox', { name: /epost/i });
    this.sendButton               = page.getByRole('button',  { name: 'SEND' });
    this.backToLoginLink          = page.getByRole('link',    { name: /gå tilbake til innlogging/i });

    // Assertions
    this.registrationHeading        = page.getByRole('heading', { name: 'Create New User' });
    this.forgotPasswordSentMsg      = page.getByText('Passordet ble sendt vellykket', { exact: true });
    this.loginSuccessMessage        = page.getByText('Login successful', { exact: true });
    this.loginErrorMessage          = page.getByText(/incorrect login information/i).last();
    this.bookingConfirmationMessage = page.getByText(/din time er bestilt/i);

    // Booking confirmation page details (dynamic — asserted after booking)
    this.confirmationSalonName = page.getByText('SALON MANGALORE INDIA1');
    this.confirmationDuration  = page.getByText(/\d+\s*min/i);
    this.confirmationPrice     = page.getByText(/\d+\s*kr/i);
  }

  /** Returns a locator for the service name on the confirmation page */
  confirmationService(serviceName) {
    return this.page.getByText(serviceName);
  }

  async goto() {
    await this.page.goto('/en/chain-162');
    await acceptCookiesIfPresent(this.page);
  }

  async selectArea(areaName) {
    await this.page.getByRole('button', { name: areaName }).click();
  }

  async selectSalon(salonName) {
    await this.page.getByRole('checkbox', { name: salonName }).check();
  }

  async confirmSalonSelection() {
    await this.selectSalonButton.click();
  }

  async selectFirstAvailable() {
    await this.firstAvailableCard.click();
  }

  /** Click the service group image then heading to expand it */
  async expandServiceGroup(groupName) {
    await this.page.getByRole('img', { name: groupName }).click({ force: true });
    await this.page.getByRole('heading', { name: groupName }).click({ force: true });
  }

  /** Click a category/sub-group within a service group */
  async selectServiceCategory(categoryName) {
    await this.page.getByText(categoryName, { exact: true }).first().click();
  }

  /** Click a specific service tile */
  async selectService(serviceName) {
    await this.page.getByText(serviceName, { exact: false }).first().click();
  }

  async confirmServiceSelection() {
    await this.selectTreatmentButton.click();
  }

  /** Click the date button matching today's day number (buttons show e.g. "TIR. 12") */
  async selectTodayDate() {
    const dayNum = new Date().getDate().toString();
    await this.page.getByRole('button', { name: new RegExp(`\\b${dayNum}$`) }).first().click();
  }

  /** Get text of first available time slot, then click it */
  async selectFirstAvailableTimeSlot() {
    const timeButton = this.page.getByRole('button', { name: /^\d{1,2}:\d{2}$/ }).first();
    const timeText = await timeButton.textContent();
    await timeButton.click();
    return timeText;
  }

  async selectTimeSlot(time) {
    await this.page.getByRole('button', { name: time }).click();
  }

  /** Select a resource (hairdresser) from the picker modal */
  async selectResource(resourceName) {
    await this.page.getByRole('button', { name: resourceName }).click();
  }

  /**
   * Wait for the SELECT RESOURCE modal and click the first available resource.
   * Returns the name of the selected resource.
   */
  async selectFirstAvailableResource() {
    await this.page.getByText('SELECT RESOURCE').first().waitFor({ timeout: 10000 });
    // Resource cards are buttons with real names (3+ word chars); the only non-resource
    // button in the modal is the × close button which is a single character.
    const firstResource = this.page
      .getByRole('button')
      .filter({ hasText: /\w{3,}/ })
      .first();
    const name = (await firstResource.textContent())?.trim();
    await firstResource.click();
    return name;
  }

  async toggleSmsReminder() {
    await this.smsReminderCheckbox.click();
  }

  async toggleEmailReminder() {
    await this.emailReminderCheckbox.click();
  }

  async fillNote(text) {
    await this.noteTextarea.fill(text);
  }

  /** Click the bottom bar "Confirm" button — triggers login modal if unauthenticated */
  async clickConfirm() {
    await this.confirmButton.click();
  }

  async clickCreateAccount() {
    await this.createAccountLink.click();
  }

  async clickLoginHere() {
    await this.loginHereLink.click();
  }

  async clickForgotPassword() {
    // Fill email first to pass login form validation, then click the link
    await this.emailInput.fill('placeholder@test.com');
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/forgot-password/);
  }

  async submitForgotPasswordEmail(email) {
    await this.forgotPasswordEmailInput.fill(email);
    await this.sendButton.click();
  }

  async clickBackToLogin() {
    await this.backToLoginLink.click();
  }

  async login(email, password) {
    // Label varies by locale: English modal = "Email"/"Password", Norwegian page = "Epost"/"Passord"
    await this.page.getByRole('textbox', { name: /^(email|epost)$/i }).fill(email);
    await this.page.getByRole('textbox', { name: /^(password|passord)$/i }).fill(password);
    await this.loginButton.click();
  }
}

module.exports = { BookingPage };
