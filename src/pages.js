import { cartTotal, itemCount } from './cart.js';
import { formatPrice, PRODUCTS } from './catalogue.js';

const escape = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function layout(title, lines, body) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escape(title)} · Kettle &amp; Co.</title>
    <script src="/app.js" defer></script>
  </head>
  <body>
    <header>
      <a href="/">Kettle &amp; Co.</a>
      <a href="/cart" id="cart-link">Cart (<span id="cart-count">${itemCount(lines)}</span>)</a>
    </header>
    <main>
      <h1>${escape(title)}</h1>
      ${body}
    </main>
  </body>
</html>`;
}

export function cataloguePage(lines) {
  const items = PRODUCTS.map(
    (p) =>
      `<li><a href="/products/${p.id}">${escape(p.name)}</a> <span class="price">${formatPrice(p.priceCents)}</span></li>`,
  ).join('\n');
  return layout('Our teaware', lines, `<ul class="products">\n${items}\n</ul>`);
}

export function productPage(product, lines) {
  return layout(
    product.name,
    lines,
    `<p>${escape(product.blurb)}</p>
      <p class="price">${formatPrice(product.priceCents)}</p>
      <button type="button" data-add="${product.id}">Add to cart</button>
      <p role="status" id="added"></p>`,
  );
}

function linesTable(lines) {
  const rows = lines
    .map(
      (l) =>
        `<tr><td>${escape(l.product.name)}</td><td>${l.quantity}</td><td>${formatPrice(l.product.priceCents * l.quantity)}</td></tr>`,
    )
    .join('\n');
  return `<table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Total: <strong id="total">${formatPrice(cartTotal(lines))}</strong></p>`;
}

export function cartPage(lines) {
  if (!lines.length) return layout('Your cart', lines, '<p>Your cart is empty.</p><a href="/">Browse the shop</a>');
  return layout('Your cart', lines, `${linesTable(lines)}\n      <a href="/checkout">Go to checkout</a>`);
}

export function checkoutPage(lines) {
  if (!lines.length) return layout('Checkout', lines, '<p>Your cart is empty.</p><a href="/">Browse the shop</a>');
  return layout(
    'Checkout',
    lines,
    `${linesTable(lines)}
      <form method="post" action="/orders">
        <label>Name <input name="name" required /></label>
        <label>Email <input name="email" type="email" required /></label>
        <label>Address <textarea name="address" required></textarea></label>
        <button type="submit">Place order</button>
      </form>`,
  );
}

export function confirmationPage(order) {
  return layout(
    'Thank you',
    [],
    `<p>Order #${order.id} is placed: ${formatPrice(order.totalCents)}, on its way to ${escape(order.name)}.</p>`,
  );
}

export function notFoundPage(lines) {
  return layout('Not found', lines, '<p>There is no such page.</p><a href="/">Back to the shop</a>');
}

export function errorPage() {
  return layout('Something went wrong', [], '<p>Please try again in a moment.</p>');
}
