import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing Nearly...');
  await page.goto('http://localhost:4200/nearly');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshot-nearly.png' });
  
  console.log('Testing Dogly...');
  await page.goto('http://localhost:4200/dogly');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshot-dogly.png' });
  
  console.log('Done');
  await browser.close();
})();
