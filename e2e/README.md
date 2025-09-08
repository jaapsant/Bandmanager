# End-to-End Testing with Playwright

This directory contains comprehensive end-to-end tests for the Band Manager application using Playwright.

## Overview

Our E2E test suite covers:
- **Authentication flows** - login, signup, email verification
- **Band management** - member management, instrument management, permissions
- **Gig management** - CRUD operations, availability tracking, calendar integration
- **Complete user workflows** - multi-step user journeys
- **Responsive design** - mobile and desktop experiences
- **Error handling** - network errors, validation errors, recovery

## Test Structure

```
e2e/
├── auth.spec.ts              # Authentication tests
├── band-management.spec.ts   # Band and member management tests
├── gig-management.spec.ts    # Gig management and calendar tests
├── user-workflows.spec.ts    # Complete user journey tests
├── helpers/
│   ├── auth-helpers.ts       # Authentication test utilities
│   ├── data-helpers.ts       # Test data creation and mocking
│   └── ui-helpers.ts         # UI interaction helpers
└── setup/
    ├── global-setup.ts       # Global test setup
    └── global-teardown.ts    # Global test cleanup
```

## Running Tests

### Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Install Playwright browsers: `npx playwright install`

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests on specific browser
npx playwright test --project=chromium

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Helpers

### Authentication Helpers (`helpers/auth-helpers.ts`)

```typescript
import { loginAsBandManager, loginAsBandMember, loginAsAdmin } from './helpers/auth-helpers';

// In your test
await loginAsBandManager(page);
await page.goto('/band');
```

Available authentication helpers:
- `loginAs(page, user, roles)` - Generic login with custom user/roles
- `loginAsBandManager(page)` - Login as band manager
- `loginAsBandMember(page)` - Login as regular band member  
- `loginAsAdmin(page)` - Login as admin user
- `loginAsUnverifiedUser(page)` - Login as unverified user
- `logout(page)` - Clear authentication state

### Data Helpers (`helpers/data-helpers.ts`)

```typescript
import { mockGigs, createSampleGig, mockCompleteDataset } from './helpers/data-helpers';

// Mock test data
await mockCompleteDataset(page);

// Create custom gig
const gig = createSampleGig({ name: 'Custom Gig', date: '2025-12-25' });
await mockGigs(page, [gig]);
```

Available data helpers:
- `mockGigs(page, gigs)` - Mock gig data
- `mockBandMembers(page, members)` - Mock band member data
- `mockInstruments(page, instruments)` - Mock instrument data
- `createSampleGig(overrides)` - Create test gig data
- `mockCompleteDataset(page)` - Mock complete test dataset
- `getFutureDate(days)` - Get future date for testing
- `getPastDate(days)` - Get past date for testing

### UI Helpers (`helpers/ui-helpers.ts`)

```typescript
import { waitForToast, fillForm, waitForModal } from './helpers/ui-helpers';

// Wait for success message
await waitForToast(page, 'Gig created successfully');

// Fill form with multiple fields
await fillForm(page, {
  'input[name="name"]': 'Test Gig',
  'input[name="date"]': '2025-12-25'
});
```

Available UI helpers:
- `waitForToast(page, message?)` - Wait for toast notifications
- `fillForm(page, fields)` - Fill multiple form fields
- `waitForModal(page, title?)` - Wait for modal to open
- `waitForModalClose(page)` - Wait for modal to close
- `clickAndNavigate(page, selector, url?)` - Click and wait for navigation
- `waitForLoadingComplete(page)` - Wait for loading to finish
- `expectTextVisible(page, text)` - Assert text is visible
- `takeScreenshot(page, name)` - Take debug screenshot

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- Login/signup form validation
- Email verification flow
- Password visibility toggle
- Authentication error handling
- Protected route access
- Session persistence

### 2. Band Management Tests (`band-management.spec.ts`)
- Adding/editing/removing band members
- Instrument management
- Permission-based access control
- Member availability overview
- Search and filtering

### 3. Gig Management Tests (`gig-management.spec.ts`)
- Creating/editing/deleting gigs
- Calendar view interactions
- Member availability tracking
- Status updates and validation
- Export to calendar features
- Multi-date gig handling

### 4. User Workflow Tests (`user-workflows.spec.ts`)
- Complete signup to gig creation flow
- Member availability workflow
- Multi-language experience
- Mobile responsive workflows
- Error handling and recovery
- Permission transitions
- New user onboarding

## Configuration

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/setup/global-setup.ts',
  globalTeardown: './e2e/setup/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] },
    { name: 'Mobile Safari', use: devices['iPhone 12'] },
  ],
});
```

### Browser Projects
Tests run across multiple browsers and viewports:
- Desktop: Chrome, Firefox, Safari
- Mobile: Chrome (Pixel 5), Safari (iPhone 12)

## Best Practices

### 1. Test Isolation
Each test should be independent and clean up after itself:
```typescript
test.beforeEach(async ({ page }) => {
  await loginAsBandManager(page);
  await clearMockData(page);
});
```

### 2. Reliable Selectors
Use data-testid attributes for stable element selection:
```typescript
// Good
await page.locator('[data-testid="add-gig-button"]').click();

// Avoid (brittle)
await page.locator('button:nth-child(3)').click();
```

### 3. Wait Strategies
Always wait for elements and state changes:
```typescript
// Wait for element to be visible
await expect(page.locator('text="Success"')).toBeVisible();

// Wait for navigation
await page.waitForURL('**/dashboard');

// Wait for network requests
await page.waitForLoadState('networkidle');
```

### 4. Error Handling
Test both success and failure scenarios:
```typescript
test('should handle network errors gracefully', async ({ page }) => {
  // Simulate network failure
  await page.route('**/api/**', route => route.abort('failed'));
  
  // Perform action
  await page.locator('button:has-text("Save")').click();
  
  // Verify error handling
  await expect(page.locator('text="Network error"')).toBeVisible();
});
```

## Debugging Tests

### Visual Debugging
```bash
# Run with visible browser
npx playwright test --headed

# Run with debug mode (step through)
npx playwright test --debug
```

### Screenshots and Videos
- Screenshots are taken automatically on failure
- Videos are recorded for failed tests
- Traces are captured for debugging

### Debug Output
```bash
# Verbose output
npx playwright test --reporter=line

# Generate trace files
npx playwright test --trace=on
```

## CI/CD Integration

The tests are configured to run in CI environments:
- Retry failed tests automatically
- Generate HTML reports
- Store test artifacts (screenshots, videos, traces)
- Run in parallel for faster execution

## Maintenance

### Adding New Tests
1. Create test file in appropriate category
2. Use existing helpers for common operations
3. Follow naming conventions: `feature.spec.ts`
4. Include both positive and negative test cases

### Updating Selectors
When UI changes, update selectors in helper functions to maintain test stability.

### Performance
- Tests run in parallel by default
- Use `test.describe.serial()` for tests that must run sequentially
- Mock external API calls to avoid network dependencies