const year = document.getElementById('year');
const addButtons = document.querySelectorAll('.add-btn');
const overlay = document.getElementById('overlay');
const cartLinks = document.querySelectorAll('.cart-btn');
const openCategoriesHeroBtn = document.getElementById('openCategoriesHeroBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const signInModal = document.getElementById('signInModal');
const paymentModal = document.getElementById('paymentModal');
const closeSignInBtn = document.getElementById('closeSignInBtn');
const closePaymentBtn = document.getElementById('closePaymentBtn');
const paymentForm = document.getElementById('paymentForm');
const paymentMethod = document.getElementById('paymentMethod');
const credentialSelect = document.getElementById('credentialSelect');
const accountStatus = document.getElementById('accountStatus');

// Tab System Variables
const categoryTabs = document.getElementById('categoryTabs');
const accountTabs = document.getElementById('accountTabs');
const cartTabs = document.getElementById('cartTabs'); // Added for the new cart page tabs

const signInForm = document.getElementById('signInForm');
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

let editingCredentialIndex = null;
let cart = [];
let isSignedIn = false;
let currentUser = null;

// Temporary variables for the product modal
let currentSelectedProduct = null;
let currentAddButtonEl = null;

function formatCurrency(value) {
  return `₱${Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
    localStorage.setItem('pcroverbaliwagUser', JSON.stringify(currentUser));
  }
}

function setSignedInState(user) {
  isSignedIn = true;
  currentUser = user;
  const topbar = document.getElementById('topbar');
  if (topbar) {
    topbar.classList.remove('hidden');
  }
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

function updateCartCount() {
  const currentCartCountEl = document.getElementById('cartCount');
  if (currentCartCountEl) {
    currentCartCountEl.textContent = cart.length;
  }
}

function updateIndexPageView() {
  const heroSection = document.getElementById('heroSection');
  const homeDashboard = document.getElementById('homeDashboard');
  const guestAccess = document.getElementById('guestAccess');
  const topbar = document.getElementById('topbar');
  const heroHeader = document.getElementById('heroHeader');

  if (topbar) {
    topbar.classList.toggle('hidden', !isSignedIn);
  }

  if (heroHeader) {
    heroHeader.classList.toggle('hidden', isSignedIn);
  }

  if (heroSection && homeDashboard && guestAccess) {
    if (isSignedIn) {
      heroSection.classList.add('hidden');
      homeDashboard.classList.remove('hidden');
      guestAccess.classList.add('hidden');
    } else {
      heroSection.classList.remove('hidden');
      homeDashboard.classList.add('hidden');
      guestAccess.classList.add('hidden');
    }
  }
}

function parseCurrencyValue(priceString) {
  if (!priceString) return 0;
  const numericValue = Number(priceString.replace(/[^0-9.-]+/g, ''));
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

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
          <strong>${item.name}</strong>
          <span>${item.price}</span>
        </div>
      </label>
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

  if (!selectedCount) {
    cartTotal.textContent = formatCurrency(0);
    cartItems.insertAdjacentHTML('beforeend', '<p class="empty-state">Select at least one item to checkout.</p>');
    return;
  }

  cartTotal.textContent = formatCurrency(total);
}

function openPanel(panel) {
  if (!panel) return;
  panel.classList.remove('hidden');
  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function closePanel(panel) {
  if (!panel) return;
  panel.classList.add('hidden');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

function requireSignIn() {
  if (!isSignedIn) {
    openPanel(signInModal);
    return false;
  }
  return true;
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
        openPanel(signInModal);
      }
    });
  });
}

function enforceProtectedPageAccess() {
  const protectedPages = ['categories.html', 'account.html', 'cart.html'];
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
    openPanel(signInModal);
  }
}

function renderCredentialList() {
  if (!currentUser || !credentialList) return;
  const credentials = Array.isArray(currentUser.credentials) ? currentUser.credentials : [];

  credentialList.innerHTML = '';
  if (!credentials.length) {
    credentialList.innerHTML = '<p class="empty-state">No delivery credentials added yet.</p>';
    return;
  }

  credentials.forEach((credential, index) => {
    const credentialItem = document.createElement('div');
    credentialItem.className = 'credential-item';

    const left = document.createElement('div');
    left.className = 'credential-left';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'deliveryCredential';
    radio.value = index;
    if (currentUser.selectedCredential === index) radio.checked = true;

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
    editBtn.dataset.index = index;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn credential-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.index = index;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    credentialItem.appendChild(left);
    credentialItem.appendChild(actions);
    credentialList.appendChild(credentialItem);
  });

  const radioButtons = credentialList.querySelectorAll('input[name="deliveryCredential"]');
  radioButtons.forEach((button) => {
    button.addEventListener('change', () => {
      currentUser.selectedCredential = Number(button.value);
      saveState();
    });
  });

  const editButtons = credentialList.querySelectorAll('.credential-edit-btn');
  editButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.target.dataset.index);
      if (!Number.isFinite(idx) || !currentUser.credentials[idx]) return;
      const cred = currentUser.credentials[idx];
      credentialPhoneInput.value = cred.phone;
      credentialAddressInput.value = cred.address;
      editingCredentialIndex = idx;
      if (addCredentialBtn) addCredentialBtn.textContent = 'Save';
      window.scrollTo({ top: credentialList.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
    });
  });

  const deleteButtons = credentialList.querySelectorAll('.credential-delete-btn');
  deleteButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.target.dataset.index);
      if (!Number.isFinite(idx) || !currentUser.credentials[idx]) return;
      if (!confirm('Delete this delivery credential?')) return;
      currentUser.credentials.splice(idx, 1);
      if (currentUser.selectedCredential === idx) {
        currentUser.selectedCredential = null;
      } else if (typeof currentUser.selectedCredential === 'number' && currentUser.selectedCredential > idx) {
        currentUser.selectedCredential -= 1;
      }
      saveState();
      renderCredentialList();
      renderCredentialSelect();
    });
  });
}

function renderCredentialSelect() {
  if (!currentUser || !credentialSelect) return;
  const credentials = Array.isArray(currentUser.credentials) ? currentUser.credentials : [];

  credentialSelect.innerHTML = '';
  credentials.forEach((credential, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${credential.phone} - ${credential.address}`;
    credentialSelect.appendChild(option);
  });

  if (typeof currentUser.selectedCredential === 'number' && currentUser.selectedCredential >= 0) {
    credentialSelect.value = currentUser.selectedCredential;
  }
}

function populateAccountForm() {
  if (!currentUser || !accountNameInput || !accountEmailInput) return;
  accountNameInput.value = currentUser.name;
  accountEmailInput.value = currentUser.email;
  if (accountPhoneInput) accountPhoneInput.value = currentUser.phone || ''; 
  if (!Array.isArray(currentUser.credentials)) {
    currentUser.credentials = [];
  }
  renderCredentialList();
}

function init() {
  loadState();
  if (isSignedIn && currentUser) {
    setSignedInState(currentUser);
  }
  updateCartCount();
  setActiveNavLink();
  updateIndexPageView();

  if (openCategoriesHeroBtn) {
    openCategoriesHeroBtn.addEventListener('click', () => {
      if (!requireSignIn()) return;
      window.location.href = 'categories.html';
    });
  }

  if (cartLinks.length) {
    cartLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        if (!isSignedIn) {
          event.preventDefault();
          openPanel(signInModal);
        }
      });
    });
  }

  const guestSignInBtn = document.getElementById('guestSignInBtn');
  if (guestSignInBtn) {
    guestSignInBtn.addEventListener('click', () => {
      openPanel(signInModal);
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      closePanel(signInModal);
      closePanel(paymentModal);
      if (productModal) closePanel(productModal);
    });
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

  if (signInForm) {
    signInForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('signInEmail').value;
      
      const name = email.split('@')[0].replace(/[.\-_]/g, ' ');
      
      const user = {
        name: name
          .split(' ')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        email,
        phone: '', 
        credentials: [],
        selectedCredential: null,
      };

      setSignedInState(user);
      closePanel(signInModal);
      updateIndexPageView();
    });
  }

  if (paymentForm) {
    paymentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!currentUser || !Array.isArray(currentUser.credentials) || !currentUser.credentials.length) {
        alert('No delivery credentials available. Please add one in your account.');
        return;
      }

      const method = paymentMethod?.value || 'cod';
      const selectedIndex = Number(credentialSelect?.value);
      const selectedCredential = currentUser.credentials[selectedIndex];
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

      cart = cart.filter((item) => !item.selected);
      saveState();
      updateCartCount();
      renderCartPage();
      closePanel(paymentModal);
      alert(`Order placed with ${method === 'gcash' ? 'GCash' : 'Cash on Delivery'} using ${selectedCredential.phone} / ${selectedCredential.address}.`);
    });
  }

  if (accountForm) {
    accountForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (accountNameInput && accountEmailInput && currentUser) {
        currentUser.name = accountNameInput.value;
        currentUser.email = accountEmailInput.value;
        if (accountPhoneInput) currentUser.phone = accountPhoneInput.value; 
        accountStatus.textContent = `Hi, ${currentUser.name.split(' ')[0]}`;
        saveState();
        renderCredentialList();
      }
      alert('Account settings saved.');
    });
  }

  if (addCredentialBtn) {
    addCredentialBtn.addEventListener('click', () => {
      if (!credentialPhoneInput || !credentialAddressInput || !currentUser) return;
      const phoneValue = credentialPhoneInput.value.trim();
      const addressValue = credentialAddressInput.value.trim();
      if (!phoneValue || !addressValue) {
        alert('Please enter both phone number and delivery address.');
        return;
      }

      if (!Array.isArray(currentUser.credentials)) {
        currentUser.credentials = [];
      }

      if (editingCredentialIndex !== null && Number.isFinite(editingCredentialIndex)) {
        currentUser.credentials[editingCredentialIndex] = {
          phone: phoneValue,
          address: addressValue,
        };
        editingCredentialIndex = null;
        if (addCredentialBtn) addCredentialBtn.textContent = 'Add Delivery Credential';
      } else {
        currentUser.credentials.push({
          phone: phoneValue,
          address: addressValue,
        });
        currentUser.selectedCredential = currentUser.credentials.length - 1;
      }

      credentialPhoneInput.value = '';
      credentialAddressInput.value = '';
      saveState();
      renderCredentialList();
      renderCredentialSelect();
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

      if (!currentUser || !Array.isArray(currentUser.credentials) || !currentUser.credentials.length) {
        alert('Please add at least one delivery credential in your account before checkout.');
        return;
      }

      renderCredentialSelect();
      openPanel(paymentModal);
    });
  }

  if (addButtons.length) {
    addButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!requireSignIn()) return;

        const card = button.closest('.product-card');
        const name = card.querySelector('h3').textContent;
        const desc = card.querySelector('p').textContent;
        const price = card.querySelector('.product-meta span').textContent;
        const img = card.querySelector('img');
        const value = parseCurrencyValue(price);

        currentSelectedProduct = { name, price, value, desc, imgSrc: img.src, imgAlt: img.alt };
        currentAddButtonEl = button;

        if (modalProductImage) {
          modalProductImage.src = img.src;
          modalProductImage.alt = img.alt;
        }
        if (modalProductTitle) modalProductTitle.textContent = name;
        if (modalProductDesc) modalProductDesc.textContent = desc;
        if (modalProductPrice) modalProductPrice.textContent = price;

        openPanel(productModal);
      });
    });
  }

  if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', () => {
      if (!currentSelectedProduct) return;

      cart.push({
        name: currentSelectedProduct.name,
        price: currentSelectedProduct.price,
        value: currentSelectedProduct.value,
        selected: true
      });
      
      saveState();
      updateCartCount();

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

      cart.push({
        name: currentSelectedProduct.name,
        price: currentSelectedProduct.price,
        value: currentSelectedProduct.value,
        selected: true
      });
      
      saveState();
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
    signOutBtn.addEventListener('click', () => {
      localStorage.removeItem('pcroverbaliwagUser');
      isSignedIn = false;
      currentUser = null;
      alert('You have been signed out.');
      window.location.href = 'index.html';
    });
  }

  protectNavLinks();
  enforceProtectedPageAccess();
  openSignInIfRequested();
  populateAccountForm();
  updateIndexPageView();
  renderCartPage();

  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

init();