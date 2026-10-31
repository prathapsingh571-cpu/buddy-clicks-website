# Buddy Clicks — T-shirt Ecommerce

A responsive white + royal-blue storefront starter built with Node.js and plain HTML/CSS/JavaScript. It includes a product catalogue, category/search filters, size selection, cart, checkout, order creation, order tracking, and a password-protected admin dashboard for product and order management.

## Requirements
- Node.js 18 or newer
- VS Code

## Run on Windows
1. Install Node.js LTS from https://nodejs.org/ and restart VS Code.
2. Extract this ZIP and open the `buddy-clicks` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run `node --version` to confirm Node is installed.
5. Copy `.env.example` to `.env` and change `ADMIN_PASSWORD` to a long private password. (The starter server currently reads `ADMIN_PASSWORD` from the process environment; easiest PowerShell launch is shown below.)
6. Start the site:
   - PowerShell: `$env:ADMIN_PASSWORD="your-long-private-password"; npm start`
   - Or use default development password only for local testing: `npm start`
7. Open http://localhost:3000
8. Admin dashboard: http://localhost:3000/admin.html

No `npm install` is required; the server uses Node built-in modules only. The first run creates `data.json` with sample products and an empty order list.

## Features to test
- Browse products, search and filter categories.
- Select a size and add products to the cart.
- Checkout with customer details and a payment-method selection.
- Save the generated order ID and test it in Track Order.
- Open `/admin.html`, enter the admin password, add/delete products and update order statuses.

## Important production notes
This is a runnable MVP/demo, not a payment-certified production store.
- Checkout currently records an order and selected payment method. UPI/card options are labels only; they do **not** collect money. Integrate Razorpay (or another provider) on the server and verify signed payment webhooks before marking orders paid.
- Replace sample image URLs and all placeholder business contact details.
- Add real shipping rates, GST/invoice rules, refund/return policy, privacy policy and terms.
- Before public deployment, move data from `data.json` to a database (e.g. Supabase/PostgreSQL), use proper admin authentication with hashed passwords/sessions, add rate limiting, input validation, CSRF/security headers, backups and HTTPS.
- The demo admin password is a single shared secret and is not suitable for a public multi-user admin portal.
- Product images are loaded from external Unsplash URLs; replace with owned/licensed product photos.
- Email/WhatsApp order alerts are not configured in this starter.
- For deployment, use a Node-compatible host (Render, Railway, Fly.io, VPS). Netlify static hosting alone cannot run this Node server as-is; adapt the API to Netlify Functions or deploy the backend separately.

## Project structure
```text
buddy-clicks/
  server.js          # Node API + static file server
  data.json          # Created on first start; products and orders
  public/
    index.html       # Storefront
    styles.css       # Responsive white/blue theme
    app.js           # Cart, checkout, tracking
    admin.html       # Admin UI
    admin.js         # Admin product/order operations
```
