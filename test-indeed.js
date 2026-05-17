const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  console.log('Navigating to Indeed...');
  await page.goto('https://in.indeed.com/jobs?q=developer&l=remote', { waitUntil: 'domcontentloaded' });
  
  await page.waitForSelector('.job_seen_beacon, td.resultContent', { timeout: 10000 }).catch(e => console.log('Timeout'));

  const cards = await page.$$('.job_seen_beacon, td.resultContent');
  if (cards.length > 0) {
    const data = await cards[0].evaluate((card) => {
      return { html: card.outerHTML };
    });
    fs.writeFileSync('indeed_card_output.html', data.html, 'utf8');
    console.log('Saved to indeed_card_output.html');
  }

  await browser.close();
})();
