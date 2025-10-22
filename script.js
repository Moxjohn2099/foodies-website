// script.js
// Cart (localStorage), editable quantities, nav pill indicator, mobile nav toggle

const cartKey = 'foodies_cart_v1';

function getCart(){
  try{ return JSON.parse(localStorage.getItem(cartKey)) || []; }
  catch(e){ return []; }
}
function saveCart(cart){ localStorage.setItem(cartKey, JSON.stringify(cart)); }

function renderCartCount(){
  const el = document.getElementById('cartCount');
  if(!el) return;
  const cart = getCart();
  const count = cart.reduce((s,i)=>s + (i.qty||1),0);
  el.textContent = count;
}

function renderCartModal(){
  const list = document.getElementById('cartItems');
  if(!list) return;
  const cart = getCart();
  list.innerHTML = '';
  let total = 0;
  if(cart.length === 0){
    list.innerHTML = '<li class="empty">Your cart is empty.</li>';
  } else {
    cart.forEach((it, idx)=>{
      const li = document.createElement('li');
      li.className = 'cart-line';

      const left = document.createElement('div');
      left.className = 'cart-item-left';

      const nameEl = document.createElement('div');
      nameEl.className = 'cart-item-name';
      nameEl.textContent = it.name;
      left.appendChild(nameEl);

      const qtyControls = document.createElement('div');
      qtyControls.className = 'qty-controls';

      const dec = document.createElement('button');
      dec.type = 'button';
      dec.className = 'qty-btn qty-decrease';
      dec.setAttribute('data-index', idx);
      dec.setAttribute('aria-label', `Decrease ${it.name}`);
      dec.textContent = '−';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.value = it.qty;
      input.className = 'qty-input';
      input.setAttribute('data-index', idx);
      input.setAttribute('aria-label', `Quantity for ${it.name}`);

      const inc = document.createElement('button');
      inc.type = 'button';
      inc.className = 'qty-btn qty-increase';
      inc.setAttribute('data-index', idx);
      inc.setAttribute('aria-label', `Increase ${it.name}`);
      inc.textContent = '+';

      qtyControls.appendChild(dec);
      qtyControls.appendChild(input);
      qtyControls.appendChild(inc);

      left.appendChild(qtyControls);

      const right = document.createElement('div');
      right.className = 'cart-item-actions';

      const priceEl = document.createElement('div');
      priceEl.className = 'cart-item-price';
      priceEl.textContent = `₱${(it.price * it.qty).toFixed(2)}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-item';
      removeBtn.setAttribute('data-index', idx);
      removeBtn.textContent = 'Remove';

      right.appendChild(priceEl);
      right.appendChild(removeBtn);

      li.appendChild(left);
      li.appendChild(right);

      list.appendChild(li);

      total += it.price * it.qty;
    });
  }
  const totalEl = document.getElementById('cartTotal');
  if(totalEl) totalEl.textContent = total.toFixed(2);
}

// open/close cart
function openCart(){
  const modal = document.getElementById('cartModal');
  if(!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  renderCartModal();
}
function closeCart(){
  const modal = document.getElementById('cartModal');
  if(!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// NAV indicator functionality
function initNavIndicator(){
  const nav = document.querySelector('.main-nav');
  if(!nav) return;

  // ensure nav is visible (if CSS hides it on mobile, skip)
  const computed = window.getComputedStyle(nav);
  if(computed.display === 'none' || computed.visibility === 'hidden') return;

  // create indicator element if missing
  let indicator = nav.querySelector('.nav-indicator');
  if(!indicator){
    indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    nav.appendChild(indicator);
  }

  const links = Array.from(nav.querySelectorAll('a'));

  function getNavRect(){ return nav.getBoundingClientRect(); }

  function moveToLink(link, instant = false){
    if(!link) return;
    // guard: skip if nav hidden
    const navRect = getNavRect();
    const rect = link.getBoundingClientRect();
    const left = rect.left - navRect.left + nav.scrollLeft;
    const width = rect.width;
    indicator.style.left = `${left}px`;
    indicator.style.width = `${width}px`;
    indicator.style.opacity = '1';
    links.forEach(l => l.classList.remove('nav-focused'));
    link.classList.add('nav-focused');
    if(instant){
      indicator.style.transition = 'none';
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  }

  function hideIndicator(){
    indicator.style.opacity = '0';
    links.forEach(l => l.classList.remove('nav-focused'));
  }

  function getActiveLink(){
    const current = location.pathname.replace(/\/$/, '');
    return links.find(l=>{
      try{
        const linkUrl = new URL(l.href, location.origin);
        const linkPath = linkUrl.pathname.replace(/\/$/, '');
        return linkPath === current;
      }catch(e){
        return false;
      }
    });
  }

  // attach handlers
  links.forEach(link=>{
    link.addEventListener('mouseenter', ()=> moveToLink(link));
    link.addEventListener('focus', ()=> moveToLink(link));
    link.addEventListener('mouseleave', ()=> {
      const active = getActiveLink();
      if(active) moveToLink(active);
      else hideIndicator();
    });
    link.addEventListener('blur', ()=> {
      const active = getActiveLink();
      if(active) moveToLink(active);
      else hideIndicator();
    });
  });

  // reposition on resize or scroll within nav (debounced)
  let timer = null;
  window.addEventListener('resize', ()=>{
    clearTimeout(timer);
    timer = setTimeout(()=>{
      const active = getActiveLink();
      if(active) moveToLink(active, true);
    }, 80);
  });
  nav.addEventListener('scroll', ()=>{
    const active = getActiveLink();
    if(active) moveToLink(active, true);
  });

  // initial position
  const initial = getActiveLink();
  if(initial) moveToLink(initial, true);
  else hideIndicator();
}

// event delegation (cart, qty, nav toggle, etc.)
document.addEventListener('click', (e)=>{
  // add-to-cart
  const addBtn = e.target.closest('.add');
  if(addBtn){
    const name = addBtn.dataset.name;
    const price = Number(addBtn.dataset.price) || 0;
    const cart = getCart();
    const found = cart.find(x => x.name === name);
    if(found) found.qty = (found.qty||1) + 1;
    else cart.push({name, price, qty:1});
    saveCart(cart);
    renderCartCount();
    addBtn.textContent = 'Added ✓';
    setTimeout(()=> addBtn.textContent = 'Add to cart', 900);
    return;
  }

  // decrease qty
  const dec = e.target.closest('.qty-decrease');
  if(dec){
    const idx = Number(dec.getAttribute('data-index'));
    const cart = getCart();
    if(!isNaN(idx) && cart[idx]){
      cart[idx].qty = Math.max(1, (cart[idx].qty || 1) - 1);
      saveCart(cart);
      renderCartModal();
      renderCartCount();
    }
    return;
  }

  // increase qty
  const inc = e.target.closest('.qty-increase');
  if(inc){
    const idx = Number(inc.getAttribute('data-index'));
    const cart = getCart();
    if(!isNaN(idx) && cart[idx]){
      cart[idx].qty = (cart[idx].qty || 1) + 1;
      saveCart(cart);
      renderCartModal();
      renderCartCount();
    }
    return;
  }

  // remove from cart
  const rem = e.target.closest('.remove-item');
  if(rem){
    const idx = Number(rem.getAttribute('data-index'));
    const cart = getCart();
    if(!isNaN(idx) && cart[idx]){
      cart.splice(idx, 1);
      saveCart(cart);
      renderCartModal();
      renderCartCount();
    }
    return;
  }

  // open cart
  if(e.target.closest('#cartBtn') || e.target.closest('.cart-btn')){
    openCart();
    return;
  }

  // close cart modal
  if(e.target.closest('#closeCart') || e.target.closest('.close')){
    closeCart();
    return;
  }

  // checkout
  if(e.target.closest('#checkout')){
    const cart = getCart();
    if(cart.length === 0){
      alert('Your cart is empty.');
      return;
    }
    const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
    const summary = cart.map(i => `${i.name} x${i.qty} — ₱${(i.price * i.qty).toFixed(2)}`).join('\n');
    if(confirm(`Order summary:\n\n${summary}\n\nTotal: ₱${total.toFixed(2)}\n\nPlace order? (demo)`)){
      localStorage.removeItem(cartKey);
      renderCartCount();
      renderCartModal();
      closeCart();
      alert('Thank you! Order placed (demo).');
    }
    return;
  }

  // nav toggle (mobile)
  const toggle = e.target.closest('#navToggle');
  if(toggle){
    const nav = document.querySelector('.main-nav');
    if(!nav) return;
    nav.classList.toggle('open');
    // reposition indicator after toggle (small delay to allow CSS)
    setTimeout(()=> initNavIndicator(), 120);
    return;
  }
});

// input listener for qty inputs
document.addEventListener('input', (e)=>{
  const input = e.target.closest('.qty-input');
  if(!input) return;
  const idx = Number(input.getAttribute('data-index'));
  const cart = getCart();
  if(isNaN(idx) || !cart[idx]) return;
  let v = parseInt(input.value, 10);
  if(isNaN(v) || v < 1) v = 1;
  cart[idx].qty = v;
  saveCart(cart);
  renderCartModal();
  renderCartCount();
});

// DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('#cartBtn').forEach(b => b.addEventListener('click', openCart));
  const subscribeForm = document.getElementById('subscribe');
  if(subscribeForm){
    subscribeForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = e.target.querySelector('input').value;
      alert(`Subscribed: ${email}`);
      e.target.reset();
    });
  }
  renderCartCount();

  // allow clicking outside to close cart
  document.getElementById('cartModal')?.addEventListener('click', (e)=>{
    if(e.target === e.currentTarget) closeCart();
  });

  // initialize nav indicator last
  initNavIndicator();
});