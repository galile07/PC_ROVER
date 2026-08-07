const year = document.getElementById('year');
const overlay = document.getElementById('overlay');
const signInModal = document.getElementById('signInModal');
const paymentModal = document.getElementById('paymentModal');
const checkoutBtn = document.getElementById('checkoutBtn');
const closeSignInBtn = document.getElementById('closeSignInBtn');
const closePaymentBtn = document.getElementById('closePaymentBtn');
const paymentForm = document.getElementById('paymentForm');
const paymentMethod = document.getElementById('paymentMethod');
const credentialSelect = document.getElementById('credentialSelect');
const accountStatus = document.getElementById('accountStatus');

// Tab System Variables
const categoryTabs = document.getElementById('categoryTabs');
const accountTabs = document.getElementById('accountTabs');
const cartTabs = document.getElementById('cartTabs');

const loginForm = document.getElementById('loginForm');
const signUpForm = document.getElementById('signUpForm');
const accountForm = document.getElementById('accountForm');
const accountNameInput = document.getElementById('accountName');
const accountEmailInput = document.getElementById('accountEmail');
const accountPhoneInput = document.getElementById('accountPhone');
const credentialPhoneInput = document.getElementById('credentialPhone');
const credentialAddressInput = document.getElementById('credentialAddress');
const credentialList = document.getElementById('credentialList');
const addCredentialBtn = document.getElementById('addCredentialBtn');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');

// Dropdown and Sign out elements
const userDropdown = document.getElementById('userDropdown');
const signOutBtn = document.getElementById('signOutBtn');

// Modal Elements
const productModal = document.getElementById('productModal');
const closeProductModalBtn = document.getElementById('closeProductModalBtn');
const modalProductImage = document.getElementById('modalProductImage');
const modalProductTitle = document.getElementById('modalProductTitle');
const modalProductDesc = document.getElementById('modalProductDesc');
const modalProductPrice = document.getElementById('modalProductPrice');
const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
const modalCheckoutBtn = document.getElementById('modalCheckoutBtn');
const toggleSignUpBtn = document.getElementById('toggleSignUpBtn');
const signInEmail = document.getElementById('signInEmail');
const signInPassword = document.getElementById('signInPassword');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const signInError = document.getElementById('signInError');
const signUpName = document.getElementById('signUpName');
const signUpEmail = document.getElementById('signUpEmail');
const signUpCode = document.getElementById('signUpCode');
const signUpPassword = document.getElementById('signUpPassword');
const signUpConfirmPassword = document.getElementById('signUpConfirmPassword');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const signUpError = document.getElementById('signUpError');

// --- Supabase Client ---
const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
const supabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let editingCredentialId = null;
let credentials = [];
let selectedCredentialId = localStorage.getItem('pcroverbaliwagSelectedCredential') || null;
let isSignUpMode = false;
let cart = [];
let isSignedIn = false;
let currentUser = null;

// Temporary variables for the product modal
let currentSelectedProduct = null;
let currentAddButtonEl = null;
let productsMap = {};
let allProducts = [];

const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  preparing: 'Preparing',
  shipped: 'Preparing',
  to_ship: 'To Ship',
  shipping: 'Shipping',
  delivered: 'Shipping',
  to_receive: 'Shipping',
  completed: 'Finished',
  finished: 'Finished',
  cancelled: 'Cancelled',
};

const IMAGE_POOL = [
  '1517336714731-489689fd1ca8',
  '1587829741301-dc798b83add3',
  '1527814050087-3793815479db',
  '1505740420928-5e560c06d30e',
  '1527443224154-c4a3942d3acf',
  '1516035069371-29a1b244cc32',
  '1608043152269-423dbba4e7e1',
  '1622233744431-84c86c7f60f4',
  '1618384887929-16ec33fab9ef',
  '1585060544812-6b45742d762f',
  '1593640408182-31c70c8268f5',
  '1587202372775-e229f172b9d7',
];

const PRODUCT_IMAGE_IDS = {
  'mechanical keyboard': '1756388371735-cc845c578200',
  'gaming mouse': '1616296425622-4560a2ad83de',
  '27 monitor': '1674621702671-5b92364391f2',
  'laptop stand': '1652198144911-4f204ccf35e6',
  'gaming headset': '1566055972289-c52022ae23b7',
  'webcam hd': '1642083139428-9ee5fa423c46',
  'bluetooth speaker': '1511499271651-073325718d90',
  'ssd 1tb': '1757083840018-cd665233a112',
  'usb c hub': '1760376789478-c1023d2dc007',
  printer: '1612815154858-60aa4c59eaa6',
  'mouse pad': '1569050806800-0d6be7035923',
  'extension cord': '1565049981953-379c9c2a5d48',
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function normalizeProductName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function guessCategory(name) {
  const n = String(name || '').toLowerCase();
  const words = n.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const hasAny = (...ws) => ws.some((w) => n.includes(w));
  const hasWord = (...ws) => ws.some((w) => words.includes(w));
  if (hasAny('used', 'second hand', '2nd hand', 'preowned', 'pre-owned', 'refurbished')) return 'preowned';
  if (hasAny('cctv', 'camera', 'dvr', 'nvr', 'alarm', 'doorbell', 'surveillance', 'security', 'sensor', 'ip cam')) return 'security';
  if (hasWord('monitor', 'ssd', 'hdd', 'printer', 'desktop', 'tower', 'cpu', 'processor', 'ram', 'memory', 'laptop', 'notebook', 'motherboard', 'gpu', 'graphics', 'pc')) return 'computers';
  return 'accessories';
}

function unsplashImage(seed, width) {
  const id = IMAGE_POOL[hashString(String(seed)) % IMAGE_POOL.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80&ixlib=rb-4.1.0`;
}

function productImage(product, width) {
  if (product.image) {
    return escapeHtml(product.image);
  }
  const normalized = normalizeProductName(product.name);
  const keys = Object.keys(PRODUCT_IMAGE_IDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (normalized.includes(key)) {
      const id = PRODUCT_IMAGE_IDS[key];
      return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80&ixlib=rb-4.1.0`;
    }
  }
  return unsplashImage(product.name, width);
}

function imgFallback(img, url) {
  if (!img.dataset.fb && url) {
    img.dataset.fb = '1';
    img.src = url;
  }
}

function formatCurrency(value) {
  return `₱${Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function deriveName(email) {
  return email
    .split('@')[0]
    .replace(/[.\-_]/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFormError(message, isSuccess) {
  if (signInError) {
    signInError.textContent = message;
    signInError.classList.remove('hidden');
    signInError.classList.toggle('form-success', Boolean(isSuccess));
  } else {
    alert(message);
  }
}

function clearFormError() {
  if (signInError) {
    signInError.textContent = '';
    signInError.classList.add('hidden');
    signInError.classList.remove('form-success');
  }
  if (signUpError) {
    signUpError.textContent = '';
    signUpError.classList.add('hidden');
    signUpError.classList.remove('form-success');
  }
}

function showSignUpError(message, isSuccess) {
  if (signUpError) {
    signUpError.textContent = message;
    signUpError.classList.remove('hidden');
    signUpError.classList.toggle('form-success', Boolean(isSuccess));
  } else {
    alert(message);
  }
}

function clearSignUpError() {
  if (signUpError) {
    signUpError.textContent = '';
    signUpError.classList.add('hidden');
    signUpError.classList.remove('form-success');
  }
}

function loadState() {
  const storedCart = localStorage.getItem('pcroverbaliwagCart');
  const storedUser = localStorage.getItem('pcroverbaliwagUser');
  cart = storedCart ? JSON.parse(storedCart) : [];
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    isSignedIn = true;
  }
}

function saveState() {
  localStorage.setItem('pcroverbaliwagCart', JSON.stringify(cart));
  if (currentUser) {
    localStorage.setItem(
      'pcroverbaliwagUser',
      JSON.stringify({ name: currentUser.name, email: currentUser.email, phone: currentUser.phone })
    );
  }
}

function updateCartCount() {
  const currentCartCountEl = document.getElementById('cartCount');
  if (currentCartCountEl) {
    currentCartCountEl.textContent = cart.length;
  }
}

function parseCurrencyValue(priceString) {
  if (!priceString) return 0;
  const numericValue = Number(priceString.replace(/[^0-9.-]+/g, ''));
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

// ---------- Auth ----------

async function ensureProfile(authUser) {
  const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  if (error) {
    console.error('ensureProfile select', error);
    return null;
  }
  if (data) return data;

  const { data: inserted, error: insertError } = await supabaseClient
    .from('profiles')
    .insert({
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || deriveName(authUser.email),
      phone: '',
    })
    .select()
    .single();
  if (insertError) {
    console.error('ensureProfile insert', insertError);
    return null;
  }
  return inserted;
}

function setSignedInState(user) {
  isSignedIn = true;
  currentUser = user;
  document.body.classList.add('signed-in');
  if (accountStatus) {
    accountStatus.textContent = `Hi, ${user.name.split(' ')[0]}`;
    accountStatus.classList.remove('hidden');
  }
  if (accountNameInput && accountEmailInput) {
    accountNameInput.value = user.name;
    accountEmailInput.value = user.email;
    if (accountPhoneInput) accountPhoneInput.value = user.phone || '';
  }
  saveState();
}

function clearUser() {
  isSignedIn = false;
  currentUser = null;
  credentials = [];
  document.body.classList.remove('signed-in');
  localStorage.removeItem('pcroverbaliwagUser');
  localStorage.removeItem('pcroverbaliwagSelectedCredential');
  selectedCredentialId = null;
  if (accountStatus) {
    accountStatus.classList.add('hidden');
    accountStatus.textContent = '';
  }
  renderCredentialList();
  renderCredentialSelect();
}

async function handleSignedIn(authUser) {
  const profile = await ensureProfile(authUser);
  const user = {
    id: authUser.id,
    email: authUser.email,
    name: profile?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || deriveName(authUser.email),
    phone: profile?.phone || '',
  };
  setSignedInState(user);
  await loadCredentials();
  await loadOrders();
  renderCartPage();
}

function setSignInMode(signUp) {
  clearFormError();
  isSignUpMode = signUp;
  const title = document.getElementById('signInTitle');
  const note = document.getElementById('signInNote');

  if (loginForm) loginForm.classList.toggle('hidden', signUp);
  if (signUpForm) signUpForm.classList.toggle('hidden', !signUp);

  if (title) title.textContent = signUp ? 'Create your account' : 'Access your account';
  if (note) {
    note.textContent = signUp
      ? 'Enter your details and we will email you a code to verify your account.'
      : 'Sign in to access your cart, orders, and account.';
  }
  if (toggleSignUpBtn) {
    toggleSignUpBtn.textContent = signUp ? 'Have an account? Sign in' : 'No account? Create one';
  }
}

function signInWithGoogle() {
  clearFormError();
  const redirectTo = window.location.origin + window.location.pathname;
  supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

function signUpWithGoogle() {
  clearFormError();
  const redirectTo = window.location.origin + window.location.pathname;
  supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
    },
  });
}

// ---------- Products ----------

let _rulesCache = null;

async function getAutoRules() {
  if (_rulesCache) return _rulesCache;
  const raw = localStorage.getItem('pcroverAutoRules');
  const local = raw ? JSON.parse(raw) : null;
  if (local && local.length) { _rulesCache = local; return local; }
  if (!supabaseClient) return _rulesCache || [];
  try {
    const { data } = await supabaseClient.from('auto_rules').select('*').order('id');
    _rulesCache = data || [];
    if (_rulesCache.length) localStorage.setItem('pcroverAutoRules', JSON.stringify(_rulesCache));
    return _rulesCache;
  } catch (e) { return _rulesCache || []; }
}

function applyAutoRules(product) {
  const rules = (_rulesCache || []).filter((r) => r.enabled);
  let price = Number(product.price) || 0;
  rules.forEach((r) => {
    let match = false;
    const val = r.field === 'stock' ? Number(product.stock) || 0 : 0;
    if (r.operator === 'greater' && val > Number(r.value)) match = true;
    if (r.operator === 'less' && val < Number(r.value)) match = true;
    if (r.operator === 'equal' && val === Number(r.value)) match = true;
    if (match) {
      const change = r.adjusttype === 'percent' ? (price * Number(r.adjustvalue)) / 100 : Number(r.adjustvalue);
      price += change;
    }
  });
  return price;
}

async function loadProducts() {
  if (!supabaseClient) return;
  await getAutoRules();
  const { data, error } = await supabaseClient
    .from('inventory')
    .select('*')
    .eq('enabled', true)
    .gt('stock', 0)
    .order('id', { ascending: true });
  if (error) {
    console.error('loadProducts', error);
    document.querySelectorAll('[data-products]').forEach((grid) => {
      grid.innerHTML = '<p class="empty-state">Could not load products. Please try again later.</p>';
    });
    return;
  }
  productsMap = {};
  const list = (data || []).map((product) => {
    product._key = String(product.id);
    product.category = product.category || guessCategory(product.name);
    product.price = applyAutoRules(product);
    productsMap[product._key] = product;
    return product;
  });
  const { data: imported, error: impError } = await supabaseClient
    .from('imported_products')
    .select('*')
    .eq('enabled', true)
    .gt('stock', 0)
    .order('id', { ascending: true });
  if (!impError) {
    (imported || []).forEach((product) => {
      product._key = 'imp-' + product.id;
      product.category = product.category || guessCategory(product.name);
      product.price = applyAutoRules(product);
      productsMap[product._key] = product;
      list.push(product);
    });
  }
  allProducts = list;
  renderProducts(list);
}

function productFallbackDescription(product) {
  const category = (product.category || '').toLowerCase();
  if (category === 'computers') {
    return 'Brand-new computer unit, tested and ready to ship with fast delivery.';
  }
  if (category === 'accessories') {
    return 'Essential accessory to complete your setup. Ships fast anywhere in BALIWAG.';
  }
  if (category === 'security') {
    return 'Security and surveillance equipment for your home or business.';
  }
  if (category === 'preowned') {
    return 'Pre-owned unit, quality-checked and ready to ship.';
  }
  return 'Quality tech product available at PC ROVER BALIWAG.';
}

function productDescription(product) {
  const description = (product.description || '').trim();
  return escapeHtml(description || productFallbackDescription(product));
}

function productCard(product) {
  return `
    <article class="product-card" data-id="${escapeHtml(product._key || product.id)}">
      <img src="${productImage(product, 600)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="imgFallback(this, '${unsplashImage('fallback-' + product.name, 600)}')" />
      <div class="product-info">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${productDescription(product)}</p>
        <div class="product-meta">
          <span>${formatCurrency(product.price)}</span>
          <button class="add-btn">Add to Cart</button>
        </div>
      </div>
    </article>
  `;
}

const MASONRY_HEIGHTS = [180, 240, 200, 260, 190, 250, 210, 170, 230, 220];

function masonryTile(product, index) {
  const height = MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length];
  return `
    <button type="button" class="masonry-tile" data-id="${escapeHtml(product._key || product.id)}" style="height:${height}px">
      <img src="${productImage(product, 400)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="imgFallback(this, '${unsplashImage('fallback-' + product.name, 400)}')" />
      <span class="masonry-tile-info">
        <strong>${escapeHtml(product.name)}</strong>
        <em>${formatCurrency(product.price)}</em>
      </span>
    </button>
  `;
}

function renderProducts(products) {
  const grids = document.querySelectorAll('[data-products]');
  grids.forEach((grid) => {
    const category = grid.dataset.products;
    const list = category === 'all' ? products : products.filter((product) => product.category === category);
    if (!list.length) {
      const searchInput = document.getElementById('productSearch');
      const searching = searchInput && searchInput.value.trim();
      grid.innerHTML = `<p class="empty-state">${searching ? 'No products found for "' + escapeHtml(searchInput.value.trim()) + '".' : 'No products in this category yet.'}</p>`;
      return;
    }
    if (grid.dataset.masonry === 'true') {
      grid.innerHTML = list.map((product, index) => masonryTile(product, index)).join('');
      return;
    }
    grid.innerHTML = list.map((product) => productCard(product)).join('');
  });
}

// ---------- Credentials ----------

async function loadCredentials() {
  if (!supabaseClient || !currentUser) return;
  const { data, error } = await supabaseClient
    .from('credentials')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('loadCredentials', error);
    return;
  }
  credentials = data || [];
  if (selectedCredentialId && !credentials.some((c) => c.id === selectedCredentialId)) {
    selectedCredentialId = null;
  }
  renderCredentialList();
  renderCredentialSelect();
}

async function saveCredential(phone, address) {
  if (!supabaseClient || !currentUser) return false;
  if (editingCredentialId) {
    const { error } = await supabaseClient.from('credentials').update({ phone, address }).eq('id', editingCredentialId);
    if (error) {
      alert('Failed to save credential: ' + error.message);
      return false;
    }
    editingCredentialId = null;
  } else {
    const { data, error } = await supabaseClient
      .from('credentials')
      .insert({ user_id: currentUser.id, phone, address })
      .select()
      .single();
    if (error) {
      alert('Failed to add credential: ' + error.message);
      return false;
    }
    if (data) selectedCredentialId = data.id;
  }
  localStorage.setItem('pcroverbaliwagSelectedCredential', selectedCredentialId || '');
  return true;
}

async function deleteCredential(id) {
  if (!supabaseClient || !currentUser) return false;
  const { error } = await supabaseClient.from('credentials').delete().eq('id', id);
  if (error) {
    alert('Failed to delete credential: ' + error.message);
    return false;
  }
  if (selectedCredentialId === id) selectedCredentialId = null;
  return true;
}

// ---------- Orders ----------

async function placeOrder(items, total, method, credential) {
  if (!supabaseClient || !currentUser) return false;
  const { error } = await supabaseClient.from('orders').insert({
    user_id: currentUser.id,
    customer_name: currentUser.name || null,
    items: items.map((item) => ({ name: item.name, price: item.price, value: Number(item.value) || 0 })),
    total,
    payment_method: method,
    phone: credential.phone,
    address: credential.address,
    status: 'pending',
  });
  if (error) {
    alert('Failed to place order: ' + error.message);
    return false;
  }
  return true;
}

function renderOrders(orders) {
  const ordersList = document.getElementById('ordersList');
  const toShipList = document.getElementById('toShipList');
  const toReceiveList = document.getElementById('toReceiveList');
  const finishedList = document.getElementById('finishedList');

  const renderInto = (container, list) => {
    if (!container) return;
    container.innerHTML = '';
    if (!list.length) {
      container.innerHTML = '<p class="empty-state">Nothing here yet.</p>';
      return;
    }
    list.forEach((order) => {
      const card = document.createElement('div');
      card.className = 'order-item';
      const createdDate = new Date(order.created_at);
      const dateText = Number.isNaN(createdDate.getTime())
        ? ''
        : createdDate.toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'Asia/Manila',
          });
      const itemsHtml = (Array.isArray(order.items) ? order.items : [])
        .map((item) => `${escapeHtml(item.name)} — ${formatCurrency(item.value || 0)}`)
        .join('<br>');
      const methodText = order.payment_method === 'gcash' ? 'GCash' : 'Cash on Delivery';
      card.innerHTML = `
        <div class="order-header">
          <strong>Order #${escapeHtml(String(order.id).slice(0, 8).toUpperCase())}</strong>
          <span class="order-status">${ORDER_STATUS_LABELS[order.status] || escapeHtml(order.status)}</span>
        </div>
        <div class="order-meta">
          <span>${dateText}</span>
          <span>${methodText}</span>
          <span>Total ${formatCurrency(order.total)}</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
      `;
      container.appendChild(card);
    });
  };

  renderInto(ordersList, orders.filter((order) => order.status === 'pending'));
  renderInto(toShipList, orders.filter((order) => order.status === 'shipped' || order.status === 'preparing' || order.status === 'to_ship'));
  renderInto(toReceiveList, orders.filter((order) => order.status === 'delivered' || order.status === 'shipping' || order.status === 'to_receive'));
  renderInto(finishedList, orders.filter((order) => order.status === 'completed' || order.status === 'finished'));
}

async function loadOrders() {
  if (!supabaseClient || !currentUser) return;
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('loadOrders', error);
    return;
  }
  renderOrders(data || []);
}

// ---------- Cart ----------

function renderCartPage() {
  if (!cartItems || !cartTotal) return;
  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-state">Your cart is empty. Add a product to get started.</p>';
    cartTotal.textContent = formatCurrency(0);
    return;
  }

  cartItems.innerHTML = '';
  let total = 0;
  let selectedCount = 0;

  cart.forEach((item, index) => {
    if (item.selected === undefined) {
      item.selected = true;
    }

    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <label class="cart-checkbox">
        <input type="checkbox" data-index="${index}" ${item.selected ? 'checked' : ''} />
        <div class="cart-item-details">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${item.price}</span>
        </div>
      </label>
      <div class="cart-item-thumb">
        <img src="${productImage(item, 120)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="imgFallback(this, '${unsplashImage('fallback-' + item.name, 120)}')" />
      </div>
      <button type="button" class="cart-remove-btn" data-index="${index}">Remove</button>
    `;
    cartItems.appendChild(itemEl);

    const itemValue = Number(item.value);
    const priceValue = Number.isNaN(itemValue) ? parseCurrencyValue(item.price) : itemValue;
    if (item.selected) {
      total += priceValue;
      selectedCount += 1;
    }
  });

  const checkboxes = cartItems.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const index = Number(event.target.dataset.index);
      if (Number.isNaN(index) || !cart[index]) return;
      cart[index].selected = event.target.checked;
      saveState();
      renderCartPage();
    });
  });

  const removeButtons = cartItems.querySelectorAll('.cart-remove-btn');
  removeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      if (Number.isNaN(index) || !cart[index]) return;
      const item = cart[index];
      showConfirmDialog({
        title: 'Remove item',
        message: `Remove "${item.name}" from your cart?`,
        confirmText: 'Remove',
        onConfirm: () => {
          cart.splice(index, 1);
          saveState();
          updateCartCount();
          renderCartPage();
        },
      });
    });
  });

  if (!selectedCount) {
    cartTotal.textContent = formatCurrency(0);
    cartItems.insertAdjacentHTML('beforeend', '<p class="empty-state">Select at least one item to checkout.</p>');
    return;
  }

  cartTotal.textContent = formatCurrency(total);
}

function addToCart(product) {
  cart.push({
    name: product.name,
    price: product.price,
    value: product.value,
    selected: true,
  });
  saveState();
  updateCartCount();
  showToast('A product has successfully added to cart');
}

// ---------- Toast notifications ----------

let toastContainer = null;

function showToast(message) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML =
    '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(span);
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ---------- UI helpers ----------

function openPanel(panel) {
  if (!panel) return;
  panel.classList.remove('hidden');
  document.body.classList.add('modal-open');
  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function closePanel(panel) {
  if (!panel) return;
  panel.classList.add('hidden');
  if (!document.querySelector('.modal:not(.hidden)')) {
    document.body.classList.remove('modal-open');
  }
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

let confirmDialog = null;

function showConfirmDialog({ title, message, confirmText = 'Remove', cancelText = 'Cancel', onConfirm } = {}) {
  if (!confirmDialog) {
    confirmDialog = document.createElement('div');
    confirmDialog.className = 'modal hidden';
    confirmDialog.innerHTML = `
      <div class="modal-card confirm-card">
        <div class="confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          </svg>
        </div>
        <h3 class="confirm-title"></h3>
        <p class="confirm-message"></p>
        <div class="confirm-actions">
          <button type="button" class="btn confirm-cancel"></button>
          <button type="button" class="btn confirm-ok"></button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmDialog);
    confirmDialog.querySelector('.modal-card').addEventListener('click', (e) => e.stopPropagation());
    confirmDialog.querySelector('.confirm-cancel').addEventListener('click', () => closeConfirmDialog());
    confirmDialog.querySelector('.confirm-ok').addEventListener('click', () => {
      const fn = confirmDialog._onConfirm;
      closeConfirmDialog();
      if (fn) fn();
    });
  }
  confirmDialog._onConfirm = onConfirm;
  confirmDialog.querySelector('.confirm-title').textContent = title || 'Confirm';
  confirmDialog.querySelector('.confirm-message').textContent = message || '';
  confirmDialog.querySelector('.confirm-cancel').textContent = cancelText;
  confirmDialog.querySelector('.confirm-ok').textContent = confirmText;
  openPanel(confirmDialog);
}

function closeConfirmDialog() {
  if (confirmDialog) closePanel(confirmDialog);
}

let successDialog = null;

function showSuccessDialog({ title, message, buttonText = 'View Orders', onAction } = {}) {
  if (!successDialog) {
    successDialog = document.createElement('div');
    successDialog.className = 'modal hidden';
    successDialog.innerHTML = `
      <div class="modal-card confirm-card success-card">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 class="confirm-title"></h3>
        <p class="confirm-message"></p>
        <div class="confirm-actions">
          <button type="button" class="btn success-ok"></button>
        </div>
      </div>
    `;
    document.body.appendChild(successDialog);
    successDialog.querySelector('.modal-card').addEventListener('click', (e) => e.stopPropagation());
    successDialog.querySelector('.success-ok').addEventListener('click', () => {
      const fn = successDialog._onAction;
      closePanel(successDialog);
      if (fn) fn();
    });
  }
  successDialog._onAction = onAction;
  successDialog.querySelector('.confirm-title').textContent = title || 'Success';
  successDialog.querySelector('.confirm-message').textContent = message || '';
  successDialog.querySelector('.success-ok').textContent = buttonText;
  openPanel(successDialog);
}

function requireSignIn() {
  if (!isSignedIn) {
    clearFormError();
    if (productModal) closePanel(productModal);
    if (paymentModal) closePanel(paymentModal);
    setSignInMode(false);
    openPanel(signInModal);
    return false;
  }
  return true;
}

function openProductModal(product, addButtonEl) {
  currentSelectedProduct = {
    name: product.name,
    price: formatCurrency(product.price),
    value: Number(product.price),
    desc: (product.description || '').trim() || productFallbackDescription(product),
    imgSrc: productImage(product, 900),
    imgAlt: product.name,
  };
  currentAddButtonEl = addButtonEl || null;

  if (modalProductImage) {
    modalProductImage.src = currentSelectedProduct.imgSrc;
    modalProductImage.alt = currentSelectedProduct.imgAlt;
    modalProductImage.dataset.fallback = unsplashImage('fallback-' + currentSelectedProduct.name, 900);
    modalProductImage.dataset.fb = '';
  }
  if (modalProductTitle) modalProductTitle.textContent = currentSelectedProduct.name;
  if (modalProductDesc) modalProductDesc.textContent = currentSelectedProduct.desc;
  if (modalProductPrice) modalProductPrice.textContent = currentSelectedProduct.price;

  openPanel(productModal);
}

function setupTabs(tabContainer) {
  if (!tabContainer) return;
  const buttons = tabContainer.querySelectorAll('.tab-button');
  const section = tabContainer.closest('section');
  const panels = section ? section.querySelectorAll('.tab-panel') : [];

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((btn) => btn.classList.toggle('active', btn === button));
      panels.forEach((panel) => panel.classList.toggle('active', panel.id === button.dataset.tab));
    });
  });
}

function activateTab(tabContainer, tabId) {
  if (!tabContainer) return;
  const buttons = tabContainer.querySelectorAll('.tab-button');
  const section = tabContainer.closest('section');
  const panels = section ? section.querySelectorAll('.tab-panel') : [];
  buttons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tabId));
  panels.forEach((panel) => panel.classList.toggle('active', panel.id === tabId));
}

function setActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop();

  navLinks.forEach((link) => {
    if (link.getAttribute('href') === currentPage || (currentPage === '' && link.getAttribute('href') === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function protectNavLinks() {
  const navLinks = document.querySelectorAll('.nav-link[data-protected="true"]');
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!isSignedIn) {
        event.preventDefault();
        event.stopPropagation();
        setSignInMode(false);
        openPanel(signInModal);
      }
    });
  });
}

function enforceProtectedPageAccess() {
  const protectedPages = ['account.html', 'cart.html'];
  let currentPage = window.location.pathname.split('/').pop().toLowerCase();
  if (!currentPage) {
    currentPage = 'index.html';
  }

  if (!isSignedIn && protectedPages.includes(currentPage)) {
    window.location.href = 'index.html?signin=1';
  }
}

function openSignInIfRequested() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('signin') === '1' && signInModal) {
    clearFormError();
    setSignInMode(false);
    openPanel(signInModal);
  }
}

// ---------- Credentials UI ----------

function renderCredentialList() {
  if (!credentialList) return;

  credentialList.innerHTML = '';
  if (!credentials.length) {
    credentialList.innerHTML = '<p class="empty-state">No delivery credentials added yet.</p>';
    return;
  }

  credentials.forEach((credential) => {
    const credentialItem = document.createElement('div');
    credentialItem.className = 'credential-item';

    const left = document.createElement('div');
    left.className = 'credential-left';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'deliveryCredential';
    radio.value = credential.id;
    if (selectedCredentialId === credential.id) radio.checked = true;

    const details = document.createElement('div');
    details.className = 'credential-details';
    const strong = document.createElement('strong');
    strong.textContent = credential.phone;
    const span = document.createElement('span');
    span.textContent = credential.address;
    details.appendChild(strong);
    details.appendChild(span);

    left.appendChild(radio);
    left.appendChild(details);

    const actions = document.createElement('div');
    actions.className = 'credential-actions';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn credential-edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.dataset.id = credential.id;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn credential-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.id = credential.id;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    credentialItem.appendChild(left);
    credentialItem.appendChild(actions);
    credentialList.appendChild(credentialItem);
  });

  const radioButtons = credentialList.querySelectorAll('input[name="deliveryCredential"]');
  radioButtons.forEach((button) => {
    button.addEventListener('change', () => {
      selectedCredentialId = button.value;
      localStorage.setItem('pcroverbaliwagSelectedCredential', selectedCredentialId || '');
    });
  });

  const editButtons = credentialList.querySelectorAll('.credential-edit-btn');
  editButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const cred = credentials.find((c) => c.id === id);
      if (!cred) return;
      credentialPhoneInput.value = cred.phone;
      credentialAddressInput.value = cred.address;
      editingCredentialId = id;
      if (addCredentialBtn) addCredentialBtn.textContent = 'Save';
      window.scrollTo({ top: credentialList.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
    });
  });

  const deleteButtons = credentialList.querySelectorAll('.credential-delete-btn');
  deleteButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (!confirm('Delete this delivery credential?')) return;
      const ok = await deleteCredential(id);
      if (!ok) return;
      await loadCredentials();
    });
  });
}

function renderCredentialSelect() {
  if (!credentialSelect) return;

  credentialSelect.innerHTML = '';
  credentials.forEach((credential) => {
    const option = document.createElement('option');
    option.value = credential.id;
    option.textContent = `${credential.phone} - ${credential.address}`;
    credentialSelect.appendChild(option);
  });

  if (selectedCredentialId) {
    credentialSelect.value = selectedCredentialId;
  }
}

function populateAccountForm() {
  if (!currentUser || !accountNameInput || !accountEmailInput) return;
  accountNameInput.value = currentUser.name;
  accountEmailInput.value = currentUser.email;
  if (accountPhoneInput) accountPhoneInput.value = currentUser.phone || '';
  renderCredentialList();
}

// ---------- Init ----------

function init() {
  loadState();
  if (isSignedIn && currentUser) {
    setSignedInState(currentUser);
  }
  updateCartCount();
  setActiveNavLink();

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await handleSignedIn(session.user);
        closePanel(signInModal);
      } else {
        clearUser();
      }
    });
    loadProducts();
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      closePanel(signInModal);
      closePanel(paymentModal);
      if (productModal) closePanel(productModal);
    });
  }

  const productSearchInput = document.getElementById('productSearch');
  if (productSearchInput) {
    productSearchInput.addEventListener('input', () => {
      const query = productSearchInput.value.trim().toLowerCase();
      const filtered = query
        ? allProducts.filter((product) => (product.name || '').toLowerCase().includes(query))
        : allProducts;
      renderProducts(filtered);
    });
  }

  const googleSignInBtn = document.getElementById('googleSignInBtn');
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', signInWithGoogle);
  }

  const googleHeroBtn = document.getElementById('googleHeroBtn');
  if (googleHeroBtn) {
    googleHeroBtn.addEventListener('click', signInWithGoogle);
  }

  const googleSignUpHeroBtn = document.getElementById('googleSignUpHeroBtn');
  if (googleSignUpHeroBtn) {
    googleSignUpHeroBtn.addEventListener('click', signUpWithGoogle);
  }

  if (closeSignInBtn) {
    closeSignInBtn.addEventListener('click', () => closePanel(signInModal));
  }

  if (closePaymentBtn) {
    closePaymentBtn.addEventListener('click', () => closePanel(paymentModal));
  }

  if (closeProductModalBtn) {
    closeProductModalBtn.addEventListener('click', () => closePanel(productModal));
  }

  if (toggleSignUpBtn) {
    toggleSignUpBtn.addEventListener('click', () => {
      setSignInMode(!isSignUpMode);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFormError();
      const email = signInEmail.value.trim();
      const password = signInPassword.value;
      const submitBtn = document.getElementById('signInSubmitBtn');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Please wait...';
      }

      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        showFormError('Invalid email or password. If you are new, choose "Create one" below.');
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async () => {
      clearSignUpError();
      const email = signUpEmail.value.trim();
      if (!isValidEmail(email)) {
        showSignUpError('Enter a valid email address first, then press "Send code".');
        signUpEmail.focus();
        return;
      }
      sendCodeBtn.disabled = true;
      sendCodeBtn.textContent = 'Sending...';
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) {
        showSignUpError(error.message || 'Could not send the code. Try again.');
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = 'Send code';
        return;
      }
      showSignUpError('A 6-digit code was sent to ' + email + '. Enter it below to continue.', true);

      let remaining = 60;
      const countdown = () => {
        if (remaining <= 0) {
          sendCodeBtn.disabled = false;
          sendCodeBtn.textContent = 'Send code';
          return;
        }
        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = 'Resend code in ' + remaining + 's';
        remaining -= 1;
        setTimeout(countdown, 1000);
      };
      countdown();
    });
  }

  if (signUpForm) {
    signUpForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearSignUpError();
      const name = signUpName.value.trim();
      const email = signUpEmail.value.trim();
      const code = signUpCode.value.trim();
      const password = signUpPassword.value;
      const confirmPassword = signUpConfirmPassword.value;
      const submitBtn = document.getElementById('signUpSubmitBtn');

      if (!name) {
        showSignUpError('Enter your name.');
        signUpName.focus();
        return;
      }
      if (!isValidEmail(email)) {
        showSignUpError('Enter a valid email address.');
        signUpEmail.focus();
        return;
      }
      if (!code) {
        showSignUpError('Press "Send code", then enter the 6-digit code we emailed you.');
        return;
      }
      if (password.length < 6) {
        showSignUpError('Password must be at least 6 characters.');
        signUpPassword.focus();
        return;
      }
      if (password !== confirmPassword) {
        showSignUpError('Passwords do not match.');
        signUpConfirmPassword.focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Please wait...';
      }

      const { data, error } = await supabaseClient.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (error) {
        showSignUpError(error.message || 'Verification failed. Check the code and try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
        return;
      }

      const passwordRes = await supabaseClient.auth.updateUser({ password });
      if (passwordRes.error) {
        showSignUpError(passwordRes.error.message || 'Account created but password could not be set.');
        return;
      }
      const nameRes = await supabaseClient.auth.updateUser({ data: { full_name: name } });
      if (nameRes.error) {
        showSignUpError(nameRes.error.message || 'Account created but name could not be saved.');
        return;
      }

      if (data.user) {
        const profile = await ensureProfile(data.user);
        if (profile) {
          await supabaseClient.from('profiles').update({ name }).eq('id', data.user.id);
        }
      }
    });
  }

  if (togglePasswordBtn && signInPassword) {
    togglePasswordBtn.addEventListener('click', () => {
      const isHidden = signInPassword.type === 'password';
      signInPassword.type = isHidden ? 'text' : 'password';
      togglePasswordBtn.textContent = isHidden ? 'Hide' : 'Show';
    });
  }

  if (forgotPasswordBtn && signInEmail) {
    forgotPasswordBtn.addEventListener('click', async () => {
      clearFormError();
      const email = signInEmail.value.trim();
      if (!email || !isValidEmail(email)) {
        showFormError('Enter a valid email address to receive a reset link.');
        return;
      }
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
      if (error) {
        showFormError(error.message);
        return;
      }
      showFormError('Password reset link sent. Check your inbox.', true);
    });
  }

  if (paymentForm) {
    paymentForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!credentials.length) {
        alert('No delivery credentials available. Please add one in your account.');
        return;
      }

      const method = paymentMethod?.value || 'cod';
      const selectedId = credentialSelect?.value;
      const selectedCredential = credentials.find((c) => c.id === selectedId) || credentials[0];
      if (!selectedCredential) {
        alert('Please choose a delivery credential.');
        return;
      }

      const selectedItems = cart.filter((item) => item.selected);
      if (!selectedItems.length) {
        alert('No items selected for checkout.');
        closePanel(paymentModal);
        return;
      }

      const total = selectedItems.reduce((sum, item) => {
        const value = Number(item.value);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);

      const ok = await placeOrder(selectedItems, total, method, selectedCredential);
      if (!ok) return;

      cart = cart.filter((item) => !item.selected);
      saveState();
      updateCartCount();
      renderCartPage();
      closePanel(paymentModal);
      showSuccessDialog({
        title: 'Order placed!',
        message: 'Your order was successfully placed.',
        buttonText: 'View Orders',
        onAction: () => {
          if (cartTabs) {
            activateTab(cartTabs, 'ordersTab');
          } else {
            window.location.href = 'cart.html';
          }
        },
      });
      loadOrders();
    });
  }

  if (accountForm) {
    accountForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!accountNameInput || !accountEmailInput || !currentUser) return;

      const { error } = await supabaseClient
        .from('profiles')
        .update({
          name: accountNameInput.value.trim(),
          phone: accountPhoneInput ? accountPhoneInput.value.trim() : '',
        })
        .eq('id', currentUser.id);
      if (error) {
        alert('Failed to save profile: ' + error.message);
        return;
      }
      currentUser.name = accountNameInput.value.trim();
      if (accountPhoneInput) currentUser.phone = accountPhoneInput.value.trim();
      saveState();
      if (accountStatus) accountStatus.textContent = `Hi, ${currentUser.name.split(' ')[0]}`;
      showToast('Account settings saved.');
    });
  }

  if (addCredentialBtn) {
    addCredentialBtn.addEventListener('click', async () => {
      if (!credentialPhoneInput || !credentialAddressInput) return;
      const phoneValue = credentialPhoneInput.value.trim();
      const addressValue = credentialAddressInput.value.trim();
      if (!phoneValue || !addressValue) {
        alert('Please enter both phone number and delivery address.');
        return;
      }

      const ok = await saveCredential(phoneValue, addressValue);
      if (!ok) return;

      credentialPhoneInput.value = '';
      credentialAddressInput.value = '';
      if (addCredentialBtn) addCredentialBtn.textContent = 'Add Delivery Credential';
      editingCredentialId = null;
      await loadCredentials();
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!requireSignIn()) return;
      const selectedItems = cart.filter((item) => item.selected);
      if (!selectedItems.length) {
        alert('Please select at least one item to checkout.');
        return;
      }

      if (!credentials.length) {
        alert('Please add at least one delivery credential in your account before checkout.');
        return;
      }

      renderCredentialSelect();
      openPanel(paymentModal);
    });
  }

  // --- Add to Cart / view product (delegation; button or tile/card opens the modal) ---
  document.addEventListener('click', (event) => {
    const addBtn = event.target.closest('.add-btn');
    const tile = event.target.closest('[data-id]');

    if (addBtn && tile) {
      if (!requireSignIn()) return;
      const product = productsMap[tile.dataset.id];
      if (product) openProductModal(product, addBtn);
    } else if (tile) {
      const product = productsMap[tile.dataset.id];
      if (product) openProductModal(product, null);
    }
  });

  if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', () => {
      if (!currentSelectedProduct) return;
      if (!requireSignIn()) return;
      addToCart(currentSelectedProduct);

      if (currentAddButtonEl) {
        currentAddButtonEl.textContent = 'Added';
        currentAddButtonEl.disabled = true;
        currentAddButtonEl.style.opacity = '0.8';
      }

      closePanel(productModal);
      currentSelectedProduct = null;
      currentAddButtonEl = null;
    });
  }

  if (modalCheckoutBtn) {
    modalCheckoutBtn.addEventListener('click', () => {
      if (!currentSelectedProduct) return;
      if (!requireSignIn()) return;
      addToCart(currentSelectedProduct);
      window.location.href = 'cart.html';
    });
  }

  // --- Initialize All Tab Containers ---
  if (categoryTabs) {
    setupTabs(categoryTabs);
  }

  if (accountTabs) {
    setupTabs(accountTabs);
  }

  if (cartTabs) {
    setupTabs(cartTabs);
  }

  if (accountStatus) {
    accountStatus.addEventListener('click', (e) => {
      e.stopPropagation();
      if (userDropdown) userDropdown.classList.toggle('hidden');
    });
  }

  document.addEventListener('click', () => {
    if (userDropdown) userDropdown.classList.add('hidden');
  });

  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        await supabaseClient.auth.signOut();
      } catch (err) {
        console.error('signOut error', err);
      }
      clearUser();
      window.location.href = 'index.html';
    });
  }

  protectNavLinks();
  enforceProtectedPageAccess();
  openSignInIfRequested();
  populateAccountForm();
  renderCartPage();

  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

init();
