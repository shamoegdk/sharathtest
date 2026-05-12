// @ts-check
const { test, expect } = require('@playwright/test');
const { BookingPage } = require('./pages/BookingPage');

// HAN-T128 – COB v2.0 – Full Booking Flow (Single Service)
// Zephyr TC key: HAN-T128 | Linked Jira: HAN-14831, HAN-14973

const VALID_EMAIL    = process.env.BOOKING_EMAIL    || 'testsharathm@gmail.com';
const VALID_PASSWORD = process.env.BOOKING_PASSWORD || 'Auto@12345';

test.describe('HAN-T128: COB v2.0 – Full Booking Flow (Single Service)', () => {

  test('Complete booking flow: area → salon → service → time → login → confirm', async ({ page }) => {
    const booking = new BookingPage(page);

    // ── Section 1: Cookie Consent & Landing Page ───────────────────────────
    await test.step('Navigate and accept cookies', async () => {
      await booking.goto();
      await expect(booking.searchBox).toBeVisible();
    });

    // ── Section 2: Area & Salon Selection ─────────────────────────────────
    await test.step('Select Oslo area and SALON MANGALORE INDIA1', async () => {
      await expect(page.getByRole('button', { name: 'Oslo' })).toBeVisible();
      await booking.selectArea('Oslo');

      await expect(booking.selectSalonsHeading).toBeVisible();
      await expect(page.getByRole('checkbox', { name: 'SALON MANGALORE INDIA1' })).toBeVisible();
      await booking.selectSalon('SALON MANGALORE INDIA1');

      await expect(booking.selectSalonButton).toBeVisible();
      await booking.confirmSalonSelection();
    });

    // ── Section 3: Resource Mode & Service Selection ───────────────────────
    await test.step('Select First Available mode and treat777 from Test Service Group', async () => {
      await expect(booking.firstAvailableCard).toBeVisible();
      await booking.selectFirstAvailable();

      await expect(page.getByRole('img', { name: 'Test Service Group' })).toBeVisible();
      await booking.expandServiceGroup('Test Service Group');

      await expect(page.getByText('Styling', { exact: true }).first()).toBeVisible();
      await booking.selectServiceCategory('Styling');

      await expect(page.getByText('treat777').first()).toBeVisible();
      await booking.selectService('treat777');

      await expect(booking.selectTreatmentButton).toBeVisible();
      await booking.confirmServiceSelection();
    });

    // ── Section 4: Timeslot & Resource Selection ───────────────────────────
    await test.step('Select today\'s date, first available timeslot and first available resource', async () => {
      const dayNum = new Date().getDate().toString();
      await expect(page.getByRole('button', { name: new RegExp(`\\b${dayNum}$`) }).first()).toBeVisible();
      await booking.selectTodayDate();

      await expect(page.getByRole('button', { name: /^\d{1,2}:\d{2}$/ }).first()).toBeVisible();
      const selectedTime = await booking.selectFirstAvailableTimeSlot();
      console.log(`Selected time slot: ${selectedTime}`);

      const selectedResource = await booking.selectFirstAvailableResource();
      console.log(`Selected resource: ${selectedResource}`);
    });

    // ── Section 5: Confirm Booking Page ───────────────────────────────────
    // Confirm Booking section is already visible after resource selection
    await test.step('Review booking summary, toggle reminders, add note, then confirm', async () => {
      await expect(booking.bookingSummaryHeading).toBeVisible({ timeout: 15000 });
      await expect(booking.smsReminderCheckbox).toBeVisible();
      await booking.toggleSmsReminder();

      await expect(booking.emailReminderCheckbox).toBeVisible();
      await booking.toggleEmailReminder();

      await expect(booking.noteTextarea).toBeVisible();
      await booking.fillNote('test');

      await expect(booking.confirmButton).toBeVisible();
      await booking.clickConfirm(); // triggers login modal for unauthenticated users
    });

    // ── Section 6: Login with valid credentials ───────────────────────────
    await test.step('Login with valid credentials', async () => {
      await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /^(email|epost)$/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /^(password|passord)$/i })).toBeVisible();
      await expect(booking.loginButton).toBeVisible();
      await booking.login(VALID_EMAIL, VALID_PASSWORD);
      // Wait for the login heading to disappear — confirms login succeeded and modal closed
      await expect(page.getByRole('heading', { name: 'Log in' })).not.toBeVisible();
    });

    // ── Section 7: Booking Confirmation After Login ────────────────────────
    await test.step('Confirm booking and verify confirmation message', async () => {
      // App may auto-confirm after login; wait briefly — only click Confirm if needed
      try {
        await expect(booking.bookingConfirmationMessage).toBeVisible({ timeout: 5000 });
      } catch {
        // Not auto-confirmed — Confirm button should now be enabled
        await booking.clickConfirm();
      }

      // Primary confirmation message
      await expect(booking.bookingConfirmationMessage).toBeVisible({ timeout: 15000 });

      // Confirmation page details
      await expect(booking.confirmationSalonName).toBeVisible();
      await expect(booking.confirmationService).toBeVisible();
      await expect(booking.confirmationDuration).toBeVisible();
      await expect(booking.confirmationPrice).toBeVisible();

      // Log the full confirmation page text for visibility in the report
      const confirmationText = await page.locator('body').innerText();
      const lines = confirmationText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      const startIdx = lines.findIndex(l => /din time er bestilt/i.test(l));
      const snippet = startIdx >= 0 ? lines.slice(startIdx, startIdx + 20).join('\n') : '(confirmation text not found)';
      console.log('=== BOOKING CONFIRMATION PAGE ===\n' + snippet);
    });

  });

});
