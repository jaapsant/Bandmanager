import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up after E2E tests...');
  
  // Perform any cleanup operations here
  // For example: clean up test databases, stop test servers, etc.
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;