// Base URL for GitHub Pages (when hosted at TENTHER101.github.io/My-Notes)
const BASE_URL = location.hostname === 'TENTHER101.github.io' ? '/My-Notes' : '';

// Add base URL to all cache paths
const urlsToCache = [
    `${BASE_URL}/`,
    `${BASE_URL}/index.html`,
    `${BASE_URL}/manifest.json`,
    `${BASE_URL}/images/icon-192x192.png`,
    `${BASE_URL}/images/icon-512x512.png`,
    `${BASE_URL}/offline.html`,
    `${BASE_URL}/script.js`,
    `${BASE_URL}/sw.js`
];
