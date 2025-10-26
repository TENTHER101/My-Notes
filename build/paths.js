// Compute a base path relative to the current location so this works at root or under a subpath.
// Example: when hosted at https://.../My-Notes/home/, BASE_URL === '/My-Notes/home'
const BASE_URL = (new URL('.', location)).pathname.replace(/\/$/, '');

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
