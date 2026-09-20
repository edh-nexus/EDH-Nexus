/* ============================================================================
   EDH NEXUS dashboard

   All data lives in the GitHub repo (data/decks.json and data/matches.json) and is
   served by GitHub Pages. This page only ever reads it, so it needs no accounts,
   keys or tokens. admin.html is the only page that writes, and only when it is
   given a fine-grained GitHub token (Contents: Read and write).

   SETUP
     1. Create data/decks.json and data/matches.json in the repo (each is a JSON
        array). admin.html creates them on its first save if they don't exist.
     2. Enable GitHub Pages for the repo (Settings -> Pages -> your branch).
     3. Point GITHUB_DATA_BASE below at the published data folder.
   ============================================================================ */

// Published data folder, including the trailing slash.
const GITHUB_DATA_BASE = 'https://edh-nexus.github.io/EDH-Nexus/data/';

// How long a copy of the data files stays fresh. The data URLs rotate on this interval,
// so a CDN can never hand back a copy older than this.
const DATA_REFRESH_MS = 5 * 60 * 1000;

// While a tab is open and visible it re-checks this often, and never more than once
// per REVALIDATE_MIN_INTERVAL_MS.
const REVALIDATE_POLL_MS = 5 * 60 * 1000;
const REVALIDATE_MIN_INTERVAL_MS = 60 * 1000;

// The local cache lives until the published data changes - it is never expired by age.
const CACHE_KEY_DECKS = 'edh_decks';
const CACHE_KEY_MATCHES = 'edh_matches';
const CACHE_KEY_FINGERPRINT = 'edh_data_fingerprint';

// Fallback artwork for commanders with no stored Scryfall image.
const svgPlaceholder = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 880">' +
  '<rect width="630" height="880" fill="#171a21"/>' +
  '<rect x="24" y="24" width="582" height="832" rx="28" fill="none" stroke="#282d3b" stroke-width="4"/>' +
  '<text x="315" y="455" font-family="sans-serif" font-size="40" fill="#94a3b8" text-anchor="middle">EDH Nexus</text>' +
  '</svg>'
);

// Mana icons as inline SVG, so they never depend on an external host.
const MANA_SVGS = {
  'W': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" version="1.1"><circle cx="300" cy="300" r="300" fill="#fffbd5"/><path d="m586.2 342.4c-39.4-22.2-64.6-33.3-75.7-33.3-8.1 0-14.4 6.2-18.9 18.6-4.5 12.4-13.6 18.5-27.2 18.5-5.6 0-16.9-2-34.1-6-9.6 14.6-14.4 24-14.4 28 0 5.6 4.1 12.1 12.4 19.7 8.3 7.6 15.2 11.3 20.9 11.3 3.6 0 8.5-0.7 14.7-2.3 6.2-1.5 10.3-2.3 12.4-2.3 6.2 0 9.3 11.4 9.3 34.1 0 21.7-5 55-15.1 99.9-13.1-51.5-27-77.2-41.6-77.2-2 0-6.2 1.5-12.5 4.6-6.3 3-11 4.5-14 4.5-14.6 0-27.7-13.4-39.4-40.1-23.2 3.5-34.8 15.4-34.8 35.6 0 10.1 4.7 18.2 14 24.2 9.3 6.1 14 10.4 14 12.9 0 13.6-19.9 34.6-59.8 62.8-21.2 15.1-35.8 25.7-43.9 31.8 7-9.1 14.1-20.9 21.2-35.6 8.1-16.6 12.1-29.5 12.1-38.6 0-5-5.8-12.1-17.4-21.2-11.6-9.1-17.4-18.7-17.4-28.8 0-8.6 3-19.2 9.1-31.8-6.6-7.6-14.4-11.4-23.5-11.4-20.2 0-30.3 6.6-30.3 19.7 0-9.1 0-2.3 0 20.4 0.5 16.7-12.1 25-37.9 25-19.7 0-52.7-4.6-99.2-13.6 52.5-13.1 78.7-28.3 78.7-45.4 0 2-1-4-3-18.2-2-15.6 9.1-29.8 33.3-42.4-4.5-23.2-16.6-34.8-36.3-34.8-3 0-8.6 5.3-16.6 15.9-8.1 10.6-15.6 15.9-22.7 15.9-12.1 0-27.8-13.1-46.9-39.4-9.1-13.1-23-32.5-41.6-58.3 11.6 6.1 23.2 12.1 34.8 18.2 15.1 7.1 27.3 10.6 36.3 10.6 7.1 0 14-6.2 20.8-18.6 6.8-12.4 15.8-18.6 26.9-18.6 1.5 0 11.6 3 30.3 9.1 9.6-14.6 14.4-25.5 14.4-32.6 0-6.1-3.7-13-11-20.8-7.3-7.8-14-11.7-20.1-11.7-2.5 0-6.4 0.8-11.7 2.3-5.3 1.5-9.2 2.3-11.7 2.3-9.1 0-13.6-11.4-13.6-34.1 0-6.1 5.8-40.6 17.4-103.7-0.5 7.6 2.8 21.7 9.8 42.4 8.6 25.2 18.7 37.9 30.3 37.9 2 0 6.1-1.5 12.1-4.5 6.1-3 10.8-4.5 14.4-4.5 11.6 0 21.2 6.6 28.8 19.7l11.4 20.4c10.6 0 19.4-3.8 26.5-11.3 7.1-7.6 10.6-16.7 10.6-27.3 0-11.1-4.7-19.6-14-25.4-9.4-5.8-14-10.2-14-13.2 0-10.6 16.7-28.5 50-53.7 26.7-20.2 44.2-32 52.2-35.6-21.7 29.3-32.6 50.7-32.6 64.3 0 7.1 4.3 14.6 12.9 22.7 10.6 9.6 16.7 16.4 18.2 20.4 5 11.6 4.5 27.5-1.5 47.7 13.6 9.6 24 14.4 31 14.4 14.6 0 21.9-7.6 21.9-22.7 0-1.5-0.6-6.3-1.9-14.4-1.3-8.1-1.6-12.6-1.1-13.6 2-7.1 15.9-10.6 41.6-10.6 16.2 0 49.7 4.5 100.7 13.6-11.1 3-27.8 7.6-50 13.6-20.2 6.1-30.3 12.9-30.3 20.4 0 3.5 1.3 9.6 3.8 18.2 2.5 8.6 3.8 14.9 3.8 18.9 0 7.1-4.5 13.6-13.6 19.7l-25.7 18.2c6.1 11.1 10.1 17.7 12.1 19.7 5 6.1 11.9 9.1 20.4 9.1 6.1 0 11.6-5.3 16.7-15.9 5-10.6 13.1-15.9 24.2-15.9 13.6 0 29 12.6 46.2 37.9 9.6 14.2 24.5 35.6 44.6 64.4m-168-43.9c0-32.3-11.9-60.3-35.6-84-23.7-23.7-51.7-35.6-84-35.6-32.8 0-61.1 11.7-84.8 35.2-23.7 23.5-35.8 51.6-36.3 84.4-0.5 32.3 11.5 60.2 36 83.6 24.5 23.5 52.9 35.2 85.2 35.2 34.3 0 63-11.2 85.9-33.7 23-22.4 34.2-50.8 33.7-85.1m-11.4 0c0 30.8-10.3 56.3-31 76.4-20.7 20.2-46.4 30.3-77.2 30.3-29.8 0-55.3-10.3-76.4-31-21.2-20.7-31.8-45.9-31.8-75.7 0-29.3 10.7-54.4 32.2-75.3 21.5-20.9 46.8-31.4 76.1-31.4 29.3 0 54.6 10.6 76.1 31.8 21.4 21.2 32.2 46.2 32.2 74.9" fill="#211d15"/></svg>',
  'U': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><circle cx="300" cy="300" r="300" fill="#aae0fa"/><path d="m546.93 375.53c-28.722 29.23-64.1 43.842-106.13 43.842-47.17 0-84.59-16.14-112.27-48.44-26.15-30.762-39.22-69.972-39.22-117.64 0-51.26 22.302-109.72 66.9-175.34 36.38-53.814 79.19-100.98 128.41-141.48-7.182 32.814-10.758 56.13-10.758 69.972 0 31.794 9.984 62.802 29.976 93.05 24.612 35.88 43.31 62.56 56.14 79.968 19.992 30.26 29.988 59.73 29.988 88.42.001 42.558-14.346 78.44-43.04 107.65m-.774-164.17c-7.686-17.17-16.662-28.572-26.916-34.22 1.536 3.084 2.31 7.44 2.31 13.08 0 10.77-3.072 26.14-9.234 46.13l-9.984 30.762c0 17.94 8.952 26.916 26.904 26.916 18.96 0 28.452-12.57 28.452-37.686 0-12.804-3.84-27.792-11.532-44.988" fill="#061922" transform="translate(-142.01 126.79)"/></svg>',
  'B': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" version="1.1"><circle cx="300" cy="300" r="300" fill="#cbc2bf"/><path d="m544.2 291.7c0 33.1-12 55.7-36.1 67.7-7 3.5-29.1 8.3-66.2 14.3-24.1 4-36.1 13.3-36.1 27.8l0 60.9c0 2.5 0.8 10.3 2.3 23.3l2.3 24.1c0 7.5-1.8 19.8-5.3 36.9-9.5 2-20.6 4.3-33.1 6.8-4-15.1-6-25.3-6-30.9 0-2.5 0.6-6.3 1.9-11.3 1.2-5 1.9-8.8 1.9-11.3 0-3.5-3.1-13.3-9.4-29.3l-11.7 0c-1.5 2.5-2.1 5.8-1.6 9.8 2 8.5 2.8 15.8 2.3 21.8-8.5 6-20.3 14.1-35.4 24.1-3.5-1-4.8-1.5-3.8-1.5l0-53.4c-1-2.5-3.5-3.5-7.5-3l-9 0-9 70.7c-7 0.5-15.6 0.5-25.6 0-3.5-16.5-9.8-41.1-18.8-73.7l-6 0c-5.5 17.6-8.5 27.1-9 28.6 0 2 0.6 5.9 1.9 11.7 1.2 5.8 1.9 9.7 1.9 11.7 0 1.5-0.5 5.3-1.5 11.3l-2.3 18.1c-1 1-2.3 1.5-3.8 1.5-15 0-25.1-3.8-30.1-11.3-5-7.5-7-18.1-6-31.6l6-90.3c0-1.5 0.5-3.5 1.5-6 1-2.5 1.5-4.3 1.5-5.3 0-4-4.3-12-12.8-24.1-1.5-0.5-9.3-2.3-23.3-5.3-8.5-2-25.3-5.5-50.4-10.5-34.6-6.5-51.9-34.3-51.9-83.5 0-73.2 30.1-134.2 90.3-182.8 2.5 13.5 6.8 31.6 12.8 54.2 4.5 1 14.3 3.3 29.3 6.8 3 1 18.3 6.5 45.9 16.6-14.1-8.5-32.4-22.3-54.9-41.4-8.5-10-12.8-26.8-12.8-50.4 0-5.5 9.5-12 28.6-19.6 17-7 29.9-11 38.4-12 27.1-3.5 47.9-5.3 62.5-5.3 62.7 0 113.4 16.1 152 48.2-12.5 14.6-34.1 30.1-64.7 46.6 12.1 0.5 29.6-4.2 52.7-14.3 23.1-10 32.9-15 29.3-15 4 0 12.1 8 24.1 24.1 9 12 16.3 22.8 21.8 32.4 16 28.6 26.8 59.5 32.4 92.6 0 11.6 0.2 19.8 0.8 24.8l0 6 0 0zm-288.2 13.5c0-21.6-9.4-42-28.2-61.3-18.8-19.3-39-29-60.6-29-19.1 0-35.9 8.1-50.4 24.2-14.6 16.2-21.8 34.1-21.8 53.8 0 17.2 8.3 28.3 24.8 33.3 10.5 3 25.3 4.8 44.4 5.3l41.4 0c33.6 0.5 50.4-8.3 50.4-26.3m82 93.3 0-23.3c-3.5-6.5-7-13.3-10.5-20.3-3-10-8.5-24.1-16.6-42.1l-8.3 88c0 7-1.5 10.5-4.5 10.5-2 0-3.5-0.5-4.5-1.5-3.5-53.2-5.3-76.2-5.3-69.2l0-26.3c-1-1.5-2.2-2.3-3.7-2.3-17.1 17.6-25.6 45.9-25.6 85 0 21.6 2 34.9 6 39.9 4-1 8.5-2.8 13.5-5.3 2-1 7.8-1.5 17.3-1.5 9.5 0 21.1 3 34.6 9 5 0 7.5-13.5 7.5-40.6m170.1-104.8c0-20.2-7.5-38.2-22.6-54.1-15.1-15.9-32.4-23.8-51.9-23.8-21.1 0-40.8 9.6-59.1 29-18.3 19.3-27.5 39.5-27.5 60.6 0 17.6 8.5 26.3 25.6 26.3l86.5 0c32.6-0.5 48.9-13.1 48.9-37.9" fill="#130c0e"/></svg>',
  'R': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" version="1.1"><circle cx="300" cy="300" r="300" fill="#f9aa8f"/><path d="m551.8 399.7c-22.4 53.5-67 80.2-133.6 80.2-12.2 0-25.5 1.5-39.7 4.6-21.4 4.6-32.1 11-32.1 19.1 0 2.5 1.8 5.5 5.3 8.8 3.6 3.3 6.6 5 9.2 5-12.7 0-4.1 0.4 26 1.1 30.1 0.8 48.9 1.1 56.5 1.1-44.3 26-118.4 37.9-222.3 35.9-34.1-0.5-63.4-15.5-87.8-45.1-24-28-35.9-59.3-35.9-93.9 0-36.6 12.3-67.8 37.1-93.6 24.7-25.7 55.4-38.6 92-38.6 8.1 0 19 1.8 32.5 5.3 13.5 3.6 22.5 5.3 27.1 5.3 18.8 0 42.3-7.8 70.3-23.3 28-15.5 41.3-23.3 39.7-23.3-5.1 53.5-22.9 89.4-53.5 107.7-21.9 12.7-32.8 25.2-32.8 37.4 0 7.6 4.6 13.8 13.7 18.3 7.1 3.6 15 5.4 23.7 5.4 13.2 0 26.2-8.1 39-24.4 12.7-16.3 18.3-31.1 16.8-44.3-1.5-15.3-0.5-33.6 3.1-55 1-6.1 4.7-13.6 11.1-22.5 6.4-8.9 12.1-14.4 17.2-16.4 0 4.6-1.6 12.2-5 22.9-3.3 10.7-5 18.6-5 23.7 0 11.2 3 19.9 9.2 26 9.2-3.6 17.3-15 24.4-34.4 6.1-14.8 9.7-29 10.7-42.8-21.4-1-41.9-10.7-61.5-29-19.6-18.3-29.4-38.2-29.4-59.6 0-3.6 0.5-7.1 1.5-10.7 3 4.6 7.6 11.7 13.7 21.4 8.7 12.7 15.3 19.1 19.9 19.1 6.1 0 9.2-6.4 9.2-19.1 0-16.3-4.3-31.1-13-44.3-9.7-15.8-22.2-23.7-37.4-23.7-7.1 0-17.8 3.8-32.1 11.5-14.3 7.6-27.3 11.5-39 11.5-3.6 0-19.4-4.6-47.4-13.8 49.4-8.1 74.1-15.5 74.1-22.1 0-17.3-33.9-29-101.6-35.1-6.6-0.5-18.8-1.5-36.7-3.1 2-2.5 16.5-5.3 43.5-8.4 22.9-2.5 39-3.8 48.1-3.8 121.2 0 198.1 58.8 230.7 176.5 5.6-4.6 8.4-12.4 8.4-23.2 0-13.9-4.1-31.5-12.2-52.7-3.1-8.2-7.9-20.6-14.5-37.2 41.7 53.2 62.6 103.6 62.6 151.2 0 25.1-5.9 47.8-17.6 68.3-7.6 13.8-21.9 31.5-42.8 53-20.9 21.5-35.1 38.1-42.8 49.9 28-7.6 46.4-13.5 55-17.6 19.3-8.6 36.9-21.6 52.7-39 0 6.6-2.8 16.6-8.4 29.8M218.8 99.5c0 9.2-5.1 15-15.3 17.6l-19.9 3.1c-7.1 3.6-17.6 17.6-31.3 42-1.5-7.6-3.8-18.3-6.9-32.1-4.6 0.5-12.2 4.6-22.9 12.2-4.6 3.6-12 8.9-22.2 16 3.1-18.3 13.2-36.9 30.6-55.8 18.3-20.9 36.2-31.3 53.5-31.3 22.9 0 34.4 9.4 34.4 28.3m132.9 70.3c0 8.7-4.7 15.9-14.1 21.8-9.4 5.9-18.7 8.8-27.9 8.8-12.2 0-23.2-6.9-32.8-20.6-11.7-16.8-23.7-27.7-35.9-32.9 2.5-2.5 5.6-3.8 9.2-3.8 4.6 0 12.3 3.6 23.3 10.7 10.9 7.1 17.9 10.7 21 10.7 2.5 0 6.7-3.6 12.6-10.7 5.9-7.1 12.3-10.7 19.5-10.7 16.8 0 25.2 8.9 25.2 26.7" fill="#200000"/></svg>',
  'G': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" version="1.1"><circle cx="300" cy="300" r="300" fill="#9bd3ae"/><path d="m562.6 337.4c0 10-3.9 19-11.6 27-7.7 8-16.6 12-26.6 12-16 0-27.7-7.5-35.2-22.5l-35.2-1.5c-7.5 0-22.3 3.3-44.2 9.8-23.5 6.5-37 11.7-40.5 15.7-5.5 6-10 20-13.5 42-3 18-4.5 31.2-4.5 39.7 0 13.5 2.1 23.4 6.4 29.6 4.3 6.2 13 11.5 26.2 15.7 13.2 4.2 21.4 6.6 24.4 7.1 2 0 5.2-0.2 9.8-0.7l9 0c6.5 0 13.2 1 20.2 3 10 3 14.3 7 12.8 12-7-1-19.2 0.5-36.7 4.5l21 10.5c0 6-8.5 9-25.5 9-4.5 0-10.6-1-18.4-3-7.7-2-12.9-3-15.4-3l-9.7 0c-0.5 5-2 12.5-4.5 22.5-8.5-0.5-18.5-5.5-30-15-11.5-9.5-18.7-14.2-21.7-14.2-3 0-7.3 4.8-12.7 14.2-5.5 9.5-8.2 16-8.2 19.5-6.5-3.5-12-10-16.5-19.5-2-6.5-4.2-13-6.7-19.5-5 0.5-14.2 11-27.7 31.5l-3.8 0c-1-1.5-4.8-12-11.2-31.5-15.5-5-30-7.5-43.5-7.5-6.5 0-16.5 1.5-30 4.5l-21-1.5c3-3 11.7-8.7 26.2-17.2 17-10 30-15 39-15 1.5 0 3.5 0.3 6 0.8 2.5 0.5 4.5 0.8 6 0.8 3.5 0 9.1-1.9 16.9-5.6 7.7-3.7 12.2-7.1 13.5-10.1 1.3-3 1.9-10.8 1.9-23.2 0-28.5-7.5-49.7-22.5-63.7-13-12.5-34.5-21.5-64.5-27-8 28.5-30.5 42.7-67.4 42.7-12 0-24-7.2-36-21.7C44.7 373.8 38.7 360.6 38.7 348.6c0-18.5 7.7-33.7 23.2-45.7-12.5-13-18.7-26.2-18.7-39.7 0-12.5 3.9-23.5 11.6-33 7.7-9.5 17.9-15 30.4-16.5-1-16 4.2-27 15.7-33-5.5-5.5-8.2-15.2-8.2-29.2 0-16.5 5.5-30.2 16.5-41.2 11-11 24.7-16.5 41.2-16.5 18 0 32.7 6.3 44.2 18.8 14.5-49.5 45.7-74.2 93.7-74.2 25 0 47 10 66 30 7 7.5 10.5 11.5 10.5 12-6 0-3-1.1 9-3.4 12-2.2 20.7-3.4 26.2-3.4 19.5 0 36.7 7.2 51.7 21.7 13 13 22 29.5 27 49.5 3.5 0.5 9 2 16.5 4.5 11 5.5 16.5 15 16.5 28.5 0 2.5-2 7.3-6 14.2 32 18 48 43 48 75 0 9-3.5 21.5-10.5 37.5 13 7.5 19.5 18.5 19.5 33m-308.8 33 0-9.7c0-11.5-5.6-22-16.9-31.5-11.2-9.5-22.6-14.2-34.1-14.2-14 0-27 3.2-39 9.7 26.5-1.5 56.5 13.8 89.9 45.7m-13.5-92.9c-7.5-8.5-14-17.2-19.5-26.2-21 5.5-31.5 11.7-31.5 18.7 6-0.5 14.7 0.6 26.2 3.4 11.5 2.8 19.7 4.1 24.8 4.1m45.7-23.2 0-33c-12-2-19.3-3-21.7-3l0 11.2 21.7 24.7m97.4-21c-6-2.5-17.2-7.5-33.7-15l0 64.5c23.5-13.5 34.7-30 33.7-49.5m41.2 88.5-16.5-20.2c-10 7-20.1 14.1-30.4 21.4-10.3 7.2-19.1 15.4-26.6 24.4 22.5-12 47-20.5 73.4-25.5" fill="#00160b"/></svg>',
  'C': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><circle cx="300" cy="300" r="300" fill="#ccc2c0"/><path d="M300 60A500 500 0 0 0 540 300 500 500 0 0 0 300 540 500 500 0 0 0 60 300 500 500 0 0 0 300 60m0 90A300 300 0 0 1 150 300 300 300 0 0 1 300 450 300 300 0 0 1 450 300 300 300 0 0 1 300 150" fill="#130c0e"/></svg>'
};

/* ============================================================================
   SHARED HELPERS
   ============================================================================ */

// Renders a colour identity string such as "WUB" as mana icons. Empty means colourless.
function renderManaSymbols(colorIdentityStr) {
  const colors = String(colorIdentityStr || '').toUpperCase().replace(/[^WUBRGC]/g, '').split('');
  if (colors.length === 0) colors.push('C');

  const icons = colors.map(c => MANA_SVGS[c] || MANA_SVGS.C).join('');
  return `<div class="mana-container">${icons}</div>`;
}

// Older data used other key names for the artwork. The first one holding a URL wins.
const ART1_KEYS = ['artUrl1', 'artUrl', 'image', 'art_url', 'scryfallCrop', 'commanderArt1'];
const ART2_KEYS = ['artUrl2', 'image2', 'art_url2', 'scryfallCrop2', 'commanderArt2'];

function getArtUrl(deck, keys) {
  for (const key of keys) {
    const value = deck[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return '';
}

// Scryfall serves the full card image; the art crop is the picture alone.
function toArtCrop(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/grid/', '/art/').replace('/normal/', '/art/').replace('/large/', '/art/');
}

// 1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th, 11 -> 11th ...
function ordinal(value) {
  const n = Number(value) || 0;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;

  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function escapeHTML(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Makes a value safe inside single quotes in an inline onclick attribute.
function toJsString(value) {
  const raw = String(value === undefined || value === null ? '' : value);
  return escapeHTML(raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
}

/* ============================================================================
   STATE
   ============================================================================ */

let rawDecks = [];
let rawMatches = [];
let playerProcessedDecks = [];
let selectedDeckIndex = 0;
let activePlayerName = '';
let activeTab = 'players';
let leaderboardEntity = 'players'; // 'players' | 'decks'
let leaderboardSort = 'wins';

let autoRefreshTimer = null;
let revalidateInFlight = false;
let lastRevalidateAt = 0;
let storageSyncTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  registerSyncListeners();
  await loadDatabase();
});

/* ============================================================================
   DATA SYNC
   The copy cached in localStorage renders immediately and is then verified in the
   background. The cache and the screen are rewritten only when the published data
   has actually changed.
   ============================================================================ */

// FNV-1a 32 bit - fast, stable, and plenty for "did the content change?" checks.
function hashString(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function dataFingerprint(decks, matches) {
  return hashString(JSON.stringify(decks)) + '.' + hashString(JSON.stringify(matches));
}

function readCache() {
  const cachedDecks = localStorage.getItem(CACHE_KEY_DECKS);
  const cachedMatches = localStorage.getItem(CACHE_KEY_MATCHES);
  if (!cachedDecks || !cachedMatches) return null;

  try {
    return {
      decks: JSON.parse(cachedDecks),
      matches: JSON.parse(cachedMatches)
    };
  } catch (e) {
    console.warn('Failed to parse cached local data, fetching fresh...', e);
    return null;
  }
}

function writeCache(decks, matches) {
  rawDecks = decks;
  rawMatches = matches;

  localStorage.setItem(CACHE_KEY_DECKS, JSON.stringify(decks));
  localStorage.setItem(CACHE_KEY_MATCHES, JSON.stringify(matches));
  localStorage.setItem(CACHE_KEY_FINGERPRINT, dataFingerprint(decks, matches));
}

// The ?t= value changes on every DATA_REFRESH_MS boundary. GitHub Pages caches files at its
// edge for 10 minutes, so a new query value guarantees the current file rather than a cached
// copy, with no API call and no token.
function dataFileUrl(fileName) {
  const bucket = Math.floor(Date.now() / DATA_REFRESH_MS);
  return `${GITHUB_DATA_BASE}${fileName}?t=${bucket}`;
}

async function fetchDatabaseFiles() {
  const [decksRes, matchesRes] = await Promise.all([
    fetch(dataFileUrl('decks.json'), { cache: 'no-cache' }),
    fetch(dataFileUrl('matches.json'), { cache: 'no-cache' })
  ]);

  if (!decksRes.ok || !matchesRes.ok) throw new Error('Could not fetch the published data files.');

  const decks = await decksRes.json();
  const matches = await matchesRes.json();

  return {
    decks: Array.isArray(decks) ? decks : [],
    matches: Array.isArray(matches) ? matches : []
  };
}

async function loadDatabase() {
  const loadingEl = document.getElementById('loading');
  const cached = readCache();

  // Cached data paints instantly; whether it is still current is checked in the background.
  if (cached) {
    loadingEl.style.display = 'none';
    rawDecks = cached.decks;
    rawMatches = cached.matches;
    refreshActiveView();
    scheduleAutoRefresh();
    revalidateInBackground(true);
    return;
  }

  loadingEl.style.display = 'block';
  loadingEl.innerText = 'Loading EDH Nexus database...';

  try {
    const data = await fetchDatabaseFiles();
    writeCache(data.decks, data.matches);
    reapplyActiveView();
    scheduleAutoRefresh();
  } catch (err) {
    console.error(err);
    loadingEl.innerText = 'Error loading EDH Nexus data.';
  }
}

// Re-checks periodically, but only while the tab is open and visible, so a parked device
// or a background tab never spends data on polling.
function scheduleAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => revalidateInBackground(), REVALIDATE_POLL_MS);
}

function registerSyncListeners() {
  // The best moment to check for changes is when someone looks at the app again.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) revalidateInBackground();
  });

  window.addEventListener('focus', () => revalidateInBackground());

  // Another tab on this device refreshed the cache: pick it up with no network. Debounced so
  // a burst of cache writes is read once, after the last one has landed.
  window.addEventListener('storage', event => {
    if (event.key !== CACHE_KEY_DECKS && event.key !== CACHE_KEY_MATCHES) return;

    if (storageSyncTimer) clearTimeout(storageSyncTimer);
    storageSyncTimer = setTimeout(() => {
      const cached = readCache();
      if (!cached) return;

      rawDecks = cached.decks;
      rawMatches = cached.matches;
      reapplyActiveView();
    }, 50);
  });
}

// Fetches the published data and refreshes the cache and screen only if it changed.
async function revalidateInBackground(skipThrottle = false) {
  if (revalidateInFlight || document.hidden) return;

  const now = Date.now();
  if (!skipThrottle && (now - lastRevalidateAt) < REVALIDATE_MIN_INTERVAL_MS) return;

  revalidateInFlight = true;
  lastRevalidateAt = now;

  try {
    const data = await fetchDatabaseFiles();
    const freshFingerprint = dataFingerprint(data.decks, data.matches);

    // Identical content: leave the cache and the rendered screen alone.
    if (freshFingerprint === (localStorage.getItem(CACHE_KEY_FINGERPRINT) || '')) return;

    writeCache(data.decks, data.matches);
    reapplyActiveView();
  } catch (err) {
    console.error('Background sync failed:', err);
  } finally {
    revalidateInFlight = false;
  }
}

/* ============================================================================
   VIEWS
   ============================================================================ */

// Draws the current tab from scratch. Used for the first paint from the cache.
function refreshActiveView() {
  if (activeTab === 'leaderboard') {
    renderLeaderboard();
  } else {
    showPlayerSelection();
  }
}

// Re-renders the current screen after new data arrives, keeping the user's place
// (same tab, same player, same deck).
function reapplyActiveView() {
  if (activeTab === 'leaderboard') {
    renderLeaderboard();
    return;
  }

  if (!activePlayerName) {
    showPlayerSelection();
    return;
  }

  const previousDeck = playerProcessedDecks[selectedDeckIndex];
  const previousLabel = previousDeck && !previousDeck.isOverall ? previousDeck.label : '';

  playerProcessedDecks = processPlayerData(activePlayerName);

  let restoredIndex = 0;
  if (previousLabel) {
    const matchIndex = playerProcessedDecks.findIndex(d => !d.isOverall && d.label === previousLabel);
    if (matchIndex > -1) restoredIndex = matchIndex;
  }

  selectedDeckIndex = restoredIndex;
  renderDashboard(playerProcessedDecks[restoredIndex]);
}

function updateTabButtons() {
  const playersBtn = document.getElementById('tabBtnPlayers');
  const leaderboardBtn = document.getElementById('tabBtnLeaderboard');
  if (playersBtn) playersBtn.classList.toggle('active', activeTab === 'players');
  if (leaderboardBtn) leaderboardBtn.classList.toggle('active', activeTab === 'leaderboard');
}

function switchTab(tab) {
  activeTab = tab;
  updateTabButtons();

  if (tab === 'leaderboard') {
    document.getElementById('playerSelectionView').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('historyCard').style.display = 'none';
    document.getElementById('backToPlayersBtn').style.display = 'none';
    document.getElementById('selectDeckBtn').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    renderLeaderboard();
    document.getElementById('leaderboardView').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  document.getElementById('leaderboardView').style.display = 'none';
  showPlayerSelection();
}

/* ============================================================================
   PLAYERS TAB
   ============================================================================ */

function showPlayerSelection() {
  activePlayerName = '';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('historyCard').style.display = 'none';
  document.getElementById('backToPlayersBtn').style.display = 'none';
  document.getElementById('selectDeckBtn').style.display = 'none';
  document.getElementById('leaderboardView').style.display = 'none';

  const playerGrid = document.getElementById('playerGrid');
  playerGrid.innerHTML = '';

  const uniquePlayers = [...new Set(rawDecks.map(d => d.player))].sort();

  uniquePlayers.forEach(player => {
    // The first entry is the player's overall profile, which carries their most-played art.
    const profile = processPlayerData(player)[0];
    const artCropUrl = toArtCrop(profile.artUrl1 || svgPlaceholder);

    const card = document.createElement('div');
    card.className = 'playerCard';
    card.onclick = () => selectPlayer(player);

    card.innerHTML = `
      <div class="card-left-column" style="background-image: url('${artCropUrl}')">
        <div class="card-left-info">
            <div class="player-name-title">${player}</div>
            <div class="playerManaRow">${renderManaSymbols(profile.colorIdentity)}</div>
        </div>
      </div>

      <div class="card-right-column">
        <div class="card-right-stats">
            <div class="stat-box">
              <span class="stat-value">${profile.totalGames}</span>
              <span class="stat-label">GAMES</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-box">
              <span class="stat-value win-color">${profile.winRate}</span>
              <span class="stat-label">WIN RATE</span>
            </div>
        </div>
      </div>
    `;

    playerGrid.appendChild(card);
  });

  document.getElementById('playerSelectionView').style.display = 'block';
}

function selectPlayer(playerName) {
  activePlayerName = playerName;
  activeTab = 'players';
  updateTabButtons();
  document.getElementById('playerSelectionView').style.display = 'none';
  document.getElementById('leaderboardView').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
  document.getElementById('loading').innerText = `Calculating stats for ${playerName}...`;

  playerProcessedDecks = processPlayerData(playerName);
  selectedDeckIndex = 0;

  document.getElementById('backToPlayersBtn').style.display = 'inline-flex';
  document.getElementById('selectDeckBtn').style.display = 'inline-flex';
  document.getElementById('selectDeckBtn').disabled = false;

  renderDashboard(playerProcessedDecks[0]);
}

function togglePartnerStack() {
  const container = document.getElementById('artContainer');
  if (container.classList.contains('has-partner')) {
    container.classList.toggle('swapped');
  }
}

/* --- deck picker modal --- */

function openDeckModal() {
  if (!activePlayerName) return;

  document.getElementById('modalTitle').innerText = `${activePlayerName}'s Decks`;
  document.getElementById('deckSearchInput').value = '';

  renderDeckGrid(playerProcessedDecks);
  document.getElementById('deckModal').style.display = 'flex';
  document.getElementById('deckSearchInput').focus();
}

function closeDeckModal() {
  document.getElementById('deckModal').style.display = 'none';
}

// Clicking the dimmed backdrop closes the modal.
window.onclick = function (event) {
  if (event.target === document.getElementById('deckModal')) closeDeckModal();
};

function renderDeckGrid(decks) {
  const grid = document.getElementById('deckGrid');
  grid.innerHTML = '';

  if (decks.length === 0) {
    grid.innerHTML = '<div style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 20px;">No matching decks found.</div>';
    return;
  }

  decks.forEach(deck => {
    const realIndex = playerProcessedDecks.indexOf(deck);
    const tile = document.createElement('div');
    tile.className = `deck-tile ${realIndex === selectedDeckIndex ? 'active' : ''}`;
    tile.onclick = () => selectDeckFromModal(realIndex);

    const hasPartner = Boolean(deck.commander2 && deck.commander2 !== 'None' && deck.artUrl2);
    const fallback = 'onerror="this.onerror=null; this.src=svgPlaceholder;"';

    const artHTML = hasPartner
      ? `
        <div class="tile-art-wrapper is-partner">
          <img src="${deck.artUrl1}" class="partner-tile-art art-c1" alt="${deck.commander1}" ${fallback}/>
          <img src="${deck.artUrl2}" class="partner-tile-art art-c2" alt="${deck.commander2}" ${fallback}/>
        </div>`
      : `
        <div class="tile-art-wrapper">
          <img src="${deck.artUrl1}" class="tile-art" alt="${deck.label}" ${fallback}/>
        </div>`;

    tile.innerHTML = `
      ${artHTML}
      <div class="tile-body">
        <div class="deck-tile-title">${deck.label}</div>
        <div class="deck-tile-footer">
          ${renderManaSymbols(deck.colorIdentity)}
          <span style="font-weight: 500;">${deck.totalGames} Games <span style="color: var(--win-color); font-weight: bold; margin-left: 2px;">(${deck.winRate})</span></span>
        </div>
      </div>
    `;

    grid.appendChild(tile);
  });
}

function filterDeckGrid() {
  const query = document.getElementById('deckSearchInput').value.toLowerCase().trim();
  const filtered = playerProcessedDecks.filter(d =>
    d.label.toLowerCase().includes(query) ||
    d.commander1.toLowerCase().includes(query) ||
    d.commander2.toLowerCase().includes(query) ||
    d.colorIdentity.toLowerCase().includes(query)
  );
  renderDeckGrid(filtered);
}

function selectDeckFromModal(index) {
  if (!playerProcessedDecks[index]) return;
  selectedDeckIndex = index;
  renderDashboard(playerProcessedDecks[index]);
  closeDeckModal();
}

/* ============================================================================
   PLAYER STATS
   ============================================================================ */

// Totals for a list of a player's matches (one deck's, or all of them).
function summarizeMatches(matches) {
  const totalGames = matches.length;
  const wins = matches.filter(m => Number(m.position) === 1).length;

  let posSum = 0;
  let kills = 0;
  let selfKills = 0;
  let firstBloods = 0;
  matches.forEach(m => {
    posSum += Number(m.position || 0);
    kills += Number(m.kills || 0);
    selfKills += Number(m.selfKill || 0);
    if (m.gotFirstBlood) firstBloods += 1;
  });

  const winRateNum = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  return {
    totalGames: totalGames,
    wins: wins,
    kills: kills,
    selfKills: selfKills,
    firstBloods: firstBloods,
    winRateNum: winRateNum,
    winsLosses: `${wins} / ${totalGames - wins}`,
    winRate: winRateNum.toFixed(1) + '%',
    avgPos: totalGames > 0 ? (posSum / totalGames).toFixed(1) : 'N/A',
    recentMatches: matches.slice(-5).reverse()
  };
}

// Returns the player's overall profile first, followed by one entry per registered deck.
function processPlayerData(playerName) {
  const targetPlayer = playerName.toLowerCase();
  const playerDecks = rawDecks.filter(d => d.player.toLowerCase() === targetPlayer);

  const playerMatches = rawMatches.map(m => {
    const seatIdx = Array.isArray(m.players)
      ? m.players.findIndex(p => p.player.toLowerCase() === targetPlayer)
      : -1;
    if (seatIdx === -1) return null;

    const entry = m.players[seatIdx];
    const matchKills = resolveMatchKills(m);
    const selfKill = matchKills.selfKills[seatIdx] || 0;

    return {
      gameId: m.gameId,
      date: m.date,
      commander: entry.commander,
      position: entry.position,
      kills: matchKills.kills[seatIdx] || 0,
      selfKill: selfKill,
      killedBy: selfKill ? '' : (entry.killedBy || ''),
      killedByCommander: selfKill ? '' : (entry.killedByCommander || ''),
      firstBlood: m.firstBlood || null,
      gotFirstBlood: isFirstBloodFor(m.firstBlood, entry.player, entry.commander),
      pod: m.players,
      podKills: matchKills.kills,
      podSelfKills: matchKills.selfKills
    };
  }).filter(Boolean);

  const processed = playerDecks.map(deck => {
    const c1 = deck.commander1 ? deck.commander1.trim() : (deck.commander || '');
    const c2 = deck.commander2 && deck.commander2 !== 'None' ? deck.commander2.trim() : '';
    const hasPartner = c2 !== '';
    const combinedLabel = deck.label || (hasPartner ? `${c1} & ${c2}` : c1);

    // A game can be logged under the combined label, the primary or the partner name.
    const deckMatches = playerMatches.filter(m => {
      const logged = m.commander.toLowerCase().trim();
      return logged === c1.toLowerCase() || (hasPartner && logged === c2.toLowerCase()) || logged === combinedLabel.toLowerCase();
    });

    return Object.assign({
      commander1: c1,
      commander2: c2,
      label: combinedLabel,
      artUrl1: getArtUrl(deck, ART1_KEYS) || svgPlaceholder,
      artUrl2: getArtUrl(deck, ART2_KEYS),
      colorIdentity: deck.colorIdentity || 'C'
    }, summarizeMatches(deckMatches));
  });

  // The overall profile borrows its artwork and colours from the most-played deck.
  const sortedByGames = [...processed].sort((a, b) => {
    if (b.totalGames === a.totalGames) return b.winRateNum - a.winRateNum;
    return b.totalGames - a.totalGames;
  });
  const topDeck = sortedByGames.length > 0 && sortedByGames[0].totalGames > 0 ? sortedByGames[0] : (processed[0] || null);

  const overallProfile = Object.assign({
    isOverall: true,
    commander1: topDeck ? topDeck.commander1 : `${playerName}'s Career`,
    commander2: topDeck ? topDeck.commander2 : '',
    label: 'Overall Player Profile',
    artUrl1: topDeck ? topDeck.artUrl1 : svgPlaceholder,
    artUrl2: topDeck ? topDeck.artUrl2 : '',
    colorIdentity: topDeck ? topDeck.colorIdentity : 'WUBRG'
  }, summarizeMatches(playerMatches));

  return [overallProfile, ...processed];
}

function renderDashboard(data) {
  const artContainer = document.getElementById('artContainer');
  const art1 = document.getElementById('commanderArt1');
  const art2 = document.getElementById('commanderArt2');

  document.getElementById('commanderCardHeader').innerText =
    data.isOverall ? `${activePlayerName}'s Career Profile` : `${activePlayerName}'s Active Commander`;

  artContainer.classList.remove('swapped');
  art1.src = data.artUrl1 || svgPlaceholder;

  if (data.commander2 && data.artUrl2) {
    art2.src = data.artUrl2;
    art2.style.display = 'block';
    artContainer.classList.add('has-partner');
    art1.className = 'stacked-card partner-c1';
  } else {
    art2.style.display = 'none';
    artContainer.classList.remove('has-partner');
    art1.className = 'single-art';
  }

  document.getElementById('colorIdentityDisplay').innerHTML = renderManaSymbols(data.colorIdentity);
  document.getElementById('totalGames').innerText = data.totalGames;
  document.getElementById('winsLosses').innerText = data.winsLosses;
  document.getElementById('winRate').innerText = data.winRate;
  document.getElementById('avgPos').innerText = data.avgPos;
  document.getElementById('totalFirstBloods').innerText = Number(data.firstBloods || 0);

  const kills = Number(data.kills || 0);
  const killNotes = [];
  if (data.totalGames > 0) killNotes.push(`${(kills / data.totalGames).toFixed(1)}/game`);
  if (data.selfKills > 0) killNotes.push(`${data.selfKills} self`);

  document.getElementById('totalKills').innerHTML = killNotes.length
    ? `${kills}<span class="stat-sub">${killNotes.join(' - ')}</span>`
    : String(kills);

  renderMatchHistory(data.recentMatches);

  document.getElementById('loading').style.display = 'none';
  document.getElementById('dashboard').style.display = 'grid';
  document.getElementById('historyCard').style.display = 'block';
}

function renderMatchHistory(matches) {
  const tbody = document.getElementById('matchHistoryRows');
  tbody.innerHTML = '';

  if (!matches || matches.length === 0) {
    tbody.innerHTML = '<tr class="history-empty"><td colspan="5">No matches recorded yet.</td></tr>';
    return;
  }

  const targetPlayer = activePlayerName.toLowerCase();
  const firstBloodTag = ' <span style="color: #e8c547; font-weight: 700;" title="First Blood">FB</span>';

  matches.forEach(m => {
    const posClass = Number(m.position) === 1 ? 'badge-win' : 'badge-loss';

    const opponentsHTML = m.pod
      .filter(p => p.player.toLowerCase() !== targetPlayer)
      .map(p => {
        const seat = m.pod.indexOf(p);
        const podKills = m.podKills ? (m.podKills[seat] || 0) : 0;
        const killTag = podKills > 0
          ? ` <span style="color: var(--accent-hover); font-weight: 700;">${podKills}K</span>`
          : '';
        const selfTag = m.podSelfKills && m.podSelfKills[seat]
          ? ' <span style="color: var(--loss-color); font-weight: 700;" title="Took themselves out">self</span>'
          : '';
        const fbTag = isFirstBloodFor(m.firstBlood, p.player, p.commander) ? firstBloodTag : '';

        return `<span class="hist-opp"><strong>${ordinal(p.position)}:</strong> ${escapeHTML(p.player)} (<em>${escapeHTML(p.commander)}</em>)${killTag}${selfTag}${fbTag}</span>`;
      })
      .join(' ');

    const outNote = m.selfKill ? 'self-KO' : (m.killedBy ? `out to ${m.killedBy}` : '');
    const knockedOut = outNote ? `<div class="hist-note">${escapeHTML(outNote)}</div>` : '';

    // The data-label attributes are the field names shown when the table turns into cards on phones.
    const row = document.createElement('tr');
    row.className = 'history-row';
    row.innerHTML = `
      <td class="hist-date" data-label="Date">${m.date || 'N/A'}</td>
      <td class="hist-commander" data-label="Commander">${escapeHTML(m.commander)}${m.gotFirstBlood ? firstBloodTag : ''}</td>
      <td class="hist-finish" data-label="Finish"><span class="${posClass}">${ordinal(m.position)}</span>${knockedOut}</td>
      <td class="hist-kills" data-label="Kills">${Number(m.kills || 0)}</td>
      <td class="hist-opponents" data-label="Opponents &amp; Decks">${opponentsHTML}</td>
    `;
    tbody.appendChild(row);
  });
}

/* ============================================================================
   KILLS AND FIRST BLOOD
   ============================================================================ */

// Kills are recorded on the losing seat ("killedBy") and counted back onto the killer here.
// A seat that took itself out is a self-KO, reported separately and credited to nobody.
// A match from before elimination tracking falls back to any plain kills number it carries,
// or zero. Returns { kills: [], selfKills: [] }, both indexed by seat.
function resolveMatchKills(match) {
  const players = (match && Array.isArray(match.players)) ? match.players : [];
  const stored = players.map(p => Number(p && p.kills) || 0);
  const storedSelf = players.map(p => (p && p.selfKill) ? 1 : 0);

  if (!players.some(p => p && (p.killedBy || p.selfKill))) {
    return { kills: stored, selfKills: storedSelf };
  }

  const kills = players.map(() => 0);
  const selfKills = players.map(() => 0);

  players.forEach((victim, victimIdx) => {
    if (!victim) return;

    if (victim.selfKill) {
      selfKills[victimIdx] = 1;
      return;
    }

    if (!victim.killedBy) return;

    const killerName = String(victim.killedBy).toLowerCase();
    const killerCommander = String(victim.killedByCommander || '').toLowerCase();

    // Older saves marked a self-KO by naming the victim as their own killer.
    if (killerName === String(victim.player || '').toLowerCase()) {
      selfKills[victimIdx] = 1;
      return;
    }

    // Prefer the seat matching both name and deck; fall back to the name alone.
    let killerIdx = players.findIndex((p, idx) => p && idx !== victimIdx &&
      String(p.player || '').toLowerCase() === killerName &&
      (!killerCommander || String(p.commander || '').toLowerCase() === killerCommander));

    if (killerIdx === -1) {
      killerIdx = players.findIndex((p, idx) => p && idx !== victimIdx &&
        String(p.player || '').toLowerCase() === killerName);
    }

    if (killerIdx > -1) kills[killerIdx] += 1;
  });

  return { kills: kills, selfKills: selfKills };
}

// Checks a player (and the commander they piloted, when known) against a match's stored
// First Blood credit ({ player, commander }). Older data without a commander matches by name.
function isFirstBloodFor(firstBlood, playerName, commanderName) {
  if (!firstBlood || !firstBlood.player) return false;
  if (String(firstBlood.player).toLowerCase() !== String(playerName || '').toLowerCase()) return false;
  if (firstBlood.commander) {
    return String(firstBlood.commander).toLowerCase() === String(commanderName || '').toLowerCase();
  }
  return true;
}

/* ============================================================================
   LEADERBOARD STATS
   Aggregated from the same rawDecks / rawMatches the player dashboard uses.
   ============================================================================ */

const SORT_DEFS = {
  wins: {
    column: 'Wins',
    direction: 'desc',
    value: entry => entry.wins,
    format: entry => String(entry.wins),
    phrase: entry => `${entry.wins} ${entry.wins === 1 ? 'Win' : 'Wins'}`
  },
  winRate: {
    column: 'Win Rate',
    direction: 'desc',
    value: entry => entry.winRateNum,
    format: entry => entry.winRate,
    phrase: entry => `${entry.winRate} Win Rate`
  },
  avgPos: {
    column: 'Avg Pos',
    direction: 'asc',
    value: entry => entry.avgPosNum,
    format: entry => entry.avgPos,
    phrase: entry => `${entry.avgPos} Avg Finish`
  },
  games: {
    column: 'Games',
    direction: 'desc',
    value: entry => entry.games,
    format: entry => String(entry.games),
    phrase: entry => `${entry.games} ${entry.games === 1 ? 'Game' : 'Games'}`
  },
  kills: {
    column: 'Kills',
    direction: 'desc',
    value: entry => entry.kills,
    format: entry => String(entry.kills),
    phrase: entry => `${entry.kills} ${entry.kills === 1 ? 'Kill' : 'Kills'}`
  },
  firstBlood: {
    column: 'First Blood',
    direction: 'desc',
    value: entry => entry.firstBloods,
    format: entry => String(entry.firstBloods),
    phrase: entry => `${entry.firstBloods} First Blood${entry.firstBloods === 1 ? '' : 's'}`
  }
};

const PODIUM_RANKS = ['1st', '2nd', '3rd'];

// Set to true to repeat the podium finishers at the top of the table as well.
const PODIUM_IN_TABLE = false;

function buildLeaderboardStats() {
  const playerMap = new Map();
  const deckList = [];
  const deckLookup = new Map();

  const emptyTotals = () => ({ games: 0, wins: 0, posSum: 0, kills: 0, firstBloods: 0 });

  // Seed the standings with every registered deck, so artwork and colours are available.
  rawDecks.forEach(deck => {
    const c1 = (deck.commander1 || deck.commander || '').trim();
    const c2 = deck.commander2 && deck.commander2 !== 'None' ? deck.commander2.trim() : '';
    const label = (deck.label || (c2 ? `${c1} & ${c2}` : c1)).trim();
    const playerKey = (deck.player || '').toLowerCase();

    if (deck.player && !playerMap.has(playerKey)) {
      playerMap.set(playerKey, Object.assign({ player: deck.player, playerKey: playerKey }, emptyTotals()));
    }

    const entry = Object.assign({
      player: deck.player,
      playerKey: playerKey,
      commander1: c1,
      commander2: c2,
      label: label,
      colorIdentity: deck.colorIdentity || 'C',
      artUrl1: getArtUrl(deck, ART1_KEYS),
      artUrl2: c2 ? getArtUrl(deck, ART2_KEYS) : ''
    }, emptyTotals());

    deckList.push(entry);

    // A logged commander can be the combined label, the primary or the partner name.
    [label, c1, c2].filter(Boolean).forEach(name => {
      const key = `${playerKey}::${name.toLowerCase()}`;
      if (!deckLookup.has(key)) deckLookup.set(key, entry);
    });
  });

  // Add up the matches. Players without a registered deck are not ranked as players, but a
  // deck they piloted still gets its own entry in the deck standings.
  rawMatches.forEach(match => {
    if (!match || !Array.isArray(match.players)) return;

    const matchKills = resolveMatchKills(match);

    match.players.forEach((p, seatIdx) => {
      if (!p || !p.player) return;

      const playerKey = p.player.toLowerCase();
      const position = Number(p.position) || 0;
      const kills = matchKills.kills[seatIdx] || 0;
      const commanderName = (p.commander || '').trim();
      const firstBlood = isFirstBloodFor(match.firstBlood, p.player, commanderName) ? 1 : 0;

      const addResult = totals => {
        totals.games += 1;
        totals.posSum += position;
        totals.kills += kills;
        totals.firstBloods += firstBlood;
        if (position === 1) totals.wins += 1;
      };

      const playerEntry = playerMap.get(playerKey);
      if (playerEntry) addResult(playerEntry);

      const deckKey = `${playerKey}::${commanderName.toLowerCase()}`;
      let deckEntry = deckLookup.get(deckKey);

      if (!deckEntry) {
        deckEntry = Object.assign({
          player: p.player,
          playerKey: playerKey,
          commander1: commanderName,
          commander2: '',
          label: commanderName,
          colorIdentity: 'C',
          artUrl1: '',
          artUrl2: ''
        }, emptyTotals());
        deckList.push(deckEntry);
        deckLookup.set(deckKey, deckEntry);
      }

      addResult(deckEntry);
    });
  });

  const finalizeEntry = entry => {
    entry.winRateNum = entry.games > 0 ? (entry.wins / entry.games) * 100 : 0;
    entry.winRate = entry.winRateNum.toFixed(1) + '%';
    entry.avgPosNum = entry.games > 0 ? entry.posSum / entry.games : 0;
    entry.avgPos = entry.games > 0 ? entry.avgPosNum.toFixed(1) : 'N/A';
    return entry;
  };

  deckList.forEach(finalizeEntry);

  // A player is represented by their most-played deck.
  const players = Array.from(playerMap.values()).map(playerEntry => {
    const ownDecks = deckList.filter(d => d.playerKey === playerEntry.playerKey);
    const signatureDeck = [...ownDecks].sort((a, b) => (b.games - a.games) || (b.wins - a.wins))[0] || null;

    return finalizeEntry(Object.assign(playerEntry, {
      deckCount: ownDecks.length,
      signatureDeck: signatureDeck ? signatureDeck.label : 'No deck registered',
      colorIdentity: signatureDeck ? signatureDeck.colorIdentity : 'C',
      artUrl1: signatureDeck ? signatureDeck.artUrl1 : ''
    }));
  });

  return { players: players, decks: deckList };
}

// Orders entries by the active stat. Entries with no games always sink to the bottom, so an
// unplayed deck can never take the 0.0 "best average finish".
function sortLeaderboardEntries(entries, sortKey) {
  const def = SORT_DEFS[sortKey] || SORT_DEFS.wins;
  const direction = def.direction === 'asc' ? 1 : -1;

  return [...entries].sort((a, b) => {
    if ((a.games > 0) !== (b.games > 0)) return a.games > 0 ? -1 : 1;

    const diff = (def.value(a) - def.value(b)) * direction;
    if (diff !== 0) return diff;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.games !== a.games) return b.games - a.games;
    return String(a.label || a.player).localeCompare(String(b.label || b.player));
  });
}

/* ============================================================================
   LEADERBOARD TAB
   The toolbar drives everything: Players/Decks picks which list is ranked and the sort
   buttons pick the order. The top three become podium tiles (the same look as the Players
   tab cards) and everyone below them lands in the standings table.
   ============================================================================ */

function setLeaderboardEntity(entity) {
  leaderboardEntity = entity === 'decks' ? 'decks' : 'players';
  renderLeaderboard();
}

function setLeaderboardSort(sortKey) {
  leaderboardSort = SORT_DEFS[sortKey] ? sortKey : 'wins';
  renderLeaderboard();
}

function updateLeaderboardControls() {
  const entityBox = document.getElementById('entityControls');
  if (entityBox) {
    entityBox.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.entity === leaderboardEntity);
    });
  }

  const sortBox = document.getElementById('leaderboardSortControls');
  if (sortBox) {
    sortBox.querySelectorAll('.sort-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === leaderboardSort);
    });
  }
}

function renderLeaderboard() {
  const podiumEl = document.getElementById('leaderboardPodium');
  const headEl = document.getElementById('leaderboardHead');
  const bodyEl = document.getElementById('leaderboardRows');
  if (!podiumEl || !headEl || !bodyEl) return;

  updateLeaderboardControls();

  if (rawDecks.length === 0 && rawMatches.length === 0) {
    podiumEl.innerHTML = '<div class="podium-empty">No match data logged yet.</div>';
    headEl.innerHTML = '';
    bodyEl.innerHTML = '<tr><td class="empty-row" colspan="4">No match data logged yet.</td></tr>';
    return;
  }

  const stats = buildLeaderboardStats();
  const ranked = sortLeaderboardEntries(leaderboardEntity === 'decks' ? stats.decks : stats.players, leaderboardSort);

  renderPodium(ranked, podiumEl);
  renderStandingsTable(ranked, headEl, bodyEl);
}

// Clicking a deck row opens the owning player's dashboard with that deck selected.
function openDeckFromLeaderboard(playerName, deckLabel) {
  selectPlayer(playerName);

  const idx = playerProcessedDecks.findIndex(d =>
    !d.isOverall && d.label.toLowerCase() === String(deckLabel).toLowerCase()
  );

  if (idx > -1) {
    selectedDeckIndex = idx;
    renderDashboard(playerProcessedDecks[idx]);
  }
}

/* --- podium --- */

function podiumClickAttr(entry) {
  return leaderboardEntity === 'decks'
    ? `openDeckFromLeaderboard('${toJsString(entry.player)}','${toJsString(entry.label)}')`
    : `selectPlayer('${toJsString(entry.player)}')`;
}

// The headline stat follows the active sort. The second line gives the context that makes it
// readable, so a 100% win rate off one game looks like one game.
function podiumStatLine(entry) {
  const def = SORT_DEFS[leaderboardSort] || SORT_DEFS.wins;
  const secondary = leaderboardSort === 'wins'
    ? `${entry.winRate} Win Rate`
    : `${entry.games} ${entry.games === 1 ? 'Game' : 'Games'}`;
  return `${def.phrase(entry)} | ${secondary}`;
}

function buildPodiumTile(entry, idx) {
  const isDeck = leaderboardEntity === 'decks';
  const art = toArtCrop(entry.artUrl1) || svgPlaceholder;
  const title = isDeck ? entry.label : entry.player;

  return `
    <div class="podium-slot podium-slot--${idx + 1}" onclick="${podiumClickAttr(entry)}">
      <div class="podium-overall">
        <div class="podium-badge">${PODIUM_RANKS[idx]}</div>
        <div class="podium-art" style="background-image: url('${art}')">
          <div class="podium-art-info">
            <div class="podium-name">${escapeHTML(title)}</div>
            <div class="playerManaRow">${renderManaSymbols(entry.colorIdentity)}</div>
          </div>
        </div>
      </div>
      <div class="podium-plinth">${escapeHTML(podiumStatLine(entry))}</div>
    </div>
  `;
}

function renderPodium(ranked, container) {
  const top = ranked.filter(entry => entry.games > 0).slice(0, 3);

  if (top.length === 0) {
    container.innerHTML = '<div class="podium-empty">Log a match to fill the podium.</div>';
    return;
  }

  container.innerHTML = `<div class="podium-row">${top.map(buildPodiumTile).join('')}</div>`;
}

/* --- standings table --- */

// Three columns are fixed (#, name, pilot or deck count). The fourth follows the active sort,
// so changing the sort swaps one column instead of widening the table, which keeps it
// readable on a phone.
function renderStandingsTable(ranked, headEl, bodyEl) {
  const isDeck = leaderboardEntity === 'decks';
  const def = SORT_DEFS[leaderboardSort] || SORT_DEFS.wins;
  const podiumCount = PODIUM_IN_TABLE ? 0 : Math.min(3, ranked.filter(entry => entry.games > 0).length);
  const rows = ranked.slice(podiumCount);
  const statCellCls = 'is-sorted' + (leaderboardSort === 'winRate' ? ' win-cell' : '');

  headEl.innerHTML = `
    <th>#</th>
    <th>${isDeck ? 'Deck' : 'Player'}</th>
    <th>${isDeck ? 'Pilot' : 'Decks'}</th>
    <th class="is-sorted">${escapeHTML(def.column)}</th>
  `;

  if (rows.length === 0) {
    bodyEl.innerHTML = `<tr><td class="empty-row" colspan="4">${podiumCount > 0 ? 'Everyone ranked is on the podium.' : 'Nothing to rank yet.'}</td></tr>`;
    return;
  }

  bodyEl.innerHTML = rows.map((entry, idx) => {
    const rank = podiumCount + idx + 1;
    const name = isDeck ? entry.label : entry.player;
    const secondCell = isDeck
      ? `<td class="pilot-cell">${escapeHTML(entry.player)}</td>`
      : `<td>${entry.deckCount}</td>`;

    return `
      <tr onclick="${podiumClickAttr(entry)}">
        <td class="rank-cell rank-${rank}">${rank}</td>
        <td><span class="player-cell">${escapeHTML(name)}</span></td>
        ${secondCell}
        <td class="${statCellCls}">${escapeHTML(def.format(entry))}</td>
      </tr>
    `;
  }).join('');
}
