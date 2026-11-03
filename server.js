// Zero-dependency Node.js backend: static files + JSON API. Run: node server.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const cfg = require('./config');
const ROOT = __dirname;
const PUB = fs.existsSync(path.join(ROOT, 'public')) ? path.join(ROOT, 'public') : ROOT;
const DATA = fs.existsSync(path.join(ROOT, 'data')) ? path.join(ROOT, 'data') : ROOT;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif' };
const read = f => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return []; } };
const write = (f, d) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(d, null, 2));
const hits = new Map(); // tiny rate limiter: 60 req/min/IP on POST
const limited = ip => { const n = Date.now(), h = (hits.get(ip) || []).filter(t => n - t < 6e4); h.push(n); hits.set(ip, h); return h.length > 60; };
const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8', 'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'SAMEORIGIN', 'Referrer-Policy':'strict-origin-when-cross-origin' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const body = req => new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) { req.destroy(); no(); } }); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { ok({}); } }); });
const clean = (s, n = 200) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
const isAdmin = req => req.headers['x-admin-key'] === cfg.adminKey;

async function api(req, res, u) {
  const ip = req.socket.remoteAddress;
  if (req.method === 'POST' && limited(ip)) return send(res, 429, { error: 'Too many requests' });
  const p = u.pathname;
  if (req.method === 'GET' && p === '/api/config') return send(res, 200, { shop: { ...cfg.shop }, rates: cfg.rates, base: cfg.baseCurrency, shipping: cfg.shipping });
  if (req.method === 'GET' && p === '/api/products') {
    const q = (u.searchParams.get('q') || '').toLowerCase(), cat = u.searchParams.get('cat'), make = u.searchParams.get('make'), sort = u.searchParams.get('sort');
    const all = read('products.json');
    let list = all.filter(x => (!cat || x.category === cat) && (!make || x.make === make) &&
      (!q || [x.name, x.sku, x.oem, x.make, x.model, x.category].join(' ').toLowerCase().includes(q)));
    if (sort === 'low') list.sort((a, b) => a.price - b.price); else if (sort === 'high') list.sort((a, b) => b.price - a.price);
    const count = (k) => Object.entries(all.reduce((m, x) => (m[x[k]] = (m[x[k]] || 0) + 1, m), {})).map(([name, n]) => ({ name, n }));
    return send(res, 200, { products: list, categories: count('category'), makes: count('make') });
  }
  if (req.method === 'POST' && p === '/api/orders') {
    const d = await body(req), products = read('products.json'); let subtotal = 0;
    const items = (Array.isArray(d.items) ? d.items : []).slice(0, 50).map(i => {
      const pr = products.find(x => x.id === i.id); if (!pr) return null;
      const qty = Math.max(1, Math.min(99, parseInt(i.qty) || 1)); subtotal += pr.price * qty;
      return { id: pr.id, name: pr.name, sku: pr.sku, qty, price: pr.price };
    }).filter(Boolean);
    if (!items.length) return send(res, 400, { error: 'Cart is empty' });
    const c = d.customer || {}, country = clean(c.country, 60) || 'Kenya';
    const ship = country.toLowerCase() === 'kenya' ? cfg.shipping.Kenya.KES : cfg.shipping.international.KES;
    const order = { ref: 'VCS-' + crypto.randomBytes(3).toString('hex').toUpperCase(), createdAt: new Date().toISOString(), status: 'new',
      customer: { name: clean(c.name, 80), phone: clean(c.phone, 30), email: clean(c.email, 100), country, city: clean(c.city, 60), address: clean(c.address, 200) },
      payment: ['mpesa', 'card', 'cod'].includes(d.payment) ? d.payment : 'mpesa', currency: cfg.rates[d.currency] ? d.currency : 'KES',
      items, subtotal, shipping: ship, total: subtotal + ship };
    if (!order.customer.name || !order.customer.phone) return send(res, 400, { error: 'Name and phone are required' });
    const orders = read('orders.json'); orders.push(order); write('orders.json', orders);
    return send(res, 201, order);
  }
  if (req.method === 'POST' && p === '/api/subscribe') {
    const d = await body(req), email = clean(d.email, 100);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { error: 'Enter a valid email' });
    const s = read('subscribers.json'); if (!s.find(x => x.email === email)) s.push({ name: clean(d.name, 60), email, at: new Date().toISOString() });
    write('subscribers.json', s); return send(res, 201, { ok: true });
  }
  if (req.method === 'POST' && p === '/api/contact') {
    const d = await body(req), m = read('messages.json');
    m.push({ name: clean(d.name, 80), phone: clean(d.phone, 30), message: clean(d.message, 1000), at: new Date().toISOString() });
    write('messages.json', m); return send(res, 201, { ok: true });
  }
  if (p.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });
    if (req.method === 'GET' && p === '/api/admin/orders') return send(res, 200, read('orders.json'));
    if (req.method === 'POST' && p === '/api/admin/products') {
      const d = await body(req), list = read('products.json');
      const item = { id: d.id || 'p' + Date.now(), name: clean(d.name), category: clean(d.category, 60), make: clean(d.make, 40), model: clean(d.model, 40),
        year: clean(d.year, 20), sku: clean(d.sku, 40), oem: clean(d.oem, 40), price: Number(d.price) || 0, stock: Number(d.stock) || 0, image: clean(d.image, 300) };
      const i = list.findIndex(x => x.id === item.id); i >= 0 ? list[i] = item : list.push(item); write('products.json', list); return send(res, 200, item);
    }
    if (req.method === 'DELETE' && p.startsWith('/api/admin/products/')) { write('products.json', read('products.json').filter(x => x.id !== p.split('/').pop())); return send(res, 200, { ok: true }); }
  }
  send(res, 404, { error: 'Not found' });
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname.startsWith('/api/')) return await api(req, res, u);
    let f = path.normalize(path.join(PUB, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname)));
    if (!f.startsWith(PUB)) return send(res, 403, 'Forbidden', 'text/plain');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      const fallback = path.join(PUB, 'index.html');
      if (fs.existsSync(fallback) && !fs.statSync(fallback).isDirectory()) {
        f = fallback;
      } else {
        const rootIndex = path.join(ROOT, 'index.html');
        if (fs.existsSync(rootIndex) && !fs.statSync(rootIndex).isDirectory()) f = rootIndex;
        else return send(res, 404, { error: 'Page not found' }, 'application/json');
      }
    }
    send(res, 200, fs.readFileSync(f), MIME[path.extname(f)] || 'application/octet-stream');
  } catch { send(res, 400, { error: 'Bad request' }); }
}).listen(cfg.port, () => console.log(`${cfg.shop.name} running on http://localhost:${cfg.port}`));
