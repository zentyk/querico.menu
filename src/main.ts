import AlertComponent from './components/alertComponent';
import DishComponent from './components/dishComponent';
import MenuBuilder from './components/menuBuilder';
import OrderedDishComponent from './components/orderedDishComponent';
import PrintPreview from './components/printPreview';
import MenuLogic from './logic/menuLogic';
import { FulfillmentMode, PaymentMethod, ScannedOrderTicket } from './logic/orderLogic';
import { generateQrSvg } from './logic/qrGenerator';
import './style.css';

const showMapButton = document.getElementById('ShowMap');
const showCartButton = document.getElementById('ShowCart');
const showSocialButton = document.getElementById('ShowSocial');
const showBankTagButton = document.getElementById('ShowBankTag');

const closeCartButton = document.getElementById('closeCart');
const closeSocialButton = document.getElementById('closeSocial');
const closeBankTagButton = document.getElementById('closeBankTag');
const cartBadge = document.getElementById('cartBadge');

const menuView = document.getElementById('menuView');
const builderView = document.getElementById('builderView');
const printView = document.getElementById('printView');
const demoBanner = document.getElementById('demoBanner');
const designMenuBtn = document.getElementById('designMenuBtn');

window.customElements.define('dish-component', DishComponent);
window.customElements.define('ordered-dish-component', OrderedDishComponent);
window.customElements.define('alert-component', AlertComponent);

const modals = [
  'modalMap',
  'modalOrder',
  'modalSocial',
  'modalBankTag', 
];

function openModal(modalId: string) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modalId: string) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

function updateCartBadge(totalItems: number) {
  if (!cartBadge) return;
  cartBadge.textContent = totalItems.toString();
  cartBadge.hidden = totalItems <= 0;
}

window.addEventListener('cart-updated', (event: Event) => {
  const customEvent = event as CustomEvent<{ totalItems: number; totalPrice: number }>;
  updateCartBadge(customEvent.detail.totalItems);
});

//#region Menu & Client-Side Router (/, /demo, /restaurant/:id, /disena, /print-preview)
const menuLogic = new MenuLogic();
let menuBuilder: MenuBuilder | null = null;
let printPreview: PrintPreview | null = null;

interface ParsedRoute {
  view: 'menu' | 'builder' | 'print';
  restaurantId: string | null;
  isDemoRoute: boolean;
}

function parseRoute(pathname: string): ParsedRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const segments = clean.split('/').filter(Boolean);

  // Customer-facing route: /restaurant/:id (pure menu only, no demo banner or builder)
  if (segments[0]?.toLowerCase() === 'restaurant' && segments[1]) {
    const restaurantId = decodeURIComponent(segments[1]);
    return { view: 'menu', restaurantId, isDemoRoute: false };
  }

  // Demo builder & print-preview routes accessed from /demo -> "Diseña tu menú"
  const last = segments[segments.length - 1]?.toLowerCase();
  if (last === 'disena' || last === 'builder') {
    return { view: 'builder', restaurantId: null, isDemoRoute: true };
  }
  if (last === 'print-preview' || last === 'print') {
    return { view: 'print', restaurantId: null, isDemoRoute: true };
  }

  // Show demo banner on /demo (and root / which acts as demo entry)
  const isDemo = segments.length === 0 || segments[0]?.toLowerCase() === 'demo';
  return { view: 'menu', restaurantId: null, isDemoRoute: isDemo };
}

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  void handleRouteChange();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleRouteChange() {
  const { view, restaurantId, isDemoRoute } = parseRoute(window.location.pathname);

  if (restaurantId !== menuLogic.currentRestaurantId) {
    await menuLogic.init(restaurantId);
  }

  // Only show "¿Tienes un restaurante o negocio de comida? ✨ Diseña tu menú" on /demo (never on /restaurant/:id)
  if (demoBanner) {
    demoBanner.hidden = !isDemoRoute || restaurantId !== null;
  }

  if (menuView) menuView.hidden = view !== 'menu';
  if (builderView) builderView.hidden = view !== 'builder';
  if (printView) printView.hidden = view !== 'print';

  if (view === 'builder' && builderView) {
    if (!menuBuilder) {
      menuBuilder = new MenuBuilder(
        builderView,
        menuLogic,
        () => navigateTo('/demo'),
        () => navigateTo('/demo/print-preview')
      );
    }
    menuBuilder.open();
  } else if (view === 'print' && printView) {
    if (!printPreview) {
      printPreview = new PrintPreview(
        printView,
        menuLogic,
        () => navigateTo('/demo'),
        () => navigateTo('/demo/disena')
      );
    }
    printPreview.open();
  }
}

window.addEventListener('popstate', () => {
  void handleRouteChange();
});

if (designMenuBtn) {
  designMenuBtn.addEventListener('click', () => {
    navigateTo('/demo/disena');
  });
}

updateCartBadge(menuLogic.orderLogic.getTotalItems());
const initialRoute = parseRoute(window.location.pathname);
menuLogic.init(initialRoute.restaurantId).then(() => {
  void handleRouteChange();
});
//#endregion

//#region Modal Backdrop & Escape Key Close
document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      (overlay as HTMLElement).style.display = 'none';
    }
  });
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      (overlay as HTMLElement).style.display = 'none';
    });
  }
});
//#endregion

//#region Modal BankTag (CLABE & Card Copy)
if (showBankTagButton) {
  showBankTagButton.addEventListener('click', () => {
    openModal(modals[3]);
  });
}

if (closeBankTagButton) {
  closeBankTagButton.addEventListener('click', () => {
    closeModal(modals[3]);
  });
}

async function copyElementText(elementId: string, successLabel: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const rawText = el.innerText.replace(/\s/g, '');
  try {
    await navigator.clipboard.writeText(rawText);
    menuLogic.orderLogic.showAlert(successLabel, 'success');
  } catch {
    menuLogic.orderLogic.showAlert('No se pudo copiar automáticamente', 'warning');
  }
}

const copyAccountButton = document.getElementById('copyAccount');
if (copyAccountButton) {
  copyAccountButton.addEventListener('click', () => {
    copyElementText('accountNumber', 'Número de cuenta copiado');
  });
}

const copyClabeButton = document.getElementById('copyClabe');
if (copyClabeButton) {
  copyClabeButton.addEventListener('click', () => {
    copyElementText('clabeNumber', 'CLABE interbancaria copiada');
  });
}
//#endregion

//#region Modal Map
if (showMapButton) {
  showMapButton.addEventListener('click', () => {
    const mapsUrl = menuLogic.config.mapsUrl || 'https://maps.app.goo.gl/MV7Tepvimy9GDWtY6';
    window.open(mapsUrl, '_blank', 'noopener,noreferrer'); 
  });
}
//#endregion

//#region Modal Social
if (showSocialButton) {
  showSocialButton.addEventListener('click', () => {
    openModal(modals[2]);
  });
}

if (closeSocialButton) {
  closeSocialButton.addEventListener('click', () => {
    closeModal(modals[2]);
  });
}
//#endregion

//#region Modal Order & Checkout Flow
const customerNameInput = document.getElementById('checkoutCustomerName') as HTMLInputElement | null;
const tableNumberInput = document.getElementById('checkoutTableNumber') as HTMLInputElement | null;
const deliveryAddressInput = document.getElementById('checkoutDeliveryAddress') as HTMLInputElement | null;
const orderNotesInput = document.getElementById('checkoutOrderNotes') as HTMLInputElement | null;
const fulfillmentTabs = document.querySelectorAll('.fulfillment-tab');
const paymentChips = document.querySelectorAll('.payment-chip');
const showOrderQrBtn = document.getElementById('showOrderQrBtn');
const closeOrderQrBtn = document.getElementById('closeOrderQr');
const orderQrContainer = document.getElementById('orderQrContainer');

function syncCheckoutInputsFromState() {
  const details = menuLogic.orderLogic.checkoutDetails;
  if (customerNameInput) customerNameInput.value = details.customerName;
  if (tableNumberInput) {
    tableNumberInput.value = details.tableNumber;
    tableNumberInput.hidden = details.fulfillment !== 'dine_in';
  }
  if (deliveryAddressInput) {
    deliveryAddressInput.value = details.deliveryAddress;
    deliveryAddressInput.hidden = details.fulfillment !== 'delivery';
  }
  if (orderNotesInput) orderNotesInput.value = details.notes;

  fulfillmentTabs.forEach(tab => {
    const mode = (tab as HTMLElement).dataset.mode;
    tab.classList.toggle('active', mode === details.fulfillment);
  });

  paymentChips.forEach(chip => {
    const pay = (chip as HTMLElement).dataset.pay;
    chip.classList.toggle('active', pay === details.paymentMethod);
  });
}

fulfillmentTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const mode = ((tab as HTMLElement).dataset.mode || 'dine_in') as FulfillmentMode;
    menuLogic.orderLogic.saveCheckoutDetails({ fulfillment: mode });
    syncCheckoutInputsFromState();
  });
});

paymentChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const pay = ((chip as HTMLElement).dataset.pay || 'cash') as PaymentMethod;
    menuLogic.orderLogic.saveCheckoutDetails({ paymentMethod: pay });
    syncCheckoutInputsFromState();
  });
});

customerNameInput?.addEventListener('input', () => {
  menuLogic.orderLogic.saveCheckoutDetails({ customerName: customerNameInput.value });
});

tableNumberInput?.addEventListener('input', () => {
  menuLogic.orderLogic.saveCheckoutDetails({ tableNumber: tableNumberInput.value });
});

deliveryAddressInput?.addEventListener('input', () => {
  menuLogic.orderLogic.saveCheckoutDetails({ deliveryAddress: deliveryAddressInput.value });
});

orderNotesInput?.addEventListener('input', () => {
  menuLogic.orderLogic.saveCheckoutDetails({ notes: orderNotesInput.value });
});

if (showCartButton) {
  showCartButton.addEventListener('click', () => {
    syncCheckoutInputsFromState();
    menuLogic.orderLogic.getOrder();
    openModal(modals[1]);
  });
}

if (closeCartButton) {
  closeCartButton.addEventListener('click', () => {
    closeModal(modals[1]);
  });
}

const orderCart = document.getElementById('orderCart');
if (orderCart) {
  orderCart.addEventListener('click', () => {
    if (menuLogic.orderLogic.isEmpty()) {
      menuLogic.orderLogic.showAlert('Agrega al menos un platillo para ordenar', 'warning');
      return;
    }

    const d = menuLogic.orderLogic.checkoutDetails;
    if (d.fulfillment === 'delivery' && !d.deliveryAddress.trim()) {
      menuLogic.orderLogic.showAlert('Por favor ingresa tu dirección de entrega', 'warning');
      deliveryAddressInput?.focus();
      return;
    }

    const phone = (menuLogic.config.whatsappPhone || '525619331064').replace(/[^\d]/g, '');
    const restId = menuLogic.currentRestaurantId || menuLogic.config.restaurantId || '123456789';
    const encodedMessage = menuLogic.orderLogic.formatOrderUrlText(menuLogic.config.restaurantName, restId);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
    closeModal(modals[1]);
  });
}

//#region Order QR Modal (Customer shows QR to Waiter & Waiter scans Stateless URL)
// Default to 'url' (Ultra-Fast Low-Density QR with Restaurant ID + Dish IDs)
let currentOrderQrMode: 'url' | 'text' = 'url';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCustomerOrderQrModal() {
  if (!orderQrContainer) return;
  const titleEl = document.getElementById('modalOrderQrTitle');
  if (titleEl) titleEl.textContent = '📱 Código QR de tu Orden';

  const restId = menuLogic.currentRestaurantId || menuLogic.config.restaurantId || '123456789';
  const folio = menuLogic.orderLogic.getOrderFolio(restId);
  const quickCodes = menuLogic.orderLogic.getQuickDishIdsCode();

  const payload = currentOrderQrMode === 'url'
    ? menuLogic.orderLogic.buildStatelessOrderUrl(restId)
    : menuLogic.orderLogic.buildCompactTicketQrText(menuLogic.config.restaurantName, restId);

  const qrSvg = generateQrSvg(payload, 215);
  const d = menuLogic.orderLogic.checkoutDetails;

  orderQrContainer.innerHTML = `
    <div class="order-qr-meta-bar">
      <span class="qr-meta-pill">Restaurante ID: <strong>${escapeHtml(restId)}</strong></span>
      <span class="qr-meta-pill qr-folio-pill">Folio: <strong>#${escapeHtml(folio)}</strong></span>
    </div>
    <div class="order-qr-mode-switch">
      <button type="button" class="qr-mode-btn ${currentOrderQrMode === 'url' ? 'active' : ''}" data-qrmode="url">⚡ Escaneo Rápido (IDs + Link)</button>
      <button type="button" class="qr-mode-btn ${currentOrderQrMode === 'text' ? 'active' : ''}" data-qrmode="text">📄 Ticket Texto Directo</button>
    </div>
    <div class="order-qr-box">
      ${qrSvg}
    </div>
    <div class="quick-read-id-box">
      <span class="quick-read-label">Lectura rápida de IDs (Platillo # × Cant.):</span>
      <strong class="quick-read-code">${escapeHtml(quickCodes)}</strong>
    </div>
    <div class="order-ticket-summary">
      <div class="ticket-row"><strong>Modalidad:</strong> <span>${escapeHtml(menuLogic.orderLogic.getFulfillmentLabel(d))}</span></div>
      ${d.customerName ? `<div class="ticket-row"><strong>Cliente:</strong> <span>${escapeHtml(d.customerName)}</span></div>` : ''}
      ${d.fulfillment === 'delivery' && d.deliveryAddress ? `<div class="ticket-row"><strong>Dirección:</strong> <span>${escapeHtml(d.deliveryAddress)}</span></div>` : ''}
      <div class="ticket-row"><strong>Pago:</strong> <span>${escapeHtml(menuLogic.orderLogic.getPaymentLabel(d))}</span></div>
      ${d.notes ? `<div class="ticket-row"><strong>Notas:</strong> <span>${escapeHtml(d.notes)}</span></div>` : ''}
      <div class="ticket-row ticket-total-row"><strong>Total de la Orden:</strong> <span>$${menuLogic.orderLogic.getTotalPrice().toFixed(2)}</span></div>
    </div>
  `;

  orderQrContainer.querySelectorAll('.qr-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentOrderQrMode = ((btn as HTMLElement).dataset.qrmode === 'text' ? 'text' : 'url');
      renderCustomerOrderQrModal();
    });
  });
}

function renderScannedOrderTicketModal(ticket: ScannedOrderTicket) {
  if (!orderQrContainer) return;
  const titleEl = document.getElementById('modalOrderQrTitle');
  if (titleEl) titleEl.textContent = `🧾 Orden #${ticket.folio} (Escaneada)`;

  const itemsHtml = ticket.items.map(item => `
    <div class="scanned-ticket-item">
      <span><code class="dish-id-tag">#${item.id}</code> <strong>${item.quantity}x</strong> ${escapeHtml(item.name)}</span>
      <span>$${item.subtotal.toFixed(2)}</span>
    </div>
  `).join('');

  const d = ticket.details;
  orderQrContainer.innerHTML = `
    <div class="order-qr-meta-bar">
      <span class="qr-meta-pill">Restaurante ID: <strong>${escapeHtml(ticket.restaurantId)}</strong></span>
      <span class="qr-meta-pill qr-folio-pill">Folio: <strong>#${escapeHtml(ticket.folio)}</strong></span>
    </div>
    ${ticket.restaurantMismatch ? `
      <div class="scanned-mismatch-warning">
        ⚠️ Atención: Este QR pertenece al restaurante ID <strong>${escapeHtml(ticket.restaurantId)}</strong>.
      </div>
    ` : `<div class="scanned-ticket-badge">✓ Orden verificada para ${escapeHtml(menuLogic.config.restaurantName)}</div>`}
    <div class="scanned-items-list">
      ${itemsHtml}
    </div>
    <div class="order-ticket-summary">
      <div class="ticket-row"><strong>Modalidad:</strong> <span>${escapeHtml(menuLogic.orderLogic.getFulfillmentLabel(d))}</span></div>
      ${d.customerName ? `<div class="ticket-row"><strong>Cliente:</strong> <span>${escapeHtml(d.customerName)}</span></div>` : ''}
      ${d.fulfillment === 'delivery' && d.deliveryAddress ? `<div class="ticket-row"><strong>Dirección:</strong> <span>${escapeHtml(d.deliveryAddress)}</span></div>` : ''}
      <div class="ticket-row"><strong>Pago:</strong> <span>${escapeHtml(menuLogic.orderLogic.getPaymentLabel(d))}</span></div>
      ${d.notes ? `<div class="ticket-row"><strong>Notas:</strong> <span>${escapeHtml(d.notes)}</span></div>` : ''}
      <div class="ticket-row ticket-total-row"><strong>TOTAL A COBRAR:</strong> <span>$${ticket.total.toFixed(2)}</span></div>
    </div>
  `;
  openModal('modalOrderQr');
}

showOrderQrBtn?.addEventListener('click', () => {
  if (menuLogic.orderLogic.isEmpty()) {
    menuLogic.orderLogic.showAlert('Agrega al menos un platillo para generar el QR', 'warning');
    return;
  }
  closeModal(modals[1]);
  renderCustomerOrderQrModal();
  openModal('modalOrderQr');
});

closeOrderQrBtn?.addEventListener('click', () => {
  closeModal('modalOrderQr');
});

// Check if URL contains a scanned order (?r=...&o=...) and ensure the matching restaurant JSON is loaded first
async function checkIncomingScannedOrder() {
  if (!window.location.search.includes('o=')) return;
  const params = new URLSearchParams(window.location.search);
  const qrRestId = params.get('r');
  if (qrRestId && qrRestId !== menuLogic.currentRestaurantId) {
    await menuLogic.init(qrRestId);
  }
  const activeRestId = menuLogic.currentRestaurantId || menuLogic.config.restaurantId || '123456789';
  const scanned = menuLogic.orderLogic.parseStatelessOrderFromUrl(
    window.location.search,
    menuLogic.dishes,
    activeRestId
  );
  if (scanned) {
    renderScannedOrderTicketModal(scanned);
  }
}

window.addEventListener('load', () => {
  setTimeout(() => {
    void checkIncomingScannedOrder();
  }, 200);
});
//#endregion
//#endregion