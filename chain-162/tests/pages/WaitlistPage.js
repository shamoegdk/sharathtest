// @ts-check
const { BookingPage } = require('./BookingPage');

class WaitlistPage extends BookingPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Calendar month navigation ──────────────────────────────────────────
    // Buttons have aria-label="Previous dates" / "Next dates"
    // Note: "Previous dates" is disabled on the current month — always click Next first.
    this.calendarPrevButton = page.getByRole('button', { name: 'Previous dates' });
    this.calendarNextButton = page.getByRole('button', { name: 'Next dates' });

    // ── Waitlist entry button on the date view ─────────────────────────────
    this.waitlistEntryButton = page.getByRole('button', {
      name: /add me to waitlist|sett meg på venteliste/i,
    });

    // ── Waitlist config modal ──────────────────────────────────────────────
    // Custom dropdown rows — click to open, then click the option.
    // Use exact: true to avoid matching the page heading "Select Salons".
    this.salonDropdownRow     = page.getByText('Select salon',     { exact: true });
    this.treatmentDropdownRow = page.getByText('Select treatment', { exact: true });
    this.resourceDropdownRow  = page.getByText('Any stylist',      { exact: true });

    // Native date inputs
    this.dateFromInput = page.locator('input[type="date"]').first();
    this.dateToInput   = page.locator('input[type="date"]').last();

    // TIME INTERVAL row — click the chevron / row to open the time picker panel
    this.timeIntervalRow = page
      .locator('div, section')
      .filter({ hasText: /time interval/i })
      .first();

    // Time picker inputs inside the TIME INTERVAL sub-panel
    this.startTimeInput = page.locator('input[type="time"]').first();
    this.endTimeInput   = page.locator('input[type="time"]').last();

    // ── Waitlist submit ────────────────────────────────────────────────────
    this.addToWaitlistButton = page.getByRole('button', {
      name: /add me to waitlist/i,
    });
    this.waitlistSuccessMsg = page.getByText(/du har blitt lagt til på ventelisten/i);

    // ── Post-submission ────────────────────────────────────────────────────
    this.toastCloseButton = page
      .locator('[class*="toast"] button, [role="alert"] button, [class*="notification"] button')
      .first();
    this.minSideLink = page.getByRole('link', { name: /min side/i });

    // ── Edge case validation ───────────────────────────────────────────────
    // Triggered when required fields (e.g. TREATMENT) are not selected
    this.waitlistValidationMsg = page
      .getByText(/velg|required|påkrevd|behandling|treatment|please/i)
      .first();
  }

  /** Override to use force:true — a cart overlay can intercept the click on Firefox */
  async selectFirstAvailable() {
    await this.firstAvailableCard.click({ force: true });
  }

  // ── Calendar navigation ────────────────────────────────────────────────

  async calendarPrev() {
    await this.calendarPrevButton.click();
  }

  async calendarNext() {
    await this.calendarNextButton.click();
  }

  async selectDay(dayNumber) {
    await this.page
      .getByRole('button', { name: new RegExp(`\\b${dayNumber}$`) })
      .first()
      .click({ force: true });
  }

  // ── Waitlist flow ──────────────────────────────────────────────────────

  async initiateWaitlist() {
    await this.waitlistEntryButton.click();
  }

  /** Click the SALON row, then click the matching .cs-option item */
  async selectWaitlistSalon(salonName) {
    await this.salonDropdownRow.click();
    await this.page.locator('.cs-option').filter({ hasText: salonName }).click();
  }

  /** Click the TREATMENT row, then click the matching .cs-option item */
  async selectWaitlistTreatment(treatmentName) {
    await this.treatmentDropdownRow.click();
    await this.page.locator('.cs-option').filter({ hasText: treatmentName }).click();
  }

  /** Click the RESOURCE row, then click the matching .cs-option item */
  async selectWaitlistResource(resourceName) {
    await this.resourceDropdownRow.click();
    await this.page.locator('.cs-option').filter({ hasText: resourceName }).click();
  }

  /** Fill the DATE FROM input (YYYY-MM-DD) */
  async setStartDate(date) {
    await this.dateFromInput.fill(date);
    await this.dateFromInput.dispatchEvent('change');
  }

  /** Fill the DATE TO input (YYYY-MM-DD) */
  async setEndDate(date) {
    await this.dateToInput.fill(date);
    await this.dateToInput.dispatchEvent('change');
  }

  /**
   * Open the TIME INTERVAL panel and set start + end times.
   * Falls back to filling time inputs directly if already expanded.
   */
  async setTimeInterval(startTime, endTime) {
    // Click the row to open the time picker sub-panel
    await this.timeIntervalRow.click();
    // Fill start time
    await this.startTimeInput.fill(startTime);
    await this.startTimeInput.dispatchEvent('change');
    // Fill end time
    await this.endTimeInput.fill(endTime);
    await this.endTimeInput.dispatchEvent('change');
  }

  async submitWaitlist() {
    await this.addToWaitlistButton.click();
  }

  async dismissToast() {
    await this.toastCloseButton.click();
  }

  async goToMinSide() {
    await this.minSideLink.click();
  }
}

module.exports = { WaitlistPage };
