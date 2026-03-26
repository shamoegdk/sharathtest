# Copilot Instructions for sharathtest

This is a **Playwright test automation project** for testing web applications using modern browser automation.

## Project Structure

- `tests/` - Playwright test specifications (`.spec.js` files)
  - `googl.spec.js` - Tests for Google homepage (URL/title verification)
  - `example.spec.js` - Playwright template tests (page navigation, assertions)
  - `sample.spec.js` - Sample test cases (mostly commented/incomplete)
- `playwright.config.js` - Test configuration with browser projects (chromium, firefox, webkit)
- `Myjs.js` - Minimal helper script (currently just `console.log("hi")`)
- `indec.html` - Empty HTML file (likely placeholder)

## Key Technologies & Workflow

### Testing Framework: Playwright
- **Test command**: `npx playwright test [path/to/test.spec.js]`
- Tests run in **parallel by default** (see `fullyParallel: true` in config)
- **HTML reporter** generated in `playwright-report/` after test runs
- **Three browser projects** configured: chromium, firefox, webkit - tests run against all by default

### Test Structure
- Destructure `test` and `expect` from `@playwright/test`
- Tests accept `{ page }` fixture for browser automation
- Common patterns:
  ```javascript
  const { test, expect } = require('@playwright/test');
  
  test("test name", async ({ page }) => {
    await page.goto("https://example.com/");
    await expect(page).toHaveTitle(/expected-text/);
  });
  ```

## Code Patterns & Conventions

1. **Module imports**: Tests use CommonJS (`require()`) in some files and ES modules (`import`) in others - no strict convention yet
2. **Test naming**: Use descriptive strings ("google homepage", "has title") - prefer self-documenting test names
3. **Assertions**: Use Playwright's `expect()` API directly on page objects:
   - `expect(page).toHaveTitle(/regex/)`
   - `expect(element).toBeVisible()`
4. **Page interactions**: 
   - `await page.goto(url)` - navigate
   - `await page.getByRole()` - query elements by accessibility role
   - `.click()`, `.fill()`, etc. on locators

## Development Workflow

1. **Run specific test**: `npx playwright test tests/googl.spec.js`
2. **Run all tests**: `npx playwright test`
3. **View test results**: Open `playwright-report/index.html` in browser
4. **Debug**: Add `console.log()` statements; output visible in test logs
5. **Expected behavior on CI**: Config enables retries (2x) and single worker mode when `CI` env var is set

## Critical Notes for AI Agents

- **Empty/incomplete files**: `indec.html` and `Myjs.js` are placeholders - not part of active codebase logic
- **Mixed module syntax**: Some tests use `require()`, others use `import` - normalize to project preference when writing new tests
- **No test runner scripts in package.json**: Tests must be run via `npx playwright test`
- **No baseURL configured**: Tests use full URLs (https://www.google.com/, https://playwright.dev/) - set `baseURL` in config if changing to local testing
