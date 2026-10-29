// Zero-dependency static site builder.
// Renders src/pages/*.html into src/layout.html and writes each page to
// <slug>/index.html so URLs match the original site (e.g. /leagues).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const config = JSON.parse(readFileSync(join(SRC, 'site.json'), 'utf8'));
const layout = readFileSync(join(SRC, 'layout.html'), 'utf8');

// Main navigation. Items with `children` render as accessible disclosure menus.
const NAV = [
  { label: 'Home', slug: '' },
  { label: 'Bowl', slug: 'bowl' },
  {
    label: 'Leagues',
    children: [
      { label: 'Leagues', slug: 'leagues' },
      { label: 'League Standings', slug: 'league-standings' },
      { label: 'Junior Bowling Program', slug: 'junior-bowling-program' },
    ],
  },
  { label: 'Parties', slug: 'parties' },
  { label: 'Golf', slug: 'golf' },
  { label: 'Tournaments', slug: 'tournaments' },
  {
    label: 'Food & Drink',
    children: [
      { label: '59th Avenue Grill', slug: '59th-avenue-grill' },
      { label: 'Sandbagger Lounge', slug: 'sandbagger-lounge' },
    ],
  },
  { label: 'Pro Shop', slug: 'pro-shop' },
];

const escape = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function href(root, slug) {
  return slug ? `${root}${slug}/` : root || './';
}

function renderNav(root, current) {
  return NAV.map((item, i) => {
    if (!item.children) {
      const cur = item.slug === current ? ' aria-current="page"' : '';
      return `<li><a class="nav__link" href="${href(root, item.slug)}"${cur}>${escape(item.label)}</a></li>`;
    }
    const active = item.children.some((c) => c.slug === current);
    const id = `submenu-${i}`;
    const links = item.children
      .map((c) => {
        const cur = c.slug === current ? ' aria-current="page"' : '';
        return `<li><a class="nav__sublink" href="${href(root, c.slug)}"${cur}>${escape(c.label)}</a></li>`;
      })
      .join('');
    return `<li class="nav__group${active ? ' is-active' : ''}">
          <button class="nav__link nav__toggle" type="button" aria-expanded="false" aria-controls="${id}">${escape(item.label)}<svg class="nav__chev" aria-hidden="true" viewBox="0 0 20 20" width="16" height="16"><path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <ul class="nav__submenu" id="${id}" hidden>${links}</ul>
        </li>`;
  }).join('\n        ');
}

function parse(file) {
  const raw = readFileSync(join(SRC, 'pages', file), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = Object.fromEntries(
    m[1].split('\n').filter(Boolean).map((l) => {
      const i = l.indexOf(':');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
  );
  return { meta, body: raw.slice(m[0].length) };
}

const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));

const pages = readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
const sitemap = [];
for (const file of pages) {
  const { meta, body } = parse(file);
  const slug = meta.slug ?? '';
  const isRoot = slug === '' || slug === '404';
  const root = isRoot ? '' : '../';
  const vars = {
    root: root || './',
    assets: `${root}assets`,
    phone: config.phone,
    phoneHref: config.phoneHref,
    formEndpoint: escape(config.formEndpoint || ''),
    year: String(new Date().getFullYear()),
  };
  // 404 is served from arbitrary paths, so it must use absolute URLs.
  if (slug === '404') {
    vars.root = config.basePath;
    vars.assets = `${config.basePath}assets`;
  }
  const navRoot = slug === '404' ? config.basePath : root;
  const title = meta.title ? `${meta.title} | ${config.name}` : `${config.name} | Bowling in Greeley, Colorado`;
  const content = fill(body, vars);
  const html = fill(layout, {
    ...vars,
    title: escape(title),
    description: escape(meta.description || config.description),
    canonical: `${config.url}/${slug && slug !== '404' ? slug : ''}`,
    nav: renderNav(navRoot, slug),
    content,
  });
  const outFile = slug === '' ? 'index.html' : slug === '404' ? '404.html' : join(slug, 'index.html');
  mkdirSync(dirname(join(ROOT, outFile)), { recursive: true });
  writeFileSync(join(ROOT, outFile), html);
  if (slug !== '404') sitemap.push(`${config.url}/${slug}`);
  console.log(`built ${outFile}`);
}

writeFileSync(
  join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .sort()
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
);
console.log('built sitemap.xml');
