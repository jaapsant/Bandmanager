import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🎭 Setting up Playwright E2E tests...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for the dev server to be ready
    console.log('⏳ Waiting for dev server...');
    await page.goto('http://localhost:5173', { timeout: 60000 });
    
    // Check that the app loads correctly
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Dev server is ready');
    
    // Set up any global test data or configuration here
    await page.evaluate(() => {
      // Clear any existing data
      localStorage.clear();
      sessionStorage.clear();
      
      // Set up test environment flag
      localStorage.setItem('TEST_ENV', 'true');
    });
    
    console.log('🎭 Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;