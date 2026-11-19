import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

/**
 * Captures one screenshot per workspace module in both interface languages.
 * Run against a local dev server started without .env.local so the seeded
 * demo workspace (not live tenant data) fills every screen.
 */
const baseUrl = process.env.NOVA_BASE_URL ?? 'http://127.0.0.1:4173';
const outputRoot = resolve(process.cwd(), '..', 'docs', 'screenshots');

// Every route that renders a workspace module. Detail routes use seeded demo
// IDs so the screenshots show a populated record instead of an empty state.
const modules = [
  { slug: 'overview', path: '/overview' },
  { slug: 'projects', path: '/projects' },
  { slug: 'project-detail', path: '/projects/p-pulse' },
  { slug: 'tasks', path: '/tasks' },
  { slug: 'meetings', path: '/meetings' },
  { slug: 'meeting-detail', path: '/meetings/m-product-sync-past' },
  { slug: 'templates', path: '/templates' },
  { slug: 'calendar', path: '/calendar' },
  { slug: 'search', path: '/search' },
  { slug: 'live', path: '/live' },
  { slug: 'live-room', path: '/live/nova-demo-room' },
  { slug: 'decisions', path: '/decisions' },
  { slug: 'knowledge', path: '/knowledge' },
  { slug: 'workflows', path: '/workflows' },
  { slug: 'integrations', path: '/integrations' },
  { slug: 'intelligence', path: '/intelligence' },
  { slug: 'org-intelligence', path: '/org-intelligence' },
  { slug: 'analytics', path: '/analytics' },
  { slug: 'team', path: '/team' },
  { slug: 'audit', path: '/audit' },
  { slug: 'settings', path: '/settings' },
];

const browser = await chromium.launch({ headless: true });

try {
  for (const locale of ['en', 'tr']) {
    const directory = resolve(outputRoot, locale);
    mkdirSync(directory, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1200 },
      deviceScaleFactor: 1,
      locale: locale === 'tr' ? 'tr-TR' : 'en-US',
    });
    await context.addInitScript((activeLocale) => {
      localStorage.setItem(
        'nova-preferences',
        JSON.stringify({ state: { locale: activeLocale }, version: 0 })
      );
    }, locale);

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));

    for (const module of modules) {
      await page.goto(`${baseUrl}${module.path}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('main', { timeout: 15000 });
      await page.waitForTimeout(700);
      await page.screenshot({
        path: resolve(directory, `${module.slug}.png`),
        fullPage: false,
        animations: 'disabled',
      });
      console.log(`${locale}/${module.slug}.png`);
    }

    if (errors.length > 0) {
      throw new Error(`${locale} page errors: ${errors.join(' | ')}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
