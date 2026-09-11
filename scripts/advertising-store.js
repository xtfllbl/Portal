(function () {
  'use strict';
  const key = 'paywizard.advertising.v1';
  const D = window.PaywizardAdvertisingDomain;
  const urls = new Map();
  let database;
  function addSampleCatalog(state) {
    // Append this batch once, including for existing browsers. Later reads must
    // preserve edits and deletions, uploaded files and published assignments.
    if (state.sampleCatalogVersion >= 1) return state;
    const assets = [
      ['sample-square-native', 'square-special_480.jpg', 480, 480, 27146],
      ['sample-square-social', 'social-post_1080.jpg', 1080, 1080, 93341],
      ['sample-square-menu', 'square-menu-v3.webp', 720, 720, 11298],
      ['sample-square-avatar', 'avatar_download.jpg', 240, 240, 11708],
      ['sample-square-tiny', 'logo_thumbnail_96.jpg', 96, 96, 2443],
      ['sample-portrait-native', 'portrait-screen_480x800.jpg', 480, 800, 42637],
      ['sample-portrait-phone', 'phone-upload_540x960.jpg', 540, 960, 30293],
      ['sample-portrait-story', 'story_export_720x1280.webp', 720, 1280, 213756],
      ['sample-portrait-poster', 'poster_final_900x1600.jpg', 900, 1600, 142970],
      ['sample-landscape-tv', 'TV-banner_1920x1080.jpg', 1920, 1080, 246409],
      ['sample-landscape-sale', 'landscape-sale_1280x720.jpg', 1280, 720, 84597],
      ['sample-landscape-camera', 'camera-original_1024x768.jpg', 1024, 768, 103483],
      ['sample-ultrawide-banner', 'banner_final_FINAL_2400x300.jpg', 2400, 300, 151609],
      ['sample-ultrawide-header', 'website-header_1800x240.jpg', 1800, 240, 126577],
      ['sample-ultratall-poster', 'long-poster_320x1800.jpg', 320, 1800, 47290],
      ['sample-ultratall-strip', 'long-upload_256x2048.jpg', 256, 2048, 36554],
      ['sample-odd-landscape', 'cropped-copy_641x479.jpg', 641, 479, 44353],
      ['sample-odd-portrait', 'portrait-crop_479x641.jpg', 479, 641, 63215],
      ['sample-almost-square', 'almost-square_300x298.jpg', 300, 298, 7105],
      ['sample-tiny-portrait', 'chat-thumbnail_80x120.jpg', 80, 120, 2115]
    ].map(([id, name, width, height, bytes]) => ({ id, name, width, height, bytes, type: 'image', mime: name.endsWith('.webp') ? 'image/webp' : 'image/jpeg', url: `assets/advertising/samples/${name}` }));
    const playlist = ids => ids.map(id => ({ assetId: `sample-${id}`, seconds: 8 }));
    const base = { mode: 'fullscreen', mediaType: 'image', idleSeconds: 30, order: 'sequential', fit: 'contain', alwaysOn: true, start: '', end: '' };
    const campaigns = [
      { id: 'sample-square-fit', name: 'Square screen - full image', items: playlist(['square-native', 'square-menu', 'square-social']) },
      { id: 'sample-square-fill', name: 'Square screen - fill and crop', fit: 'cover', items: playlist(['square-social', 'landscape-tv', 'portrait-poster', 'almost-square']) },
      { id: 'sample-square-idle', name: 'Square screen - idle rotation', mode: 'embedded', items: playlist(['square-menu', 'square-native', 'square-avatar']) },
      { id: 'sample-portrait-posters', name: 'Portrait posters', items: playlist(['portrait-native', 'portrait-phone', 'portrait-story', 'portrait-poster']) },
      { id: 'sample-landscape-offers', name: 'Landscape offers', items: playlist(['landscape-tv', 'landscape-sale', 'landscape-camera']) },
      { id: 'sample-long-fit', name: 'Long strips - full image', items: playlist(['ultrawide-banner', 'ultratall-poster', 'ultrawide-header', 'ultratall-strip']) },
      { id: 'sample-long-fill', name: 'Long strips - fill and crop', fit: 'cover', items: playlist(['ultrawide-banner', 'ultratall-poster', 'ultrawide-header', 'ultratall-strip']) },
      { id: 'sample-mixed-uploads', name: 'Mixed customer uploads', mode: 'embedded', items: playlist(['square-tiny', 'tiny-portrait', 'odd-landscape', 'odd-portrait', 'almost-square', 'square-avatar']) }
    ].map(campaign => ({ ...base, ...campaign, targets: [], targetStores: [] }));
    const assetIds = new Set(state.assets.map(asset => asset.id));
    const campaignIds = new Set(state.campaigns.map(campaign => campaign.id));
    state.assets.push(...assets.filter(asset => !assetIds.has(asset.id)));
    // Drafts are ready to preview without claiming any existing terminals.
    state.campaigns.push(...campaigns.filter(campaign => !campaignIds.has(campaign.id)));
    state.sampleCatalogVersion = 1;
    return state;
  }
  function addVideoSampleCatalog(state) {
    if (state.sampleVideoCatalogVersion >= 1) return state;
    const assets = [
      ["coffee-pour","Coffee pour - portrait",360,640,8,66458,"mp4"],
      ["donut-square","Donut close-up - square",480,480,6,73910,"mp4"],
      ["beach-waves","Beach waves - portrait",540,960,10,1039304,"mp4"],
      ["tokyo-street","Tokyo street - landscape",1280,720,12,1990392,"mp4"],
      ["night-traffic","Night traffic - landscape",960,540,12.5,661510,"mp4"],
      ["corgi-lowres","Corgi in the park - low resolution",320,180,5,230198,"webm"],
      ["ink-ultrawide","Ink in motion - ultra-wide",960,240,9,676556,"webm"],
      ["palm-square","Palm sunset - square",720,720,11,1905127,"mp4"]
    ].map(([slug, name, width, height, seconds, bytes, extension]) => ({
      id: `sample-video-${slug}`, name, width, height, seconds, bytes,
      type: 'video', mime: `video/${extension}`,
      url: `assets/advertising/videos/${slug}.${extension}`,
      poster: `assets/advertising/videos/${slug}.jpg`
    }));
    const playlist = ids => ids.map(slug => {
      const asset = assets.find(item => item.id === `sample-video-${slug}`);
      return { assetId: asset.id, seconds: asset.seconds };
    });
    const base = { mode: 'fullscreen', mediaType: 'video', idleSeconds: 30, order: 'sequential', fit: 'contain', alwaysOn: true, start: '', end: '' };
    const campaigns = [
      { id: 'sample-video-square-fit', name: 'Square videos - full frame', items: playlist(['donut-square', 'palm-square']) },
      { id: 'sample-video-square-fill', name: 'Square videos - fill and crop', fit: 'cover', items: playlist(['donut-square', 'coffee-pour', 'night-traffic']) },
      { id: 'sample-video-portrait', name: 'Portrait videos - coffee and coast', items: playlist(['coffee-pour', 'beach-waves']) },
      { id: 'sample-video-landscape', name: 'City and pets - video loop', items: playlist(['tokyo-street', 'night-traffic', 'corgi-lowres']) },
      { id: 'sample-video-ultrawide', name: 'Ultra-wide video - fill screen', fit: 'cover', items: playlist(['ink-ultrawide']) },
      { id: 'sample-video-mixed', name: 'Mixed videos - customer uploads', items: playlist(['corgi-lowres', 'donut-square', 'coffee-pour', 'beach-waves', 'tokyo-street', 'night-traffic', 'ink-ultrawide', 'palm-square']) }
    ].map(campaign => ({ ...base, ...campaign, targets: [], targetStores: [] }));
    const assetIds = new Set(state.assets.map(asset => asset.id));
    const campaignIds = new Set(state.campaigns.map(campaign => campaign.id));
    state.assets.push(...assets.filter(asset => !assetIds.has(asset.id)));
    state.campaigns.push(...campaigns.filter(campaign => !campaignIds.has(campaign.id)));
    // A separate batch preserves edits/deletions from the earlier image catalog.
    state.sampleVideoCatalogVersion = 1;
    return state;
  }
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
    return addVideoSampleCatalog(addSampleCatalog(state));
  }
  function read() {
    const raw = localStorage.getItem(key);
    if (!raw) return seed();
    const value = JSON.parse(raw);
    if (![1, 2].includes(value.schema) || !Array.isArray(value.assets) || !Array.isArray(value.campaigns) || !Array.isArray(value.terminals)) throw new Error('Saved advertising data could not be read. Existing browser data has been preserved.');
    return addVideoSampleCatalog(addSampleCatalog(D.upgrade(value)));
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
