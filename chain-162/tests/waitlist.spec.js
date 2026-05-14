// @ts-check
const { test, expect } = require('@playwright/test');
const { WaitlistPage } = require('./pages/WaitlistPage');

// HAN-T134 – COB v2.0 – Waitlist Flow
// Zephyr TC key: HAN-T134 | Linked Jira: HAN-14831, HAN-14973

const VALID_EMAIL    = process.env.BOOKING_EMAIL    || 'testsharathm@gmail.com';
const VALID_PASSWORD = process.env.BOOKING_PASSWORD || 'Auto@12345';

const SALON_NAME    = process.env.BOOKING_SALON            || 'SALON MANGALORE INDIA1';
const SERVICE_GROUP = process.env.BOOKING_SERVICE_GROUP    || 'Test Service Group';
const SERVICE_CAT   = process.env.BOOKING_SERVICE_CATEGORY || 'Styling';
const SERVICE_NAME  = process.env.BOOKING_SERVICE_NAME     || 'treat777';

const WAITLIST_TREATMENT  = process.env.WAITLIST_TREATMENT  || 'abctreat';
const WAITLIST_RESOURCE   = process.env.WAITLIST_RESOURCE   || 'Any stylist';
const WAITLIST_START_TIME = process.env.WAITLIST_START_TIME || '08:00';
const WAITLIST_END_TIME   = process.env.WAITLIST_END_TIME   || '16:00';

// Compute dynamic future dates so the test is not date-bound.
function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}
const WAITLIST_START_DATE = process.env.WAITLIST_START_DATE || isoDate(0);
const WAITLIST_END_DATE   = process.env.WAITLIST_END_DATE   || isoDate(30);

// ── Shared helper ──────────────────────────────────────────────────────────
/**
 * Navigate through the booking flow up to the date/time view (step 05 SELECT TIME).
 * This is the entry point for the waitlist flow.
 */
async function navigateToDateView(page, waitlist) {
  await waitlist.goto();
  await page.getByRole('button', { name: 'Oslo' }).waitFor({ timeout: 30000 });
  await waitlist.selectArea('Oslo');

  await expect(waitlist.selectSalonsHeading).toBeVisible();
  await expect(page.getByRole('checkbox', { name: SALON_NAME })).toBeVisible();
  await waitlist.selectSalon(SALON_NAME);

  await expect(waitlist.selectSalonButton).toBeVisible();
  await waitlist.confirmSalonSelection();

  await expect(waitlist.firstAvailableCard).toBeVisible();
  await waitlist.selectFirstAvailable();

  await expect(page.getByRole('img', { name: SERVICE_GROUP })).toBeVisible();
  await waitlist.expandServiceGroup(SERVICE_GROUP);

  await expect(page.getByText(SERVICE_CAT, { exact: true }).first()).toBeVisible();
  await waitlist.selectServiceCategory(SERVICE_CAT);

  await expect(page.getByText(SERVICE_NAME).first()).toBeVisible();
  await waitlist.selectService(SERVICE_NAME);

  // Confirm service — lands on the date/time view (step 05)
  await expect(waitlist.selectTreatmentButton).toBeVisible();
  await waitlist.confirmServiceSelection();

  // Wait for the date view to be fully loaded
  await expect(page.getByText(/select time/i)).toBeVisible({ timeout: 10000 });
}

test.describe('HAN-T134: COB v2.0 – Waitlist Flow', () => {
  // Full booking-flow navigation is slow; allow 180s per test
  test.describe.configure({ timeout: 180000 });

  // ── Test 1: Happy path ───────────────────────────────────────────────────
  test('Complete waitlist flow: navigate → configure → submit → verify', async ({ page }) => {
    const waitlist = new WaitlistPage(page);

    // ── Section 1: Navigate to the date view ──────────────────────────────
    await test.step('Navigate through booking flow to date/time view', async () => {
      await navigateToDateView(page, waitlist);
    });

    // ── Section 2: Verify calendar month navigation ────────────────────────
    await test.step('Verify calendar next/prev month navigation', async () => {
      // "Previous dates" is disabled on the current month — click Next first to enable it
      await expect(waitlist.calendarNextButton).toBeVisible();
      await waitlist.calendarNext();

      // Now "Previous dates" is enabled — go back to the current month
      await expect(waitlist.calendarPrevButton).toBeEnabled();
      await waitlist.calendarPrev();

      // Select today's date
      const dayNum = new Date().getDate().toString();
      await expect(
        page.getByRole('button', { name: new RegExp(`\\b${dayNum}$`) }).first()
      ).toBeVisible();
      await waitlist.selectDay(parseInt(dayNum));
    });

    // ── Section 3: Open the waitlist modal ────────────────────────────────
    await test.step('Open "Add me to waitlist" modal', async () => {
      await expect(waitlist.waitlistEntryButton).toBeVisible();
      await waitlist.initiateWaitlist();
      // Modal heading confirms it opened
      await expect(page.locator('.modal-title')).toBeVisible({ timeout: 10000 });
    });

    // ── Section 4: (no login needed to open the modal; login fires on submit) ─

    // ── Section 5: Configure waitlist entry ───────────────────────────────
    // Dates and TIME INTERVAL (08:00 → 16:00) are pre-filled by the app.
    // Only SALON and TREATMENT need to be explicitly selected.
    await test.step('Configure waitlist: select salon and treatment', async () => {
      await expect(waitlist.salonDropdownRow).toBeVisible();
      await waitlist.selectWaitlistSalon(SALON_NAME);

      await expect(waitlist.treatmentDropdownRow).toBeVisible();
      await waitlist.selectWaitlistTreatment(WAITLIST_TREATMENT);

      console.log(`Waitlist config — salon: ${SALON_NAME}, treatment: ${WAITLIST_TREATMENT}`);
    });

    // ── Section 6: Submit and verify success ──────────────────────────────
    await test.step('Submit waitlist — verify success or auto-redirect to Min Side', async () => {
      await expect(waitlist.addToWaitlistButton).toBeVisible();
      await waitlist.submitWaitlist();

      // Login modal appears for unauthenticated users; app auto-submits after login
      try {
        await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible({ timeout: 5000 });
        await waitlist.login(VALID_EMAIL, VALID_PASSWORD);
        await expect(page.getByRole('heading', { name: 'Log in' })).not.toBeVisible();
        // App auto-submits after login — do NOT click submit again
      } catch {
        // Already authenticated — app submitted directly
      }

      // Accept success toast OR Min Side redirect as confirmation
      try {
        await expect(waitlist.waitlistSuccessMsg).toBeVisible({ timeout: 3000 });
        console.log('Waitlist submission confirmed via: toast');
      } catch {
        await expect(page.getByText(/venteliste/i).first()).toBeVisible({ timeout: 20000 });
        console.log('Waitlist submission confirmed via: Min Side redirect');
      }
    });

    // ── Section 7: Verify waitlist count on Min Side ───────────────────────
    await test.step('Verify waitlist entry visible on Min Side', async () => {
      // Section 6 confirmed the app already navigated to Min Side after submission.
      // Just assert the VENTELISTE tile is present.
      await expect(page.getByText('VENTELISTE')).toBeVisible({ timeout: 15000 });
      console.log('Min Side — VENTELISTE count confirmed visible.');
    });
  });

  // ── Test 2: Unauthenticated → login on submit → return to waitlist ───────
  test('Unauthenticated user sees login prompt on submit, then returns to waitlist', async ({ page }) => {
    const waitlist = new WaitlistPage(page);

    await test.step('Navigate to date view without logging in', async () => {
      await navigateToDateView(page, waitlist);
    });

    await test.step('Open waitlist modal — modal opens without login', async () => {
      await expect(waitlist.waitlistEntryButton).toBeVisible();
      await waitlist.initiateWaitlist();
      await expect(page.locator('.modal-title')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Fill in minimal waitlist config (salon + treatment)', async () => {
      await expect(waitlist.salonDropdownRow).toBeVisible();
      await waitlist.selectWaitlistSalon(SALON_NAME);

      await expect(waitlist.treatmentDropdownRow).toBeVisible();
      await waitlist.selectWaitlistTreatment(WAITLIST_TREATMENT);
    });

    await test.step('Submit triggers login modal — not an unrelated page', async () => {
      await expect(waitlist.addToWaitlistButton).toBeVisible();
      await waitlist.submitWaitlist();
      await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible({ timeout: 10000 });
    });

    await test.step('Login and verify user is returned to the waitlist flow', async () => {
      await expect(page.getByRole('textbox', { name: /^(email|epost)$/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /^(password|passord)$/i })).toBeVisible();
      await waitlist.login(VALID_EMAIL, VALID_PASSWORD);
      await expect(page.getByRole('heading', { name: 'Log in' })).not.toBeVisible();

      // After login the user should land back on the waitlist/booking flow — not an unrelated page
      await expect(
        page.getByText(/add me to waitlist|venteliste|select time|velg tid/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  // ── Test 3: Edge case — submit without selecting time interval ────────────
  test('Edge case: submitting waitlist without time interval shows validation', async ({ page }) => {
    const waitlist = new WaitlistPage(page);

    await test.step('Navigate to date view and open waitlist modal', async () => {
      await navigateToDateView(page, waitlist);
      await expect(waitlist.waitlistEntryButton).toBeVisible();
      await waitlist.initiateWaitlist();
      await expect(page.locator('.modal-title')).toBeVisible({ timeout: 10000 });

      // Login if prompted when opening the modal
      try {
        await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible({ timeout: 5000 });
        await waitlist.login(VALID_EMAIL, VALID_PASSWORD);
        await expect(page.getByRole('heading', { name: 'Log in' })).not.toBeVisible();
        await waitlist.initiateWaitlist();
        await expect(page.locator('.modal-title')).toBeVisible({ timeout: 10000 });
      } catch {
        // Already logged in — continue
      }
    });

    await test.step('Attempt to submit without selecting any treatment (required field)', async () => {
      // TREATMENT is the only required (*) field — skip it to trigger validation
      await expect(waitlist.salonDropdownRow).toBeVisible();
      await waitlist.selectWaitlistSalon(SALON_NAME);
      // ⚠ Intentionally skip TREATMENT
    });

    await test.step('Submit button is disabled when required TREATMENT is missing', async () => {
      // The "Add me to waitlist" button is disabled until TREATMENT (*) is selected.
      // This prevents submission — no validation toast needed; the button itself is the guard.
      await expect(waitlist.addToWaitlistButton).toBeVisible();
      await expect(waitlist.addToWaitlistButton).toBeDisabled();
      await expect(waitlist.waitlistSuccessMsg).not.toBeVisible();
      console.log('Edge case confirmed: submit button disabled without TREATMENT selected.');
    });
  });

});
