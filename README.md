# Vaite Car Spares (carsparesvaite.co.ke)

Zero-dependency store: static frontend + Node.js JSON API. Needs only Node 18+ (no npm install).

## Run
    node server.js          # http://localhost:3000
    ADMIN_KEY=secret PORT=8080 node server.js

## Structure
- config.js            shop details, M-Pesa paybill, currency rates, shipping
- server.js            backend (static files, API, rate limit, security headers)
- data/*.json          products, orders, subscribers, messages (file database)
- public/index.html    frontend
- public/css/styles.css  styling (light and dark mode)
- public/js/app.js     catalogue, search, filters, cart, checkout, wishlist, EN/SW, currencies

## API
GET  /api/config | /api/products?q=&cat=&make=&sort=low|high
POST /api/orders | /api/subscribe | /api/contact
Admin (header x-admin-key): GET /api/admin/orders, POST /api/admin/products, DELETE /api/admin/products/:id

## Before going live
1. Edit config.js: real phone, WhatsApp, address, paybill/account, and set ADMIN_KEY.
2. Replace sample products in data/products.json (add image URLs under public/img/).
3. Update currency rates in config.js regularly.
4. Deploy behind HTTPS (Nginx/Caddy or a host like Render/Railway) and point carsparesvaite.co.ke at it.
5. Card payments and automatic M-Pesa STK push need a provider (Pesapal, Flutterwave, Daraja); orders currently confirm via WhatsApp.
6. For high traffic, move data/ to PostgreSQL or MongoDB.
