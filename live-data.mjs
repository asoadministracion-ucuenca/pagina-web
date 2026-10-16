// Live market indicators and economic headlines for the home page.
// The server queries the public sources and caches the result, so every visitor
// shares one request and the browser never depends on third-party CORS.

// Ecuadorian convention: point for thousands, comma for decimals.
const num = (value, digits) => value.toLocaleString('es-EC', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: 'always' });
const INDICATORS = [
  { key: 'eur', symbol: 'EURUSD=X', label: '1 euro en dólares', format: v => `$${num(v, 4)}` },
  { key: 'cop', symbol: 'COP=X', label: '1 dólar en pesos colombianos', format: v => `COP ${num(v, 2)}` },
  { key: 'pen', symbol: 'PEN=X', label: '1 dólar en soles peruanos', format: v => `S/ ${num(v, 4)}` },
  { key: 'wti', symbol: 'CL=F', label: 'Petróleo WTI (barril)', format: v => `$${num(v, 2)}` },
  { key: 'gold', symbol: 'GC=F', label: 'Oro (onza troy)', format: v => `$${num(v, 2)}` },
  { key: 'btc', symbol: 'BTC-USD', label: 'Bitcoin', format: v => `$${num(v, 0)}` }
];
const NEWS_QUERY = '(economía OR empresas OR negocios OR mercado) Ecuador when:3d';
const NEWS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(NEWS_QUERY)}&hl=es-419&gl=EC&ceid=EC:es-419`;
const UA = { 'User-Agent': 'Mozilla/5.0 (ASO ADE portal)' };

export const INDICATORS_TTL = 60_000;
export const NEWS_TTL = 10 * 60_000;

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = text => String(text || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, code) => code[0] === '#'
    ? String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)))
    : entities[code.toLowerCase()] ?? m)
  .trim();
const tag = (xml, name) => decode(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(xml)?.[1]);

export function parseNewsRss(xml, limit = 6) {
  const items = [];
  for (const [, item] of String(xml).matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const source = tag(item, 'source');
    let title = tag(item, 'title');
    // Google News appends " - Source" to each title.
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const link = tag(item, 'link');
    const date = new Date(tag(item, 'pubDate'));
    if (!title || !/^https:\/\//.test(link)) continue;
    items.push({ title, link, source, date: Number.isNaN(date.getTime()) ? null : date.toISOString() });
  }
  return items.sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, limit);
}

function cached(ttl, load) {
  let cache = null, inFlight = null;
  return async () => {
    if (cache && Date.now() - cache.time < ttl) return cache.data;
    if (inFlight) return inFlight;
    inFlight = load(cache?.data).then(data => { cache = { time: Date.now(), data }; return data; })
      // Keep serving the last good data when a source fails.
      .catch(error => {
        if (!cache) throw error;
        cache = { time: Date.now(), data: { ...cache.data, stale: true } };
        return cache.data;
      })
      .finally(() => { inFlight = null; });
    return inFlight;
  };
}

export function createLiveData({ fetchImpl = fetch } = {}) {
  async function quote(item) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?range=1d&interval=15m`;
    const response = await fetchImpl(url, { headers: UA, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const meta = (await response.json())?.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice);
    if (!Number.isFinite(price)) throw new Error('Sin precio');
    const previous = Number(meta.chartPreviousClose ?? meta.previousClose);
    const change = Number.isFinite(previous) && previous ? ((price - previous) / previous) * 100 : null;
    return { key: item.key, label: item.label, value: price, display: item.format(price), change,
      time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null };
  }

  const indicators = cached(INDICATORS_TTL, async previous => {
    const results = await Promise.allSettled(INDICATORS.map(quote));
    const items = results.map((result, i) => result.status === 'fulfilled' ? result.value
      : previous?.items?.find(row => row.key === INDICATORS[i].key && row.value != null) ?? { key: INDICATORS[i].key, label: INDICATORS[i].label, value: null, display: 'No disponible', change: null, time: null });
    if (!results.some(r => r.status === 'fulfilled')) throw new Error('Ninguna fuente de indicadores respondió.');
    return { ok: true, source: 'Yahoo Finance', updatedAt: new Date().toISOString(), refreshSeconds: INDICATORS_TTL / 1000, items };
  });

  const news = cached(NEWS_TTL, async () => {
    const response = await fetchImpl(NEWS_URL, { headers: UA, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = parseNewsRss(await response.text());
    if (!items.length) throw new Error('Sin titulares');
    return { ok: true, source: 'Google Noticias', updatedAt: new Date().toISOString(), refreshSeconds: NEWS_TTL / 1000, items };
  });

  return { indicators, news };
}
