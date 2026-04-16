#!/usr/bin/env node
// Pings IndexNow endpoints (Bing + Yandex) so they re-crawl the listed URLs immediately.
// Run after a deploy: `npm run indexnow`

const HOST = "workflows.no";
const KEY = "fc815671ee0b445b910ee21274920669";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const urls = [
  `https://${HOST}/`,
  `https://${HOST}/ai-haugesund`,
  `https://${HOST}/ai-agenter`,
  `https://${HOST}/chatboter`,
  `https://${HOST}/automatiserte-flyter`,
  `https://${HOST}/software-utvikling-haugesund`,
  `https://${HOST}/kunstig-intelligens-haugesund`,
  `https://${HOST}/kunder`,
  `https://${HOST}/kunder/csub`,
  `https://${HOST}/kunder/saga-subsea`,
  `https://${HOST}/kunder/elementlab`,
  `https://${HOST}/faq`,
];

const endpoints = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
];

const body = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
};

for (const endpoint of endpoints) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    console.log(`${endpoint} → ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error(`${endpoint} → FAILED: ${err.message}`);
  }
}
