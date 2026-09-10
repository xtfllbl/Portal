(function () {
  'use strict';
  // Native display sizes come from the supplied Q3V (UPT) and Q3min datasheets.
  // The quadrilaterals map those displays onto the product photographs' perspective.
  const models = {
    q3v: { name: 'Q3V (UPT)', width: 480, height: 800, bodyWidth: 846, bodyHeight: 1269, corners: [[318, 315], [671, 309], [668, 920], [320, 937]] },
    q3min: { name: 'Q3min', width: 480, height: 480, bodyWidth: 782, bodyHeight: 963, corners: [[88, 140], [739, 164], [739, 846], [88, 874]] }
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function projection(model) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = model.corners;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const denominator = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / denominator;
    const h = (dx1 * dy3 - dx3 * dy1) / denominator;
    return `matrix3d(${[(x1 - x0 + g * x1) / model.width, (y1 - y0 + g * y1) / model.width, 0, g / model.width, (x3 - x0 + h * x3) / model.height, (y3 - y0 + h * y3) / model.height, 0, h / model.height, 0, 0, 1, 0, x0, y0, 0, 1].join(',')})`;
  }
  function mount({ host, status, campaign, modelId = 'q3v', assetFor, urlFor, sn = 'WP53307Q39000001', merchant = 'Meat The Bun Ltd' }) {
    const D = window.PaywizardAdvertisingDomain;
    const c = D.copy(campaign);
    const model = models[modelId] || models.q3v;
    if (!models[modelId]) modelId = 'q3v';
    host.innerHTML = `<div class="ads-device-stage" data-model="${modelId}" style="aspect-ratio:${model.bodyWidth}/${model.bodyHeight}"><div class="ads-hardware" style="width:${model.bodyWidth}px;height:${model.bodyHeight}px"><img class="ads-device-body" src="assets/advertising/${modelId}-body.png" alt="${model.name} terminal" style="mask-image:url(assets/advertising/${modelId}-mask.png)"><div class="ads-native-display ${modelId}" data-width="${model.width}" data-height="${model.height}" style="width:${model.width}px;height:${model.height}px;transform:${projection(model)}"></div></div></div>`;
    const stage = host.querySelector('.ads-device-stage');
    const hardware = host.querySelector('.ads-hardware');
    const display = host.querySelector('.ads-native-display');
    const resize = () => { hardware.style.transform = `scale(${stage.clientWidth / model.bodyWidth})`; };
    const observer = new ResizeObserver(resize); observer.observe(stage); resize();
    let disposed = false, timer, idleTimer, generation = 0, index = 0, order = [], mediaNode = null, inPayment = false, suspended = false;
    const report = text => { status.textContent = text; };
    function screen(center = '<div class="ads-ready">Ready for<br>Payment</div>', overlay = '') {
      display.innerHTML = `<div class="ads-device"><div class="ads-device-head"><span>${escape(sn)}</span><span>13:38</span></div><div class="ads-device-center">${center}</div><div class="ads-device-payments"><span class="ads-pay-brand"><img src="assets/payment-brands/visa.svg" alt="Visa"></span><span class="ads-pay-brand"><img src="assets/payment-brands/mastercard.svg" alt="Mastercard"></span><span class="ads-pay-brand">AMEX</span><span class="ads-pay-brand">DISCOVER</span><span class="ads-pay-brand">UnionPay</span><span class="ads-pay-brand">Apple Pay</span><span class="ads-pay-brand">G Pay</span></div><div class="ads-terminal-logo">wizar<span>POS</span></div><div class="ads-device-footer"><span>${escape(merchant)}</span><span>43230039</span></div>${overlay}</div>`;
    }
    function halt() {
      generation++; clearTimeout(timer); clearTimeout(idleTimer);
      if (mediaNode?.tagName === 'VIDEO') { mediaNode.pause(); mediaNode.removeAttribute('src'); mediaNode.load(); }
      mediaNode = null;
    }
    function payment(wakeup = false) {
      halt(); inPayment = true;
      screen(wakeup ? undefined : '<div class="ads-ready">Payment<br>in progress</div>');
      report(wakeup ? 'Ready for payment' : 'Payment in progress');
    }
    function makeOrder() {
      order = c.items.map((_, i) => i);
      if (c.order === 'shuffle') for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      index = 0;
    }
    async function playNext() {
      if (disposed || inPayment || suspended) return;
      halt();
      if (!D.scheduled(c)) { screen(); report('Outside scheduled hours'); return; }
      if (!c.items.length) { screen(); report('Add media to the playlist'); return; }
      if (!order.length || index >= order.length) makeOrder();
      const item = c.items[order[index++]];
      const asset = item.asset || assetFor(item.assetId);
      const token = generation;
      if (!asset || asset.type !== c.mediaType) { screen(); report('Missing or incompatible media'); return; }
      report(`Loading ${asset.name}…`);
      let src;
      try { src = await urlFor(asset); } catch (_) { if (!disposed && token === generation) { screen(); report('Media unavailable'); } return; }
      if (disposed || token !== generation) return;
      const slot = '<div class="ads-live-media-slot"></div>';
      if (c.mode === 'embedded') screen(slot);
      else screen(undefined, `<div class="ads-screen-overlay" role="button" tabindex="0" aria-label="Touch to start payment">${slot}<div class="ads-touch-hint">Touch to start</div></div>`);
      const node = document.createElement(asset.type === 'image' ? 'img' : 'video');
      mediaNode = node; node.className = 'ads-screen-media'; node.style.objectFit = c.fit === 'cover' ? 'cover' : 'contain';
      if (asset.type === 'image') node.alt = asset.name;
      let started = false;
      const begin = () => {
        if (disposed || token !== generation || started) return;
        started = true; report(`${index} / ${order.length} · ${asset.name}`);
        if (asset.type === 'image') timer = setTimeout(playNext, Math.max(3, Math.min(120, Number(item.seconds) || 8)) * 1000);
      };
      const fail = () => { if (!disposed && token === generation) { halt(); screen(); report('Media failed to load'); } };
      node.onerror = fail;
      if (asset.type === 'image') node.onload = begin;
      else { node.muted = true; node.playsInline = true; node.onplaying = begin; node.onended = () => { if (!disposed && token === generation) playNext(); }; }
      display.querySelector('.ads-live-media-slot').appendChild(node); node.src = src;
      if (asset.type === 'video') node.play().catch(fail);
      const wake = display.querySelector('.ads-screen-overlay');
      if (wake) { wake.onclick = () => payment(true); wake.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); payment(true); } }; }
    }
    function idle(immediate = false) {
      halt(); inPayment = false; screen();
      if (!D.scheduled(c)) { report('Outside scheduled hours'); return; }
      if (c.mode === 'fullscreen' && !immediate) {
        let remaining = Math.max(5, Number(c.idleSeconds) || 30);
        const tick = () => { if (disposed || inPayment || suspended) return; if (remaining <= 0) playNext(); else { report(`Starts in ${remaining--}s`); idleTimer = setTimeout(tick, 1000); } };
        tick();
      } else playNext();
    }
    function restart() { index = 0; order = []; idle(true); }
    const visibility = () => { suspended = document.hidden; if (suspended) { halt(); report('Paused'); } else if (!inPayment) idle(true); };
    document.addEventListener('visibilitychange', visibility);
    let wasScheduled = D.scheduled(c);
    const scheduleTimer = setInterval(() => {
      const scheduled = D.scheduled(c);
      if (!scheduled && wasScheduled && !inPayment) { halt(); screen(); report('Outside scheduled hours'); }
      else if (scheduled && !wasScheduled && !inPayment && !suspended) idle();
      wasScheduled = scheduled;
    }, 500);
    idle(true);
    return { restart, payment, idle, dispose() { disposed = true; halt(); clearInterval(scheduleTimer); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); } };
  }
  window.PaywizardAdvertisingPreview = { models, mount };
})();
