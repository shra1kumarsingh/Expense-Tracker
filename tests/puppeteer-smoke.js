const puppeteer = require('puppeteer');

(async () => {
  const APP = 'http://localhost:8000';
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  console.log('Opening app...');
  await page.goto(APP);

  // Click the Register link to show registration form
  await page.click('text/Register');
  await page.type('#register-email', 'puppeteer@test.local');
  await page.type('#register-password', 'pass1234');
  await page.click('#registration-form button');
  await page.waitForSelector('#expense-tracker');
  console.log('Registered and logged in.');

  // Add expense
  const name = 'Puppeteer Expense';
  await page.type('#expense-name', name);
  await page.type('#expense-amount', '15.50');
  await page.select('#expense-category', 'Food');
  await page.type('#expense-date', '2025-12-01');
  await page.click('#expense-save-btn');
  await page.waitForSelector(`text/${name}`);
  console.log('Expense added.');

  // Edit expense
  // find the list item that contains the name and click its Edit button
  const items = await page.$$('ul#expenses li');
  let found = false;
  for (const li of items) {
    const txt = await li.evaluate(n => n.innerText);
    if (txt.includes(name)) {
      const handle = await li.evaluateHandle(node => {
        const btn = Array.from(node.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'edit');
        return btn || null;
      });
      const asEl = handle.asElement ? handle.asElement() : null;
      if (asEl) {
        await asEl.click();
        found = true;
        break;
      }
    }
  }
  if (!found) { console.error('Edit button not found'); await browser.close(); process.exit(1); }
  await page.waitForSelector('#expense-id');
  await page.click('#expense-amount', {clickCount: 3});
  await page.type('#expense-amount', '22.00');
  await page.click('#expense-save-btn');
  await page.waitForFunction(() => document.body.innerText.includes('$22.00'));
  console.log('Expense edited.');

  // Delete expense - handle confirm
  page.on('dialog', async dialog => { await dialog.accept(); });
  // find and click delete
  const items2 = await page.$$('ul#expenses li');
  for (const li of items2) {
    const txt = await li.evaluate(n => n.innerText);
    if (txt.includes(name)) {
      const handle = await li.evaluateHandle(node => {
        const btn = Array.from(node.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'delete');
        return btn || null;
      });
      const asEl = handle.asElement ? handle.asElement() : null;
      if (asEl) { await asEl.click(); break; }
    }
  }
  // wait a bit and verify removal
  await new Promise(res => setTimeout(res, 500));
  const present = await page.evaluate((n) => document.body.innerText.includes(n), name);
  if (present) { console.error('Expense still present after delete'); await browser.close(); process.exit(1); }
  console.log('Expense deleted.');

  // Set budget
  await page.type('#budget-limit', '150');
  await page.click('#budget-section .btn-primary');
  await new Promise(res => setTimeout(res, 300));
  console.log('Budget set.');

  // Add reminder with past date to trigger immediate processing
  await page.type('#reminder-name', 'Puppeteer Subscription');
  await page.type('#reminder-amount', '5.99');
  await page.type('#reminder-date', '2025-11-01');
  await page.select('#reminder-frequency', 'Monthly');
  await page.click('#reminder-section .btn');
  await page.waitForFunction(() => document.body.innerText.includes('Puppeteer Subscription'));
  console.log('Reminder added and processed into expense list.');

  console.log('Smoke test completed successfully.');
  await browser.close();
})();
