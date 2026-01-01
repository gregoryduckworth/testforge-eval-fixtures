// The cart lives in a cookie: adding to it changes nothing on the server.
function readCart() {
  const cookie = document.cookie.split('; ').find((c) => c.startsWith('cart='));
  const cart = new Map();
  if (!cookie) return cart;
  for (const entry of decodeURIComponent(cookie.slice(5)).split(',')) {
    const [id, count] = entry.split(':');
    if (id && Number(count) > 0) cart.set(id, Number(count));
  }
  return cart;
}

function writeCart(cart) {
  const value = [...cart].map(([id, count]) => `${id}:${count}`).join(',');
  document.cookie = `cart=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button) return;
  const cart = readCart();
  const id = button.dataset.add;
  cart.set(id, (cart.get(id) ?? 0) + 1);
  writeCart(cart);
  document.getElementById('cart-count').textContent = String([...cart.values()].reduce((a, b) => a + b, 0));
  document.getElementById('added').textContent = 'Added to your cart';
});
