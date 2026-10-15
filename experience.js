/* Progressive motion, consistent icons and keyboard support. No application
 * data, authentication, API calls or permissions are changed here. */
document.addEventListener('DOMContentLoaded', () => {
  if (location.protocol === 'file:') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const constrained = navigator.connection?.saveData ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  let enhanced = false;
  const revealSelector = '.hero-editorial-copy,.dashboard-heading,.academic-strip,.mission-grid,.hero-quote,.hero-institutional-facts,.hero-skills-block,.hero-steps-block,.home-dynamic,.home-most-used,.kit-card,.career-card,.representative,.portal-card,.footer-editorial';
  const seen = new WeakSet();
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: .06, rootMargin: '0px 0px 35px 0px' }) : null;
  function registerReveals(root) {
    if (!enhanced || !revealObserver) return;
    const items = root.matches?.(revealSelector) ? [root] : [];
    items.push(...root.querySelectorAll?.(revealSelector) || []);
    for (const [index, node] of items.entries()) {
      if (seen.has(node)) continue;
      seen.add(node);
      node.style.setProperty('--reveal-delay', Math.min(index % 4 * 45, 135) + 'ms');
      node.classList.add('reveal-ready');
      revealObserver.observe(node);
    }
  }
  function updateMotion() {
    enhanced = !reduced.matches && !constrained && Boolean(revealObserver);
    document.body.dataset.motion = enhanced ? 'enhanced' : 'minimal';
    if (!enhanced) {
      revealObserver?.disconnect();
      document.querySelectorAll('.reveal-ready').forEach(node => node.classList.add('revealed'));
    } else registerReveals(document);
  }
  reduced.addEventListener('change', updateMotion);
  updateMotion();
  // Observe only newly created cards; timers and counter text do not retrigger motion.
  new MutationObserver(records => {
    if (!enhanced) return;
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType === 1) registerReveals(node);
    }
  }).observe(document.getElementById('mainContent'), { childList: true, subtree: true });

  function replaceIcon(node, name) {
    if (!node || typeof interfaceIcon !== 'function') return;
    node.innerHTML = DOMPurify.sanitize(interfaceIcon(name));
    node.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('.tools-tab-button[data-tool-tab]').forEach(button => replaceIcon(button.querySelector('span'), button.dataset.toolTab));
  document.querySelectorAll('.tool-menu-icon').forEach(icon => replaceIcon(icon, icon.closest('[data-service-focus]')?.dataset.serviceFocus));

  // Pointer movement affects decorative geometry only, never the clickable area.
  const art = document.querySelector('.hero-art');
  let pointerFrame = 0, pointerX = 0, pointerY = 0;
  art?.addEventListener('pointermove', event => {
    if (!enhanced || !finePointer.matches) return;
    const rect = art.getBoundingClientRect();
    pointerX = (event.clientX - rect.left - rect.width / 2) / rect.width * 12;
    pointerY = (event.clientY - rect.top - rect.height / 2) / rect.height * 12;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      art.style.setProperty('--art-x', pointerX + 'px');
      art.style.setProperty('--art-y', pointerY + 'px');
      pointerFrame = 0;
    });
  }, { passive: true });
  art?.addEventListener('pointerleave', () => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    art.style.setProperty('--art-x', '0px'); art.style.setProperty('--art-y', '0px');
  });

  // The navigation gains depth once the page scrolls; one passive listener, no layout reads.
  const syncScrolled = () => document.body.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener?.('scroll', syncScrolled, { passive: true });
  syncScrolled();

  // Soft light that follows the pointer across interactive cards (desktop only).
  const spotSelector = '.metric-card,.dashboard-widget,.most-used-grid button,.career-card,.representative,.kit-guide-card,.economic-item,.hero-institutional-facts article,.portal-card,.tool-card';
  let spotFrame = 0, spotTarget = null, spotX = 0, spotY = 0;
  document.addEventListener('pointermove', event => {
    if (!enhanced || !finePointer.matches) return;
    const card = event.target.closest?.(spotSelector);
    if (!card) return;
    spotTarget = card; spotX = event.clientX; spotY = event.clientY;
    if (spotFrame) return;
    spotFrame = requestAnimationFrame(() => {
      spotFrame = 0;
      const rect = spotTarget.getBoundingClientRect();
      spotTarget.classList.add('spot');
      spotTarget.style.setProperty('--mx', (spotX - rect.left) + 'px');
      spotTarget.style.setProperty('--my', (spotY - rect.top) + 'px');
    });
  }, { passive: true });

  let active = null, previous = null;
  const focusables = node => [...node.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
  const dialogObserver = new MutationObserver(() => {
    const dialog = [...document.querySelectorAll('[aria-modal="true"]')]
      .filter(el => !el.hidden && el.getClientRects().length)
      .sort((a,b) => Number(getComputedStyle(a).zIndex || 0) - Number(getComputedStyle(b).zIndex || 0)).at(-1);
    document.body.classList.toggle('dialog-active',Boolean(dialog));
    if (dialog === active) return;
    if (dialog) { if (!active) previous = document.activeElement; active = dialog; focusables(dialog)[0]?.focus({ preventScroll: true }); }
    else if (active) { active = null; if (previous?.isConnected) previous.focus({ preventScroll: true }); }
  });
  dialogObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('keydown', event => {
    if (!active || event.key !== 'Tab') return;
    const items = focusables(active), first = items[0], last = items.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  });
  // Installing the offline cache must not compete with the first page load.
  if ('serviceWorker' in navigator) {
    const register = () => {
      const install = () => navigator.serviceWorker.register('service-worker.js').catch(()=>{});
      if (window.requestIdleCallback) window.requestIdleCallback(install, { timeout: 3000 });
      else window.setTimeout(install, 1000);
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }
});
