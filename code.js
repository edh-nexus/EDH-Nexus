/* ============================================================================
   EDH NEXUS - all data lives in your GitHub repo and is served by GitHub Pages.
   There are no accounts, no API keys and no request quotas anywhere in this file.

   The dashboard only ever READS, so it needs no credentials at all, and reading
   never creates a commit.

   ONE-TIME SETUP
     1. Create data/decks.json and data/matches.json in the repo (each one is a
        JSON array). admin.html can write them for you - see its "GitHub
        Storage" card - or you can paste the JSON in by hand.
     2. Enable GitHub Pages for the repo (Settings -> Pages -> your branch).
     3. Point GITHUB_DATA_BASE below at the published data folder.
     4. Share index.html. That is the whole deployment.

   admin.html is the only page that can write, and only if you hand it a
   fine-grained GitHub token (Contents: Read and write). That token is stored in
   the browser and is never written into these files. Without a token admin.html
   still works - it hands you the JSON to paste into GitHub's web editor.
   ============================================================================ */

// Your published data folder, including the trailing slash. Example:
//   https://chris.github.io/edh-nexus/data/
const GITHUB_DATA_BASE = 'https://edh-nexus.github.io/EDH-Nexus/data/';

// How often a device re-checks for new data. The data URLs rotate on this same
// interval, so a copy older than this can never be handed back by a CDN cache.
const DATA_REFRESH_MS = 5 * 60 * 1000;

// Re-checks while a tab stays open and visible, and the shortest gap allowed between checks.
const REVALIDATE_POLL_MS = 5 * 60 * 1000;
const REVALIDATE_MIN_INTERVAL_MS = 60 * 1000;

// Local cache lives until the published data actually changes - it is never expired by age.
const CACHE_KEY_DECKS = 'edh_decks';
const CACHE_KEY_MATCHES = 'edh_matches';
const CACHE_KEY_FINGERPRINT = 'edh_data_fingerprint';
const LAST_FETCH_KEY = 'edh_last_fetch';
const MIN_GAMES_FOR_RANKING = 3; // minimum games played to qualify for the "best average finish" awards

// Fallback artwork used whenever a commander has no stored Scryfall image.
const svgPlaceholder = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 880">' +
  '<rect width="630" height="880" fill="#171a21"/>' +
  '<rect x="24" y="24" width="582" height="832" rx="28" fill="none" stroke="#282d3b" stroke-width="4"/>' +
  '<text x="315" y="455" font-family="sans-serif" font-size="40" fill="#94a3b8" text-anchor="middle">EDH Nexus</text>' +
  '</svg>'
);

const MANA_SVGS = {
  'W': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" version="1.1"><circle cx="300" cy="300" r="300" fill="#fffbd5"/><path d="m586.2 342.4c-39.4-22.2-64.6-33.3-75.7-33.3-8.1 0-14.4 6.2-18.9 18.6-4.5 12.4-13.6 18.5-27.2 18.5-5.6 0-16.9-2-34.1-6-9.6 14.6-14.4 24-14.4 28 0 5.6 4.1 12.1 12.4 19.7 8.3 7.6 15.2 11.3 20.9 11.3 3.6 0 8.5-0.7 14.7-2.3 6.2-1.5 10.3-2.3 12.4-2.3 6.2 0 9.3 11.4 9.3 34.1 0 21.7-5 55-15.1 99.9-13.1-51.5-27-77.2-41.6-77.2-2 0-6.2 1.5-12.5 4.6-6.3 3-11 4.5-14 4.5-14.6 0-27.7-13.4-39.4-40.1-23.2 3.5-34.8 15.4-34.8 35.6 0 10.1 4.7 18.2 14 24.2 9.3 6.1 14 10.4 14 12.9 0 13.6-19.9 34.6-59.8 62.8-21.2 15.1-35.8 25.7-43.9 31.8 7-9.1 14.1-20.9 21.2-35.6 8.1-16.6 12.1-29.5 12.1-38.6 0-5-5.8-12.1-17.4-21.2-11.6-9.1-17.4-18.7-17.4-28.8 0-8.6 3-19.2 9.1-31.8-6.6-7.6-14.4-11.4-23.5-11.4-20.2 0-30.3 6.6-30.3 19.7 0-9.1 0-2.3 0 20.4 0.5 16.7-12.1 25-37.9 25-19.7 0-52.7-4.6-99.2-13.6 52.5-13.1 78.7-28.3 78.7-45.4 0 2-1-4-3-18.2-2-15.6 9.1-29.8 33.3-42.4-4.5-23.2-16.6-34.8-36.3-34.8-3 0-8.6 5.3-16.6 15.9-8.1 10.6-15.6 15.9-22.7 15.9-12.1 0-27.8-13.1-46.9-39.4-9.1-13.1-23-32.5-41.6-58.3 11.6 6.1 23.2 12.1 34.8 18.2 15.1 7.1 27.3 10.6 36.3 10.6 7.1 0 14-6.2 20.8-18.6 6.8-12.4 15.8-18.6 26.9-18.6 1.5 0 11.6 3 30.3 9.1 9.6-14.6 14.4-25.5 14.4-32.6 0-6.1-3.7-13-11-20.8-7.3-7.8-14-11.7-20.1-11.7-2.5 0-6.4 0.8-11.7 2.3-5.3 1.5-9.2 2.3-11.7 2.3-9.1 0-13.6-11.4-13.6-34.1 0-6.1 5.8-40.6 17.4-103.7-0.5 7.6 2.8 21.7 9.8 42.4 8.6 25.2 18.7 37.9 30.3 37.9 2 0 6.1-1.5 12.1-4.5 6.1-3 10.8-4.5 14.4-4.5 11.6 0 21.2 6.6 28.8 19.7l11.4 20.4c10.6 0 19.4-3.8 26.5-11.3 7.1-7.6 10.6-16.7 10.6-27.3 0-11.1-4.7-19.6-14-25.4-9.4-5.8-14-10.2-14-13.2 0-10.6 16.7-28.5 50-53.7 26.7-20.2 44.2-32 52.2-35.6-21.7 29.3-32.6 50.7-32.6 64.3 0 7.1 4.3 14.6 12.9 22.7 10.6 9.6 16.7 16.4 18.2 20.4 5 11.6 4.5 27.5-1.5 47.7 13.6 9.6 24 14.4 31 14.4 14.6 0 21.9-7.6 21.9-22.7 0-1.5-0.6-6.3-1.9-14.4-1.3-8.1-1.6-12.6-1.1-13.6 2-7.1 15.9-10.6 41.6-10.6 16.2 0 49.7 4.5 100.7 13.6-11.1 3-27.8 7.6-50 13.6-20.2 6.1-30.3 12.9-30.3 20.4 0 3.5 1.3 9.6 3.8 18.2 2.5 8.6 3.8 14.9 3.8 18.9 0 7.1-4.5 13.6-13.6 19.7l-25.7 18.2c6.1 11.1 10.1 17.7 12.1 19.7 5 6.1 11.9 9.1 20.4 9.1 6.1 0 11.6-5.3 16.7-15.9 5-10.6 13.1-15.9 24.2-15.9 13.6 0 29 12.6 46.2 37.9 9.6 14.2 24.5 35.6 44.6 64.4m-168-43.9c0-32.3-11.9-60.3-35.6-84-23.7-23.7-51.7-35.6-84-35.6-32.8 0-61.1 11.7-84.8 35.2-23.7 23.5-35.8 51.6-36.3 84.4-0.5 32.3 11.5 60.2 36 83.6 24.5 23.5 52.9 35.2 85.2 35.2 34.3 0 63-11.2 85.9-33.7 23-22.4 34.2-50.8 33.7-85.1m-11.4 0c0 30.8-10.3 56.3-31 76.4-20.7 20.2-46.4 30.3-77.2 30.3-29.8 0-55.3-10.3-76.4-31-21.2-20.7-31.8-45.9-31.8-75.7 0-29.3 10.7-54.4 32.2-75.3 21.5-20.9 46.8-31.4 76.1-31.4 29.3 0 54.6 10.6 76.1 31.8 21.4 21.2 32.2 46.2 32.2 74.9" fill="#211d15"/></svg>',
  'U': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><circle cx="300" cy="300" r="300" fill="#aae0fa"/><path d="m546.93 375.53c-28.722 29.23-64.1 43.842-106.13 43.842-47.17 0-84.59-16.14-112.27-48.44-26.15-30.762-39.22-69.972-39.22-117.64 0-51.26 22.302-109.72 66.9-175.34 36.38-53.814 79.19-100.98 128.41-141.48-7.182 32.814-10.758 56.13-10.758 69.972 0 31.794 9.984 62.802 29.976 93.05 24.612 35.88 43.31 62.56 56.14 79.968 19.992 30.26 29.988 59.73 29.988 88.42.001 42.558-14.346 78.44-43.04 107.65m-.774-164.17c-7.686-17.17-16.662-28.572-26.916-34.22 1.536 3.084 2.31 7.44 2.31 13.08 0 10.77-3.072 26.14-9.234 46.13l-9.984 30.762c0 17.94 8.952 26.916 26.904 26.916 18.96 0 28.452-12.57 28.452-37.686 0-12.804-3.84-27.792-11.532-44.988" fill="#061922" transform="translate(-142.01 126.79)"/></svg>',
  'B': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" version="1.1"><circle cx="300" cy="300" r="300" fill="#cbc2bf"/><path d="m544.2 291.7c0 33.1-12 55.7-36.1 67.7-7 3.5-29.1 8.3-66.2 14.3-24.1 4-36.1 13.3-36.1 27.8l0 60.9c0 2.5 0.8 10.3 2.3 23.3l2.3 24.1c0 7.5-1.8 19.8-5.3 36.9-9.5 2-20.6 4.3-33.1 6.8-4-15.1-6-25.3-6-30.9 0-2.5 0.6-6.3 1.9-11.3 1.2-5 1.9-8.8 1.9-11.3 0-3.5-3.1-13.3-9.4-29.3l-11.7 0c-1.5 2.5-2.1 5.8-1.6 9.8 2 8.5 2.8 15.8 2.3 21.8-8.5 6-20.3 14.1-35.4 24.1-3.5-1-4.8-1.5-3.8-1.5l0-53.4c-1-2.5-3.5-3.5-7.5-3l-9 0-9 70.7c-7 0.5-15.6 0.5-25.6 0-3.5-16.5-9.8-41.1-18.8-73.7l-6 0c-5.5 17.6-8.5 27.1-9 28.6 0 2 0.6 5.9 1.9 11.7 1.2 5.8 1.9 9.7 1.9 11.7 0 1.5-0.5 5.3-1.5 11.3l-2.3 18.1c-1 1-2.3 1.5-3.8 1.5-15 0-25.1-3.8-30.1-11.3-5-7.5-7-18.1-6-31.6l6-90.3c0-1.5 0.5-3.5 1.5-6 1-2.5 1.5-4.3 1.5-5.3 0-4-4.3-12-12.8-24.1-1.5-0.5-9.3-2.3-23.3-5.3-8.5-2-25.3-5.5-50.4-10.5-34.6-6.5-51.9-34.3-51.9-83.5 0-73.2 30.1-134.2 90.3-182.8 2.5 13.5 6.8 31.6 12.8 54.2 4.5 1 14.3 3.3 29.3 6.8 3 1 18.3 6.5 45.9 16.6-14.1-8.5-32.4-22.3-54.9-41.4-8.5-10-12.8-26.8-12.8-50.4 0-5.5 9.5-12 28.6-19.6 17-7 29.9-11 38.4-12 27.1-3.5 47.9-5.3 62.5-5.3 62.7 0 113.4 16.1 152 48.2-12.5 14.6-34.1 30.1-64.7 46.6 12.1 0.5 29.6-4.2 52.7-14.3 23.1-10 32.9-15 29.3-15 4 0 12.1 8 24.1 24.1 9 12 16.3 22.8 21.8 32.4 16 28.6 26.8 59.5 32.4 92.6 0 11.6 0.2 19.8 0.8 24.8l0 6 0 0zm-288.2 13.5c0-21.6-9.4-42-28.2-61.3-18.8-19.3-39-29-60.6-29-19.1 0-35.9 8.1-50.4 24.2-14.6 16.2-21.8 34.1-21.8 53.8 0 17.2 8.3 28.3 24.8 33.3 10.5 3 25.3 4.8 44.4 5.3l41.4 0c33.6 0.5 50.4-8.3 50.4-26.3m82 93.3 0-23.3c-3.5-6.5-7-13.3-10.5-20.3-3-10-8.5-24.1-16.6-42.1l-8.3 88c0 7-1.5 10.5-4.5 10.5-2 0-3.5-0.5-4.5-1.5-3.5-53.2-5.3-76.2-5.3-69.2l0-26.3c-1-1.5-2.2-2.3-3.7-2.3-17.1 17.6-25.6 45.9-25.6 85 0 21.6 2 34.9 6 39.9 4-1 8.5-2.8 13.5-5.3 2-1 7.8-1.5 17.3-1.5 9.5 0 21.1 3 34.6 9 5 0 7.5-13.5 7.5-40.6m170.1-104.8c0-20.2-7.5-38.2-22.6-54.1-15.1-15.9-32.4-23.8-51.9-23.8-21.1 0-40.8 9.6-59.1 29-18.3 19.3-27.5 39.5-27.5 60.6 0 17.6 8.5 26.3 25.6 26.3l86.5 0c32.6-0.5 48.9-13.1 48.9-37.9" fill="#130c0e"/></svg>',
  'R': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" version="1.1"><circle cx="300" cy="300" r="300" fill="#f9aa8f"/><path d="m551.8 399.7c-22.4 53.5-67 80.2-133.6 80.2-12.2 0-25.5 1.5-39.7 4.6-21.4 4.6-32.1 11-32.1 19.1 0 2.5 1.8 5.5 5.3 8.8 3.6 3.3 6.6 5 9.2 5-12.7 0-4.1 0.4 26 1.1 30.1 0.8 48.9 1.1 56.5 1.1-44.3 26-118.4 37.9-222.3 35.9-34.1-0.5-63.4-15.5-87.8-45.1-24-28-35.9-59.3-35.9-93.9 0-36.6 12.3-67.8 37.1-93.6 24.7-25.7 55.4-38.6 92-38.6 8.1 0 19 1.8 32.5 5.3 13.5 3.6 22.5 5.3 27.1 5.3 18.8 0 42.3-7.8 70.3-23.3 28-15.5 41.3-23.3 39.7-23.3-5.1 53.5-22.9 89.4-53.5 107.7-21.9 12.7-32.8 25.2-32.8 37.4 0 7.6 4.6 13.8 13.7 18.3 7.1 3.6 15 5.4 23.7 5.4 13.2 0 26.2-8.1 39-24.4 12.7-16.3 18.3-31.1 16.8-44.3-1.5-15.3-0.5-33.6 3.1-55 1-6.1 4.7-13.6 11.1-22.5 6.4-8.9 12.1-14.4 17.2-16.4 0 4.6-1.6 12.2-5 22.9-3.3 10.7-5 18.6-5 23.7 0 11.2 3 19.9 9.2 26 9.2-3.6 17.3-15 24.4-34.4 6.1-14.8 9.7-29 10.7-42.8-21.4-1-41.9-10.7-61.5-29-19.6-18.3-29.4-38.2-29.4-59.6 0-3.6 0.5-7.1 1.5-10.7 3 4.6 7.6 11.7 13.7 21.4 8.7 12.7 15.3 19.1 19.9 19.1 6.1 0 9.2-6.4 9.2-19.1 0-16.3-4.3-31.1-13-44.3-9.7-15.8-22.2-23.7-37.4-23.7-7.1 0-17.8 3.8-32.1 11.5-14.3 7.6-27.3 11.5-39 11.5-3.6 0-19.4-4.6-47.4-13.8 49.4-8.1 74.1-15.5 74.1-22.1 0-17.3-33.9-29-101.6-35.1-6.6-0.5-18.8-1.5-36.7-3.1 2-2.5 16.5-5.3 43.5-8.4 22.9-2.5 39-3.8 48.1-3.8 121.2 0 198.1 58.8 230.7 176.5 5.6-4.6 8.4-12.4 8.4-23.2 0-13.9-4.1-31.5-12.2-52.7-3.1-8.2-7.9-20.6-14.5-37.2 41.7 53.2 62.6 103.6 62.6 151.2 0 25.1-5.9 47.8-17.6 68.3-7.6 13.8-21.9 31.5-42.8 53-20.9 21.5-35.1 38.1-42.8 49.9 28-7.6 46.4-13.5 55-17.6 19.3-8.6 36.9-21.6 52.7-39 0 6.6-2.8 16.6-8.4 29.8M218.8 99.5c0 9.2-5.1 15-15.3 17.6l-19.9 3.1c-7.1 3.6-17.6 17.6-31.3 42-1.5-7.6-3.8-18.3-6.9-32.1-4.6 0.5-12.2 4.6-22.9 12.2-4.6 3.6-12 8.9-22.2 16 3.1-18.3 13.2-36.9 30.6-55.8 18.3-20.9 36.2-31.3 53.5-31.3 22.9 0 34.4 9.4 34.4 28.3m132.9 70.3c0 8.7-4.7 15.9-14.1 21.8-9.4 5.9-18.7 8.8-27.9 8.8-12.2 0-23.2-6.9-32.8-20.6-11.7-16.8-23.7-27.7-35.9-32.9 2.5-2.5 5.6-3.8 9.2-3.8 4.6 0 12.3 3.6 23.3 10.7 10.9 7.1 17.9 10.7 21 10.7 2.5 0 6.7-3.6 12.6-10.7 5.9-7.1 12.3-10.7 19.5-10.7 16.8 0 25.2 8.9 25.2 26.7" fill="#200000"/></svg>',
  'G': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" version="1.1"><circle cx="300" cy="300" r="300" fill="#9bd3ae"/><path d="m562.6 337.4c0 10-3.9 19-11.6 27-7.7 8-16.6 12-26.6 12-16 0-27.7-7.5-35.2-22.5l-35.2-1.5c-7.5 0-22.3 3.3-44.2 9.8-23.5 6.5-37 11.7-40.5 15.7-5.5 6-10 20-13.5 42-3 18-4.5 31.2-4.5 39.7 0 13.5 2.1 23.4 6.4 29.6 4.3 6.2 13 11.5 26.2 15.7 13.2 4.2 21.4 6.6 24.4 7.1 2 0 5.2-0.2 9.8-0.7l9 0c6.5 0 13.2 1 20.2 3 10 3 14.3 7 12.8 12-7-1-19.2 0.5-36.7 4.5l21 10.5c0 6-8.5 9-25.5 9-4.5 0-10.6-1-18.4-3-7.7-2-12.9-3-15.4-3l-9.7 0c-0.5 5-2 12.5-4.5 22.5-8.5-0.5-18.5-5.5-30-15-11.5-9.5-18.7-14.2-21.7-14.2-3 0-7.3 4.8-12.7 14.2-5.5 9.5-8.2 16-8.2 19.5-6.5-3.5-12-10-16.5-19.5-2-6.5-4.2-13-6.7-19.5-5 0.5-14.2 11-27.7 31.5l-3.8 0c-1-1.5-4.8-12-11.2-31.5-15.5-5-30-7.5-43.5-7.5-6.5 0-16.5 1.5-30 4.5l-21-1.5c3-3 11.7-8.7 26.2-17.2 17-10 30-15 39-15 1.5 0 3.5 0.3 6 0.8 2.5 0.5 4.5 0.8 6 0.8 3.5 0 9.1-1.9 16.9-5.6 7.7-3.7 12.2-7.1 13.5-10.1 1.3-3 1.9-10.8 1.9-23.2 0-28.5-7.5-49.7-22.5-63.7-13-12.5-34.5-21.5-64.5-27-8 28.5-30.5 42.7-67.4 42.7-12 0-24-7.2-36-21.7C44.7 373.8 38.7 360.6 38.7 348.6c0-18.5 7.7-33.7 23.2-45.7-12.5-13-18.7-26.2-18.7-39.7 0-12.5 3.9-23.5 11.6-33 7.7-9.5 17.9-15 30.4-16.5-1-16 4.2-27 15.7-33-5.5-5.5-8.2-15.2-8.2-29.2 0-16.5 5.5-30.2 16.5-41.2 11-11 24.7-16.5 41.2-16.5 18 0 32.7 6.3 44.2 18.8 14.5-49.5 45.7-74.2 93.7-74.2 25 0 47 10 66 30 7 7.5 10.5 11.5 10.5 12-6 0-3-1.1 9-3.4 12-2.2 20.7-3.4 26.2-3.4 19.5 0 36.7 7.2 51.7 21.7 13 13 22 29.5 27 49.5 3.5 0.5 9 2 16.5 4.5 11 5.5 16.5 15 16.5 28.5 0 2.5-2 7.3-6 14.2 32 18 48 43 48 75 0 9-3.5 21.5-10.5 37.5 13 7.5 19.5 18.5 19.5 33m-308.8 33 0-9.7c0-11.5-5.6-22-16.9-31.5-11.2-9.5-22.6-14.2-34.1-14.2-14 0-27 3.2-39 9.7 26.5-1.5 56.5 13.8 89.9 45.7m-13.5-92.9c-7.5-8.5-14-17.2-19.5-26.2-21 5.5-31.5 11.7-31.5 18.7 6-0.5 14.7 0.6 26.2 3.4 11.5 2.8 19.7 4.1 24.8 4.1m45.7-23.2 0-33c-12-2-19.3-3-21.7-3l0 11.2 21.7 24.7m97.4-21c-6-2.5-17.2-7.5-33.7-15l0 64.5c23.5-13.5 34.7-30 33.7-49.5m41.2 88.5-16.5-20.2c-10 7-20.1 14.1-30.4 21.4-10.3 7.2-19.1 15.4-26.6 24.4 22.5-12 47-20.5 73.4-25.5" fill="#00160b"/></svg>',
  'C': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><circle cx="300" cy="300" r="300" fill="#ccc2c0"/><path d="M300 60A500 500 0 0 0 540 300 500 500 0 0 0 300 540 500 500 0 0 0 60 300 500 500 0 0 0 300 60m0 90A300 300 0 0 1 150 300 300 300 0 0 1 300 450 300 300 0 0 1 450 300 300 300 0 0 1 300 150" fill="#130c0e"/></svg>'
};

function renderManaSymbols(colorIdentityStr) {
  if (!colorIdentityStr) return '<div class="mana-container"><img src="https://svg.mana.ninja/c.svg" class="mana-icon" alt="C" title="Colorless" /></div>';

  const colors = colorIdentityStr.toUpperCase().replace(/[^WUBRGC]/g, '').split('');
  if (colors.length === 0) colors.push('C');

  const icons = colors.map(c => {
    const src = MANA_SVGS[c] || MANA_SVGS['C'];
    return `${src}`;
  }).join('');

  return `<div class="mana-container">${icons}</div>`;
}

function getArtUrl(deckObj, primaryKey, secondaryKeys = []) {
  const keys = [primaryKey, ...secondaryKeys];
  for (const k of keys) {
    if (deckObj[k] && typeof deckObj[k] === 'string' && deckObj[k].trim() !== '') {
      return deckObj[k].trim();
    }
  }
  return '';
}

let rawDecks = [];
let rawMatches = [];
let playerProcessedDecks = [];
let selectedDeckIndex = 0;
let activePlayerName = '';
let autoRefreshTimer = null;
let activeTab = 'players';
let playerLeaderboardSort = 'wins';
let deckLeaderboardSort = 'wins';

document.addEventListener('DOMContentLoaded', async () => {
  registerSyncListeners();
  await loadDatabase();
});

/* ============================================================================
   DATA SYNC
   The copy cached in localStorage is rendered immediately, then verified in the
   background. The cache (and the DOM) are rewritten only when the cloud copy has
   actually changed, so an unchanged league costs nothing but the check itself.
   ============================================================================ */

let revalidateInFlight = false;
let lastRevalidateAt = 0;
let storageSyncTimer = null;

// FNV-1a 32 bit - fast, stable, and plenty for "did the content change?" checks.
function hashString(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

// Changing this shape? admin.html mirrors this function so both pages agree on a fingerprint.
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
  localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
}

/* --- GitHub Pages data source --- */

// The rotating ?t= value changes on every DATA_REFRESH_MS boundary. GitHub Pages caches files
// at its edge for 10 minutes, so changing the query value guarantees we are handed the current
// file rather than a cached copy - and it needs no API call, no token and no quota.
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

async function loadDatabase(forceRefresh = false) {
  const loadingEl = document.getElementById('loading');
  const cached = forceRefresh ? null : readCache();

  if (forceRefresh) setSyncStatus('Checking...');

  // Cached data paints instantly; whether it is still current is verified in the background.
  if (cached) {
    loadingEl.style.display = 'none';
    rawDecks = cached.decks;
    rawMatches = cached.matches;
    refreshActiveView();
    updateSyncStatus();
    scheduleAutoRefresh();
    revalidateInBackground(true);
    return true;
  }

  loadingEl.style.display = 'block';
  loadingEl.innerText = 'Loading EDH Nexus database...';

  try {
    // Stamp first, then data: storing a revision that is older than the copy we hold is safe
    // (worst case one extra check later), storing a newer one could hide a change.
    const remoteRevision = await fetchRemoteRevision();
    const data = await fetchDatabaseFromCloud(remoteRevision);
    writeCache(data.decks, data.matches);

    if (remoteRevision !== null) localStorage.setItem(REMOTE_REVISION_KEY, remoteRevision);

    reapplyActiveView();
    updateSyncStatus();
    scheduleAutoRefresh();
    return true;
  } catch (err) {
    console.error(err);
    if (rawDecks.length > 0 || rawMatches.length > 0) {
      setSyncStatus('Offline - showing cached data', true);
    } else {
      loadingEl.innerText = 'Error loading EDH Nexus data.';
    }
    return false;
  }
}

// Re-checks the cloud periodically, but only while the tab is open and visible, so a parked
// device or a background tab never spends data on polling.
function scheduleAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => revalidateInBackground(), REVALIDATE_POLL_MS);
}

// The most useful moment to check for changes is right when someone looks at the app again.
function registerSyncListeners() {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) revalidateInBackground();
  });

  window.addEventListener('focus', () => revalidateInBackground());

  // Another tab on this device (the admin portal) has just saved: pick it up with no network.
  // Debounced so the burst of cache writes is read once, and only when fully written.
  window.addEventListener('storage', event => {
    if (event.key !== CACHE_KEY_DECKS && event.key !== CACHE_KEY_MATCHES) return;

    if (storageSyncTimer) clearTimeout(storageSyncTimer);
    storageSyncTimer = setTimeout(() => {
      const cached = readCache();
      if (!cached) return;
      rawDecks = cached.decks;
      rawMatches = cached.matches;
      reapplyActiveView();
      updateSyncStatus();
    }, 50);
  });
}

// Reads the optional revision stamp bin. Returns null when it is not configured or unreadable.
async function fetchRemoteRevision() {
  if (DATA_SOURCE === 'github') return fetchGitHubRevision();
  if (!SYNC_BIN_ID) return null;

  try {
    const res = await cloudFetch(`https://api.jsonbin.io/v3/b/${SYNC_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY },
      cache: 'no-store'
    });
    if (!res.ok) return null;

    const data = await res.json();
    const revision = data.record ? data.record.revision : null;
    return revision === undefined || revision === null ? null : String(revision);
  } catch (e) {
    return null;
  }
}

// Checks the cloud and refreshes the cache + screen ONLY when something actually changed.
// Returns true when fresh data was applied.
async function revalidateInBackground(skipThrottle = false, manual = false) {
  if (revalidateInFlight) return false;
  if (document.hidden) return false;

  // Quota guard: automatic checks stop once this device has spent its daily allowance.
  if (!manual && budgetExhausted()) {
    setSyncStatus('Daily check limit reached');
    return false;
  }

  const now = Date.now();
  if (!skipThrottle && (now - lastRevalidateAt) < REVALIDATE_MIN_INTERVAL_MS) return false;

  revalidateInFlight = true;
  lastRevalidateAt = now;

  try {
    const remoteRevision = await fetchRemoteRevision();

    // An unchanged revision means nothing was written anywhere, so the datasets (and, on
    // GitHub, the JSON files) are not requested at all.
    if (remoteRevision !== null && remoteRevision === localStorage.getItem(REMOTE_REVISION_KEY)) {
      setSyncStatus('Up to date');
      return false;
    }

    setSyncStatus('Checking...');
    const data = await fetchDatabaseFromCloud(remoteRevision);
    const freshFingerprint = dataFingerprint(data.decks, data.matches);

    if (remoteRevision !== null) localStorage.setItem(REMOTE_REVISION_KEY, remoteRevision);

    // Identical content: keep the cache and the rendered screen exactly as they are.
    if (freshFingerprint === (localStorage.getItem(CACHE_KEY_FINGERPRINT) || '')) {
      setSyncStatus('Up to date');
      return false;
    }

    writeCache(data.decks, data.matches);
    reapplyActiveView();
    updateSyncStatus();
    return true;
  } catch (err) {
    console.error('Background sync failed:', err);
    setSyncStatus('Offline - showing cached data', true);
    return false;
  } finally {
    revalidateInFlight = false;
  }
}

// Re-renders the current screen while keeping the user's place (same tab/player/deck).
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

/* --- sync status chip --- */

function formatRelativeTime(timestamp) {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 45) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes + ' min ago';

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');

  const days = Math.round(hours / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}

function syncTooltip() {
  const lastFetch = parseInt(localStorage.getItem(LAST_FETCH_KEY) || '0', 10);
  const lastChange = lastFetch ? 'Last new data: ' + formatRelativeTime(lastFetch) + '. ' : '';
  const budget = DATA_SOURCE === 'jsonbin'
    ? requestsUsedToday() + ' of ' + DAILY_REQUEST_BUDGET + ' daily requests used on this device. '
    : 'Reading from GitHub - nothing counts against the JSONBin quota. ';
  return lastChange + budget + 'Click to check now.';
}

function setSyncStatus(text, isError = false) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.innerText = text;
  el.classList.toggle('error', !!isError);
  el.title = syncTooltip();
}

function updateSyncStatus() {
  const lastFetch = parseInt(localStorage.getItem(LAST_FETCH_KEY) || '0', 10);
  if (!lastFetch) {
    setSyncStatus('Not synced');
    return;
  }
  setSyncStatus('Updated ' + formatRelativeTime(lastFetch));
}

// Manual check, triggered by clicking the status chip. A deliberate click ignores both the
// throttle and the daily budget, but it still counts against the quota.
async function forceRefresh() {
  lastRevalidateAt = 0;
  const changed = await revalidateInBackground(true, true);
  if (!changed) setSyncStatus(budgetExhausted() ? 'Up to date (daily limit reached)' : 'Up to date');
  return changed;
}

function showPlayerSelection() {
  activePlayerName = '';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('historyCard').style.display = 'none';
  document.getElementById('backToPlayersBtn').style.display = 'none';
  document.getElementById('selectDeckBtn').style.display = 'none';
  document.getElementById('leaderboardView').style.display = 'none';

  const selectionView = document.getElementById('playerSelectionView');
  const playerGrid = document.getElementById('playerGrid');
  playerGrid.innerHTML = '';

  const uniquePlayers = [...new Set(rawDecks.map(d => d.player))].sort();

  uniquePlayers.forEach(player => {
    const processedDecks = processPlayerData(player);
    const topDeck = processedDecks.length > 0 ? processedDecks[0] : null;

    const playerMatches = rawMatches.filter(m =>
      m.players && m.players.some(p => p.player.toLowerCase() === player.toLowerCase())
    );

    const totalGames = playerMatches.length;
    const wins = playerMatches.filter(m => {
      const pEntry = m.players.find(p => p.player.toLowerCase() === player.toLowerCase());
      return pEntry && Number(pEntry.position) === 1;
    }).length;

    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) + '%' : '0.0%';

    // Extract Scryfall art_crop URL
    const artCropUrl = toArtCrop(topDeck ? (topDeck.artUrl1 || svgPlaceholder) : svgPlaceholder);

    const commanderTitle = topDeck ? topDeck.commander1 : 'No Deck Selected';
    const manaIconsHTML = topDeck ? renderManaSymbols(topDeck.colorIdentity) : '';

    const card = document.createElement('div');
    card.className = 'player-card';
    card.onclick = () => selectPlayer(player);

    card.innerHTML = `     
      <div class="card-left-column" style="background-image: url('${artCropUrl}')">
        <div class="card-left-info">
            <div class="player-name-title">${player}</div>
            <div class="player-mana-row">${manaIconsHTML}</div>
        </div>
      </div>  

      <div class="card-right-column">
        <div class="card-right-stats">
            <div class="stat-box">
              <span class="stat-value">${totalGames}</span>
              <span class="stat-label">GAMES</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-box">
              <span class="stat-value win-color">${winRate}</span>
              <span class="stat-label">WIN RATE</span>
            </div>
        </div>
      </div>
    `;

    playerGrid.appendChild(card);
  });

  selectionView.style.display = 'block';
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

function togglePartnerStack() {
  const container = document.getElementById('artContainer');
  if (container.classList.contains('has-partner')) {
    container.classList.toggle('swapped');
  }
}

function renderDeckGrid(decks) {
  const grid = document.getElementById('deckGrid');
  grid.innerHTML = '';

  if (decks.length === 0) {
    grid.innerHTML = '<div style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 20px;">No matching decks found.</div>';
    return;
  }

  decks.forEach((deck) => {
    const realIndex = playerProcessedDecks.indexOf(deck);
    const tile = document.createElement('div');
    tile.className = `deck-tile ${realIndex === selectedDeckIndex ? 'active' : ''}`;
    tile.onclick = () => selectDeckFromModal(realIndex);

    const hasPartner = Boolean(deck.commander2 && deck.commander2 !== 'None' && deck.artUrl2);

    const art1Src = deck.artUrl1;
    const art2Src = deck.artUrl2;

    let artHTML = '';
    if (hasPartner) {
      artHTML = `
            <div class="tile-art-wrapper is-partner">
              <img src="${art1Src}" class="partner-tile-art art-c1" alt="${deck.commander1}" onerror="this.onerror=null; this.src=svgPlaceholder;"/>
              <img src="${art2Src}" class="partner-tile-art art-c2" alt="${deck.commander2}" onerror="this.onerror=null; this.src=svgPlaceholder;"/>
            </div>
          `;
    } else {
      artHTML = `
            <div class="tile-art-wrapper">
              <img src="${art1Src}" class="tile-art" alt="${deck.label}" onerror="this.onerror=null; this.src=svgPlaceholder;" />
            </div>
          `;
    }

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

function processPlayerData(playerName) {
  const targetPlayer = playerName.toLowerCase();
  const playerDecks = rawDecks.filter(d => d.player.toLowerCase() === targetPlayer);

  const playerMatches = rawMatches.map(m => {
    const entry = m.players ? m.players.find(p => p.player.toLowerCase() === targetPlayer) : null;
    if (!entry) return null;
    return {
      gameId: m.gameId,
      date: m.date,
      commander: entry.commander,
      position: entry.position,
      pod: m.players
    };
  }).filter(m => m !== null);

  const processed = playerDecks.map(deck => {
    const c1 = deck.commander1 ? deck.commander1.trim() : (deck.commander || '');
    const c2 = deck.commander2 && deck.commander2 !== 'None' ? deck.commander2.trim() : '';
    const hasPartner = c2 !== '';
    const combinedLabel = deck.label || (hasPartner ? `${c1} & ${c2}` : c1);

    const extractedArt1 = getArtUrl(deck, 'artUrl1', ['artUrl', 'image', 'art_url', 'scryfallCrop', 'commanderArt1']);
    const extractedArt2 = getArtUrl(deck, 'artUrl2', ['artUrl2', 'image2', 'art_url2', 'scryfallCrop2', 'commanderArt2']);

    const art1 = extractedArt1 || svgPlaceholder;
    const art2 = extractedArt2 || '';

    const deckMatches = playerMatches.filter(m => {
      const logged = m.commander.toLowerCase().trim();
      return logged === c1.toLowerCase() || (hasPartner && logged === c2.toLowerCase()) || logged === combinedLabel.toLowerCase();
    });

    const totalGames = deckMatches.length;
    const wins = deckMatches.filter(m => Number(m.position) === 1).length;
    const winRateNum = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    let posSum = 0;
    deckMatches.forEach(m => posSum += Number(m.position || 0));

    return {
      commander1: c1,
      commander2: c2,
      label: combinedLabel,
      artUrl1: art1,
      artUrl2: art2,
      colorIdentity: deck.colorIdentity || 'C',
      theme: deck.theme || 'N/A',
      totalGames: totalGames,
      wins: wins,
      winRateNum: winRateNum,
      winsLosses: `${wins} / ${totalGames - wins}`,
      winRate: winRateNum.toFixed(1) + '%',
      avgPos: totalGames > 0 ? (posSum / totalGames).toFixed(1) : 'N/A',
      recentMatches: deckMatches.slice(-5).reverse()
    };
  });

  const sortedByGames = [...processed].sort((a, b) => {
    if (b.totalGames === a.totalGames) return b.winRateNum - a.winRateNum;
    return b.totalGames - a.totalGames;
  });

  const topDeck = sortedByGames.length > 0 && sortedByGames[0].totalGames > 0 ? sortedByGames[0] : (processed[0] || null);

  const overallGames = playerMatches.length;
  const overallWins = playerMatches.filter(m => Number(m.position) === 1).length;
  let overallPosSum = 0;
  playerMatches.forEach(m => overallPosSum += Number(m.position || 0));

  const overallProfile = {
    isOverall: true,
    commander1: topDeck ? topDeck.commander1 : `${playerName}'s Career`,
    commander2: topDeck ? topDeck.commander2 : '',
    label: 'Overall Player Profile',
    artUrl1: topDeck ? topDeck.artUrl1 : svgPlaceholder,
    artUrl2: topDeck ? topDeck.artUrl2 : '',
    colorIdentity: topDeck ? topDeck.colorIdentity : 'WUBRG',
    theme: topDeck ? `Most Played: ${topDeck.label}` : `${processed.length} Decks Registered`,
    totalGames: overallGames,
    winsLosses: `${overallWins} / ${overallGames - overallWins}`,
    winRate: overallGames > 0 ? ((overallWins / overallGames) * 100).toFixed(1) + '%' : '0%',
    avgPos: overallGames > 0 ? (overallPosSum / overallGames).toFixed(1) : 'N/A',
    recentMatches: playerMatches.slice(-5).reverse()
  };

  return [overallProfile, ...processed];
}

function renderDashboard(data) {
  const cardHeader = document.getElementById('commanderCardHeader');
  const artContainer = document.getElementById('artContainer');
  const art1 = document.getElementById('commanderArt1');
  const art2 = document.getElementById('commanderArt2');

  artContainer.classList.remove('swapped');

  if (data.isOverall) {
    cardHeader.innerText = 'CAREER PROFILE (MOST PLAYED)';
    art1.src = data.artUrl1 || svgPlaceholder;

    if (data.commander2 && data.artUrl2) {
      art2.src = data.artUrl2 || svgPlaceholder;
      art2.style.display = 'block';
      artContainer.classList.add('has-partner');
      art1.className = 'stacked-card partner-c1';
    } else {
      art2.style.display = 'none';
      artContainer.classList.remove('has-partner');
      art1.className = 'single-art';
    }
  } else {
    cardHeader.innerText = 'ACTIVE COMMANDER';
    art1.src = data.artUrl1 || svgPlaceholder;

    if (data.commander2 && data.artUrl2) {
      art2.src = data.artUrl2 || svgPlaceholder;
      art2.style.display = 'block';
      artContainer.classList.add('has-partner');
      art1.className = 'stacked-card partner-c1';
    } else {
      art2.style.display = 'none';
      artContainer.classList.remove('has-partner');
      art1.className = 'single-art';
    }
  }

  document.getElementById('colorIdentityDisplay').innerHTML = renderManaSymbols(data.colorIdentity);
  document.getElementById('totalGames').innerText = data.totalGames;
  document.getElementById('winsLosses').innerText = data.winsLosses;
  document.getElementById('winRate').innerText = data.winRate;
  document.getElementById('avgPos').innerText = data.avgPos;

  const tbody = document.getElementById('matchHistoryRows');
  tbody.innerHTML = '';
  if (!data.recentMatches || data.recentMatches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); padding: 12px;">No matches recorded yet.</td></tr>';
  } else {
    const targetPlayer = activePlayerName.toLowerCase();
    data.recentMatches.forEach(m => {
      const row = document.createElement('tr');
      const posClass = m.position == 1 ? 'badge-win' : 'badge-loss';
      const posText = m.position == 1 ? '1st' : `${m.position}th`;

      const opponentsHTML = m.pod
        .filter(p => p.player.toLowerCase() !== targetPlayer)
        .map(p => `<span style="display:inline-block; margin-right: 10px; font-size: 0.85rem;"><strong>${p.position}th:</strong> ${p.player} (<em>${p.commander}</em>)</span>`)
        .join(' ');

      row.innerHTML = `
            <td style="padding: 8px; color: var(--text-muted); font-size: 0.85rem;">${m.date || 'N/A'}</td>
            <td style="padding: 8px; font-weight: bold;">${m.commander}</td>
            <td style="padding: 8px;" class="${posClass}">${posText}</td>
            <td style="padding: 8px; color: var(--text-main);">${opponentsHTML}</td>
          `;
      tbody.appendChild(row);
    });
  }

  document.getElementById('loading').style.display = 'none';
  document.getElementById('dashboard').style.display = 'grid';
  document.getElementById('historyCard').style.display = 'block';
}

window.onclick = function (event) {
  const modal = document.getElementById('deckModal');
  if (event.target === modal) {
    closeDeckModal();
  }
}

/* ============================================================================
   TAB NAVIGATION (Players <-> Leaderboard)
   ============================================================================ */

function updateTabButtons() {
  const playersBtn = document.getElementById('tabBtnPlayers');
  const leaderboardBtn = document.getElementById('tabBtnLeaderboard');
  if (playersBtn) playersBtn.classList.toggle('active', activeTab === 'players');
  if (leaderboardBtn) leaderboardBtn.classList.toggle('active', activeTab === 'leaderboard');
}

// Re-renders whichever tab is currently on screen (used after data loads/refreshes).
function refreshActiveView() {
  if (activeTab === 'leaderboard') {
    renderLeaderboard();
  } else {
    showPlayerSelection();
  }
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

function setLeaderboardSort(target, sortKey) {
  if (target === 'player') {
    playerLeaderboardSort = sortKey;
  } else {
    deckLeaderboardSort = sortKey;
  }

  const container = document.getElementById(target === 'player' ? 'playerSortControls' : 'deckSortControls');
  if (container) {
    Array.from(container.querySelectorAll('.sort-btn')).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === sortKey);
    });
  }

  renderLeaderboard();
}

// Clicking a leaderboard row jumps straight into that player's dashboard.
function openPlayerFromLeaderboard(playerName) {
  activeTab = 'players';
  updateTabButtons();
  selectPlayer(playerName);
}

// Clicking a deck row opens the owning player's dashboard with that deck selected.
function openDeckFromLeaderboard(playerName, deckLabel) {
  activeTab = 'players';
  updateTabButtons();
  selectPlayer(playerName);

  const idx = playerProcessedDecks.findIndex(d =>
    !d.isOverall && d.label.toLowerCase() === String(deckLabel).toLowerCase()
  );

  if (idx > -1) {
    selectedDeckIndex = idx;
    renderDashboard(playerProcessedDecks[idx]);
  }
}

/* ============================================================================
   LEADERBOARD STATS
   Aggregated from the very same rawDecks / rawMatches data the dashboard uses.
   ============================================================================ */

function toArtCrop(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/grid/', '/art/').replace('/normal/', '/art/').replace('/large/', '/art/');
}

function escapeHTML(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Makes a value safe to drop inside single quotes in an inline onclick attribute.
function toJsString(value) {
  const raw = String(value === undefined || value === null ? '' : value);
  return escapeHTML(raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
}

function buildLeaderboardStats() {
  const playerMap = new Map();
  const deckList = [];
  const deckLookup = new Map();

  // 1) Seed the deck standings with every registered deck so artwork/colours are available.
  rawDecks.forEach(deck => {
    const c1 = (deck.commander1 || deck.commander || '').trim();
    const c2 = deck.commander2 && deck.commander2 !== 'None' ? deck.commander2.trim() : '';
    const label = (deck.label || (c2 ? `${c1} & ${c2}` : c1)).trim();
    const playerKey = (deck.player || '').toLowerCase();

    const entry = {
      player: deck.player,
      playerKey: playerKey,
      commander1: c1,
      commander2: c2,
      label: label,
      colorIdentity: deck.colorIdentity || 'C',
      artUrl1: getArtUrl(deck, 'artUrl1', ['artUrl', 'image', 'art_url', 'scryfallCrop', 'commanderArt1']),
      artUrl2: c2 ? getArtUrl(deck, 'artUrl2', ['image2', 'art_url2', 'scryfallCrop2', 'commanderArt2']) : '',
      games: 0,
      wins: 0,
      posSum: 0,
      unregistered: false
    };

    deckList.push(entry);

    // A logged commander can be the combined label, the primary or the partner name.
    const names = [label, c1];
    if (c2) names.push(c2);
    names.filter(name => name).forEach(name => {
      const key = `${playerKey}::${name.toLowerCase()}`;
      if (!deckLookup.has(key)) deckLookup.set(key, entry);
    });
  });

  // 2) Walk every logged pod and accumulate results per player and per deck.
  rawMatches.forEach(match => {
    if (!match || !Array.isArray(match.players)) return;

    match.players.forEach(p => {
      if (!p || !p.player) return;

      const playerKey = p.player.toLowerCase();
      const position = Number(p.position) || 0;

      let playerEntry = playerMap.get(playerKey);
      if (!playerEntry) {
        playerEntry = { player: p.player, playerKey: playerKey, games: 0, wins: 0, posSum: 0 };
        playerMap.set(playerKey, playerEntry);
      }
      playerEntry.games += 1;
      playerEntry.posSum += position;
      if (position === 1) playerEntry.wins += 1;

      const commanderName = (p.commander || '').trim();
      const deckKey = `${playerKey}::${commanderName.toLowerCase()}`;

      let deckEntry = deckLookup.get(deckKey);
      if (!deckEntry) {
        // Result logged with a commander that is not part of the registered roster.
        deckEntry = {
          player: p.player,
          playerKey: playerKey,
          commander1: commanderName,
          commander2: '',
          label: commanderName,
          colorIdentity: 'C',
          artUrl1: '',
          artUrl2: '',
          games: 0,
          wins: 0,
          posSum: 0,
          unregistered: true
        };
        deckList.push(deckEntry);
        deckLookup.set(deckKey, deckEntry);
      }
      deckEntry.games += 1;
      deckEntry.posSum += position;
      if (position === 1) deckEntry.wins += 1;
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

  const players = Array.from(playerMap.values()).map(playerEntry => {
    const ownDecks = deckList.filter(d => d.playerKey === playerEntry.playerKey);
    const playedDecks = ownDecks
      .filter(d => d.games > 0)
      .sort((a, b) => (b.games - a.games) || (b.wins - a.wins));
    const signatureDeck = playedDecks[0] || ownDecks[0] || null;

    return finalizeEntry(Object.assign(playerEntry, {
      deckCount: ownDecks.length,
      signatureDeck: signatureDeck ? signatureDeck.label : 'No deck registered',
      colorIdentity: signatureDeck ? signatureDeck.colorIdentity : 'C',
      artUrl1: signatureDeck ? signatureDeck.artUrl1 : ''
    }));
  });

  return { players: players, decks: deckList };
}

// Every entry sharing the best score (ties included).
function topEntries(entries, scoreFn, direction = 'desc', qualifier = null) {
  const pool = entries.filter(entry => entry.games > 0 && (!qualifier || qualifier(entry)));
  if (pool.length === 0) return [];

  const best = pool.reduce((acc, entry) => {
    const value = scoreFn(entry);
    if (acc === null) return value;
    return direction === 'asc' ? Math.min(acc, value) : Math.max(acc, value);
  }, null);

  return pool.filter(entry => scoreFn(entry) === best);
}

// Same as topEntries, but falls back to everyone when nobody meets the minimum games played.
function pickAwardEntries(entries, scoreFn, direction = 'desc', minGames = MIN_GAMES_FOR_RANKING) {
  const qualified = topEntries(entries, scoreFn, direction, entry => entry.games >= minGames);
  if (qualified.length > 0) return { entries: qualified, fallback: false };
  return { entries: topEntries(entries, scoreFn, direction), fallback: true };
}

function sortLeaderboardEntries(entries, sortKey) {
  const scoreFn = sortKey === 'winRate' ? (entry => entry.winRateNum)
    : sortKey === 'avgPos' ? (entry => entry.avgPosNum)
      : sortKey === 'games' ? (entry => entry.games)
        : (entry => entry.wins);
  const direction = sortKey === 'avgPos' ? 1 : -1;

  return entries.filter(entry => entry.games > 0).sort((a, b) => {
    const diff = (scoreFn(a) - scoreFn(b)) * direction;
    if (diff !== 0) return diff;
    if (b.games !== a.games) return b.games - a.games;
    return String(a.label || a.player).localeCompare(String(b.label || b.player));
  });
}

/* ============================================================================
   LEADERBOARD RENDERING
   ============================================================================ */

function renderLeaderboard() {
  const awardsEl = document.getElementById('leaderboardAwards');
  const recordsEl = document.getElementById('leaderboardRecords');
  const playerBody = document.getElementById('playerLeaderboardRows');
  const deckBody = document.getElementById('deckLeaderboardRows');
  if (!awardsEl || !playerBody || !deckBody) return;

  if (rawDecks.length === 0 && rawMatches.length === 0) {
    awardsEl.innerHTML = '';
    recordsEl.innerHTML = '';
    playerBody.innerHTML = '<tr><td class="empty-row" colspan="7">No match data logged yet.</td></tr>';
    deckBody.innerHTML = '<tr><td class="empty-row" colspan="7">No match data logged yet.</td></tr>';
    return;
  }

  const stats = buildLeaderboardStats();

  renderLeaderboardAwards(stats, awardsEl);
  renderLeaderboardRecords(stats, recordsEl);
  renderPlayerLeaderboardTable(stats, playerBody);
  renderDeckLeaderboardTable(stats, deckBody);
}

// Award cards borrow the Players tab's .player-card markup (card-left-column,
// card-left-info, player-name-title, player-mana-row, card-right-stats) so the two
// tabs share one visual design: same photo background, overlay, rounded corners,
// box-shadow and hover-revealed stat panel.
function buildAwardCardHTML(award) {
  const hasEntries = Boolean(award.entries && award.entries.length > 0);

  if (!hasEntries) {
    return `
      <div class="player-card award-card is-empty">
        <div class="card-left-column">
          <div class="card-left-info">
            <div class="award-label">${escapeHTML(award.label)}</div>
            <div class="award-empty">Not enough match data yet.</div>
          </div>
        </div>
      </div>
    `;
  }

  const artCrop = toArtCrop(award.artUrl);
  const bgStyle = artCrop ? ` style="background-image: url('${artCrop}')"` : '';
  const clickAttr = award.onClick ? ` onclick="${award.onClick}"` : '';

  return `
    <div class="player-card award-card"${clickAttr}>
      <div class="card-left-column"${bgStyle}>
        <div class="card-left-info">
          <div class="award-label">${escapeHTML(award.label)}</div>
          <div class="player-name-title">${escapeHTML(award.title)}</div>
          <div class="award-sub">${escapeHTML(award.subtitle)}</div>
          ${award.manaHTML ? `<div class="player-mana-row">${award.manaHTML}</div>` : ''}
        </div>
      </div>
      <div class="card-right-column">
        <div class="card-right-stats">
          <div class="stat-box">
            <span class="stat-value">${escapeHTML(award.stat1.value)}</span>
            <span class="stat-label">${escapeHTML(award.stat1.label)}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-box">
            <span class="stat-value win-color">${escapeHTML(award.stat2.value)}</span>
            <span class="stat-label">${escapeHTML(award.stat2.label)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLeaderboardAwards(stats, container) {
  const topPlayer = topEntries(stats.players, entry => entry.wins);
  const topDeck = topEntries(stats.decks, entry => entry.wins);
  const bestPlayerAvg = pickAwardEntries(stats.players, entry => entry.avgPosNum, 'asc');
  const bestDeckAvg = pickAwardEntries(stats.decks, entry => entry.avgPosNum, 'asc');

  const provisionalSub = `Provisional - fewer than ${MIN_GAMES_FOR_RANKING} games played`;
  const qualifiedSub = `Lowest average finishing position (min. ${MIN_GAMES_FOR_RANKING} games)`;

  const awards = [
    {
      label: 'Top Player',
      entries: topPlayer,
      title: topPlayer.map(entry => entry.player).join(' & '),
      subtitle: topPlayer.length > 1 ? `Tied on ${topPlayer[0].wins} wins` : 'Most match wins in the league',
      artUrl: topPlayer.length ? topPlayer[0].artUrl1 : '',
      manaHTML: topPlayer.length ? renderManaSymbols(topPlayer[0].colorIdentity) : '',
      stat1: topPlayer.length ? { value: topPlayer[0].wins, label: 'Wins' } : null,
      stat2: topPlayer.length ? { value: topPlayer[0].winRate, label: 'Win Rate' } : null,
      onClick: topPlayer.length ? `openPlayerFromLeaderboard('${toJsString(topPlayer[0].player)}')` : ''
    },
    {
      label: 'Top Deck',
      entries: topDeck,
      title: topDeck.map(entry => entry.label).join(' & '),
      subtitle: topDeck.length === 1
        ? `Piloted by ${topDeck[0].player}`
        : topDeck.map(entry => `${entry.label} (${entry.player})`).join(', '),
      artUrl: topDeck.length ? topDeck[0].artUrl1 : '',
      manaHTML: topDeck.length ? renderManaSymbols(topDeck[0].colorIdentity) : '',
      stat1: topDeck.length ? { value: topDeck[0].wins, label: 'Wins' } : null,
      stat2: topDeck.length ? { value: topDeck[0].winRate, label: 'Win Rate' } : null,
      onClick: topDeck.length ? `openDeckFromLeaderboard('${toJsString(topDeck[0].player)}','${toJsString(topDeck[0].label)}')` : ''
    },
    {
      label: 'Best Avg Finish (Player)',
      entries: bestPlayerAvg.entries,
      title: bestPlayerAvg.entries.map(entry => entry.player).join(' & '),
      subtitle: bestPlayerAvg.fallback ? provisionalSub : qualifiedSub,
      artUrl: bestPlayerAvg.entries.length ? bestPlayerAvg.entries[0].artUrl1 : '',
      manaHTML: '',
      stat1: bestPlayerAvg.entries.length ? { value: bestPlayerAvg.entries[0].avgPos, label: 'Avg Finish' } : null,
      stat2: bestPlayerAvg.entries.length ? { value: bestPlayerAvg.entries[0].games, label: 'Games' } : null,
      onClick: bestPlayerAvg.entries.length ? `openPlayerFromLeaderboard('${toJsString(bestPlayerAvg.entries[0].player)}')` : ''
    },
    {
      label: 'Best Avg Finish (Deck)',
      entries: bestDeckAvg.entries,
      title: bestDeckAvg.entries.map(entry => entry.label).join(' & '),
      subtitle: bestDeckAvg.fallback ? provisionalSub : qualifiedSub,
      artUrl: bestDeckAvg.entries.length ? bestDeckAvg.entries[0].artUrl1 : '',
      manaHTML: bestDeckAvg.entries.length ? renderManaSymbols(bestDeckAvg.entries[0].colorIdentity) : '',
      stat1: bestDeckAvg.entries.length ? { value: bestDeckAvg.entries[0].avgPos, label: 'Avg Finish' } : null,
      stat2: bestDeckAvg.entries.length ? { value: bestDeckAvg.entries[0].games, label: 'Games' } : null,
      onClick: bestDeckAvg.entries.length ? `openDeckFromLeaderboard('${toJsString(bestDeckAvg.entries[0].player)}','${toJsString(bestDeckAvg.entries[0].label)}')` : ''
    }
  ];

  container.innerHTML = awards.map(buildAwardCardHTML).join('');
}

function renderLeaderboardRecords(stats, container) {
  const rankedPlayers = stats.players.filter(entry => entry.games > 0);
  const mostGames = topEntries(stats.players, entry => entry.games);
  const bestRate = pickAwardEntries(stats.players, entry => entry.winRateNum, 'desc');

  const records = [
    { value: rawMatches.length, label: 'Matches Logged' },
    { value: rankedPlayers.length, label: 'Players Ranked' },
    { value: stats.decks.length, label: 'Decks Tracked' },
    {
      value: mostGames.length ? `${mostGames[0].games} - ${mostGames[0].player}` : 'N/A',
      label: 'Most Games Played'
    },
    {
      value: bestRate.entries.length ? `${bestRate.entries[0].winRate} - ${bestRate.entries[0].player}` : 'N/A',
      label: `Highest Win Rate (min ${MIN_GAMES_FOR_RANKING} games)`
    }
  ];

  container.innerHTML = records.map(record => `
    <div class="record-tile">
      <div class="record-value">${escapeHTML(record.value)}</div>
      <div class="record-label">${escapeHTML(record.label)}</div>
    </div>
  `).join('');
}

function renderPlayerLeaderboardTable(stats, tbody) {
  const rows = sortLeaderboardEntries(stats.players, playerLeaderboardSort);

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td class="empty-row" colspan="7">No player results logged yet.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((entry, idx) => `
    <tr onclick="openPlayerFromLeaderboard('${toJsString(entry.player)}')">
      <td class="rank-cell">${idx + 1}</td>
      <td><span class="player-cell">${escapeHTML(entry.player)}</span></td>
      <td>${entry.deckCount}</td>
      <td>${entry.games}</td>
      <td>${entry.wins}</td>
      <td class="win-cell">${escapeHTML(entry.winRate)}</td>
      <td>${escapeHTML(entry.avgPos)}</td>
    </tr>
  `).join('');
}

function renderDeckLeaderboardTable(stats, tbody) {
  const rows = sortLeaderboardEntries(stats.decks, deckLeaderboardSort);

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td class="empty-row" colspan="7">No deck results logged yet.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((entry, idx) => `
    <tr onclick="openDeckFromLeaderboard('${toJsString(entry.player)}','${toJsString(entry.label)}')">
      <td class="rank-cell">${idx + 1}</td>
      <td>
        <div class="deck-cell"
          title="${entry.unregistered ? 'Logged in a pod but not part of the registered deck roster' : ''}">
          ${renderManaSymbols(entry.colorIdentity)}
          <span>${escapeHTML(entry.label)}</span>
        </div>
      </td>
      <td class="pilot-cell">${escapeHTML(entry.player)}</td>
      <td>${entry.games}</td>
      <td>${entry.wins}</td>
      <td class="win-cell">${escapeHTML(entry.winRate)}</td>
      <td>${escapeHTML(entry.avgPos)}</td>
    </tr>
  `).join('');
}