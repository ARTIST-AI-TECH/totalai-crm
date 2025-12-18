## Basic Scraping Steps

The fundamental workflow for a Puppeteer scraper is as follows: 

1. Launch the browser: Start a new browser instance. By default, it runs in headless mode (without a visible UI).
2. Open a new page: Create a new tab or page within the browser instance.
3. Navigate to a URL: Direct the new page to the target website.
4. Wait for content (optional but recommended): Use page.waitForSelector() or page.waitForFunction() to ensure dynamic content has loaded before attempting to scrape it, avoiding hardcoded delays.
5. Extract data: Use methods like page.$eval() or page.$$eval() to run JavaScript code within the page's context and select specific elements/data.
6. Close the browser: Terminate the browser session to free up resources. 
Example: Scraping a Title and URL
This script navigates to a sample blog and extracts the titles and URLs of the first few articles: 

```javascript
import puppeteer from 'puppeteer';
import fs from 'fs'; // Use Node.js file system module for saving data

const url = 'https://hackmamba.io/blog/';

(async () => {
  // 1. Launch the browser
  const browser = await puppeteer.launch({ headless: "new" });
  // 2. Open a new page
  const page = await browser.newPage();
  // 3. Navigate to the URL
  await page.goto(url, { waitUntil: 'domcontentloaded' }); // Wait for HTML to load

  // 4. Extract data within the page's context
  const allArticles = await page.evaluate(() => {
    // Select all elements that contain an article summary
    const articles = document.querySelectorAll('section'); 
    
    // Convert NodeList to an array and map to extract data
    return Array.from(articles).slice(0, 4).map((section) => {
      const title = section.querySelector('h2').innerText; // Use CSS selectors
      const url = section.querySelector('a').href;
      return { title, url };
    });
  });

  console.log(allArticles);

  // 5. Store the scraped data as a JSON object (optional)
  fs.writeFile(`pageData.json`, JSON.stringify(allArticles, null, 2), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Data Scraped and saved to pageData.json`);
    }
  });

  // 6. Close the browser
  await browser.close();
})();
```