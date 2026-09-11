(function () {
  'use strict';
  const key = 'paywizard.advertising.v1';
  const D = window.PaywizardAdvertisingDomain;
  const urls = new Map();
  let database;
  function seed() {
    const assets = [
      { id: 'coffee', name: 'A better coffee break', advertiser: 'Brew & Co.', type: 'image', mime: 'image/svg+xml', width: 800, height: 1200, bytes: 2048, url: 'assets/advertising/coffee.svg' },
      { id: 'fresh', name: 'Fresh for your day', advertiser: 'Orchard', type: 'image', mime: 'image/svg+xml', width: 800, height: 1200, bytes: 2048, url: 'assets/advertising/fresh.svg' },
      { id: 'bun', name: 'Made for your break', advertiser: 'Meat The Bun', type: 'image', mime: 'image/svg+xml', width: 800, height: 1200, bytes: 2048, url: 'assets/advertising/bun.svg' },
      { id: 'coffee-video', name: 'Coffee in motion', advertiser: 'Brew & Co.', type: 'video', mime: 'video/mp4', width: 480, height: 720, seconds: 6, bytes: 40000, url: 'assets/advertising/coffee.mp4', poster: 'assets/advertising/coffee.svg' }
    ];
    const terminals = [
      { sn: 'WP6267UQ36002376', name: 'Midtown Vending', merchant: '1 of a Kind World Travel LLC', store: 'Midtown Store', online: true },
      { sn: 'NYC-Q3-0042', name: 'Lobby Vending Q3', merchant: '1 of a Kind World Travel LLC', store: 'Midtown Store', online: true },
      { sn: 'NYC-Q3-0043', name: 'Breakroom Cooler Q3', merchant: '1 of a Kind World Travel LLC', store: 'Midtown Store', online: false },
      { sn: 'WP53307Q39000001', name: 'Meat The Bun Terminal', merchant: 'Meat The Bun Ltd', store: 'Main Store', online: true }
    ];
    const base = { advertiser: 'Brew & Co.', mode: 'embedded', mediaType: 'image', idleSeconds: 30, order: 'sequential', fit: 'contain', alwaysOn: true, start: '', end: '' };
    const campaigns = [
      { ...base, id: 'morning-coffee', name: 'Everyday coffee', items: [{ assetId: 'coffee', seconds: 8 }, { assetId: 'fresh', seconds: 8 }], targets: terminals.slice(0, 3).map(t => t.sn) },
      { ...base, id: 'lunch-break', name: 'Lunch break', advertiser: 'Meat The Bun', mode: 'fullscreen', items: [{ assetId: 'bun', seconds: 10 }, { assetId: 'fresh', seconds: 8 }], targets: [terminals[3].sn] },
      { ...base, id: 'coffee-moments', name: 'Coffee moments', mode: 'fullscreen', mediaType: 'video', items: [{ assetId: 'coffee-video', seconds: 6 }], targets: [] }
    ];
    const state = { schema: 2, assets, terminals, campaigns: [], assignments: {} };
    D.publish(state, campaigns[0]);
    state.campaigns.push(campaigns[1], campaigns[2]);
    return state;
  }
  function read() {
    const raw = localStorage.getItem(key);
    if (!raw) return seed();
    const value = JSON.parse(raw);
    if (![1, 2].includes(value.schema) || !Array.isArray(value.assets) || !Array.isArray(value.campaigns) || !Array.isArray(value.terminals)) throw new Error('Saved advertising data could not be read. Existing browser data has been preserved.');
    return D.upgrade(value);
  }
  function save(state) { localStorage.setItem(key, JSON.stringify(state)); }
  function db() {
    if (!database) database = new Promise((resolve, reject) => {
      const request = indexedDB.open('paywizard.advertising.media.v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('media');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Browser media storage is unavailable.'));
    });
    return database;
  }
  async function put(id, file) {
    const conn = await db();
    return new Promise((resolve, reject) => { const tx = conn.transaction('media', 'readwrite'); tx.objectStore('media').put(file, id); tx.oncomplete = resolve; tx.onerror = () => reject(new Error('The file could not be saved. Browser storage may be full.')); tx.onabort = tx.onerror; });
  }
  async function remove(id) {
    const conn = await db();
    return new Promise((resolve, reject) => { const tx = conn.transaction('media', 'readwrite'); tx.objectStore('media').delete(id); tx.oncomplete = resolve; tx.onerror = reject; });
  }
  async function url(asset) {
    if (asset.url) return asset.url;
    if (urls.has(asset.id)) return urls.get(asset.id);
    const conn = await db();
    const file = await new Promise((resolve, reject) => { const request = conn.transaction('media').objectStore('media').get(asset.id); request.onsuccess = () => resolve(request.result); request.onerror = reject; });
    if (!file) throw new Error('Media file is missing from this browser. Upload it again.');
    const result = URL.createObjectURL(file);
    urls.set(asset.id, result);
    return result;
  }
  window.PaywizardAdvertisingStore = { read, save, put, remove, url };
})();
