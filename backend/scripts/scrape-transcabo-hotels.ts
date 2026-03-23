import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TARGET_URL = 'https://www.transcabo.com/es';
const OUTPUT_FILE = path.resolve(__dirname, '../data/transcabo-hotels.json');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

interface Hotel {
  nombre: string;
  zona: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeWithRetry(attempt = 1): Promise<Hotel[]> {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-transcabo-'));
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    userDataDir,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`[Attempt ${attempt}] Navigating to ${TARGET_URL} ...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2000);

    // Find all <select> or <optgroup>/<option> structures that contain hotel names
    const hotels: Hotel[] = await page.evaluate(() => {
      const results: { nombre: string; zona: string }[] = [];

      // Strategy 1: <select> with <optgroup label="Zone"> <option>Hotel</option>
      const selects = Array.from(document.querySelectorAll('select'));
      for (const select of selects) {
        const optgroups = Array.from(select.querySelectorAll('optgroup'));
        if (optgroups.length > 0) {
          for (const group of optgroups) {
            const zona = (group.getAttribute('label') || '').trim();
            if (!zona) continue;
            const options = Array.from(group.querySelectorAll('option'));
            for (const opt of options) {
              const nombre = opt.textContent?.trim() || '';
              if (nombre && nombre.length > 1) {
                results.push({ nombre, zona });
              }
            }
          }
        }
      }

      // Strategy 2: flat <select> where zone is indicated by disabled/class options
      if (results.length === 0) {
        for (const select of selects) {
          const options = Array.from(select.querySelectorAll('option'));
          let currentZona = '';
          for (const opt of options) {
            const text = opt.textContent?.trim() || '';
            const isHeader =
              opt.disabled ||
              opt.classList.contains('optgroup') ||
              opt.getAttribute('data-type') === 'zone' ||
              opt.value === '' ||
              opt.value === '0';
            if (isHeader && text) {
              currentZona = text;
            } else if (currentZona && text) {
              results.push({ nombre: text, zona: currentZona });
            }
          }
        }
      }

      return results;
    });

    if (hotels.length > 0) {
      await browser.close();
      return hotels;
    }

    // Strategy 3: look for hotel lists in list elements / divs with data attributes
    console.log('[Info] No hotels found in <select>, trying list/div structures...');
    await sleep(1000);

    const hotelsFromLists: Hotel[] = await page.evaluate(() => {
      const results: { nombre: string; zona: string }[] = [];

      // Common patterns: ul/li with data-zone, or divs with classes
      const zoneContainers = Array.from(
        document.querySelectorAll('[data-zone], [class*="zone"], [class*="zona"]')
      );
      for (const container of zoneContainers) {
        const zona =
          (container as HTMLElement).dataset.zone ||
          (container as HTMLElement).dataset.zona ||
          container.querySelector('h2, h3, h4, .title, .name')?.textContent?.trim() ||
          '';
        if (!zona) continue;
        const items = Array.from(container.querySelectorAll('li, a, [class*="hotel"]'));
        for (const item of items) {
          const nombre = item.textContent?.trim() || '';
          if (nombre && nombre !== zona && nombre.length > 2) {
            results.push({ nombre, zona });
          }
        }
      }

      return results;
    });

    await browser.close();

    if (hotelsFromLists.length === 0 && attempt < MAX_RETRIES) {
      throw new Error('No hotels found in any DOM structure');
    }

    return hotelsFromLists;
  } catch (err) {
    await browser.close();
    if (attempt < MAX_RETRIES) {
      console.warn(`[Warning] Attempt ${attempt} failed: ${(err as Error).message}`);
      console.log(`[Retry] Waiting ${RETRY_DELAY_MS / 1000}s before retry...`);
      await sleep(RETRY_DELAY_MS);
      return scrapeWithRetry(attempt + 1);
    }
    throw err;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log(' Transcabo Hotel Scraper');
  console.log('='.repeat(60));

  const rawHotels = await scrapeWithRetry();

  // Deduplicate
  const seen = new Set<string>();
  const hotels: Hotel[] = [];
  let duplicates = 0;

  for (const h of rawHotels) {
    const key = `${h.nombre.toLowerCase()}|${h.zona.toLowerCase()}`;
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      hotels.push(h);
    }
  }

  // Stats by zone
  const byZone: Record<string, number> = {};
  for (const h of hotels) {
    byZone[h.zona] = (byZone[h.zona] || 0) + 1;
  }

  console.log('\n--- Hotels by zone ---');
  for (const [zona, count] of Object.entries(byZone).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${zona}: ${count} hotels`);
  }

  if (duplicates > 0) {
    console.log(`\n[Dedup] Removed ${duplicates} duplicate entries`);
  }

  console.log(`\nTotal extracted: ${hotels.length} hotels`);

  // Save JSON
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(hotels, null, 2), 'utf-8');
  console.log(`\n✅ Saved to: ${OUTPUT_FILE}`);
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('[Fatal]', err.message || err);
  process.exit(1);
});
