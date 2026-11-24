import AlertComponent from './components/alertComponent';
import DishComponent from './components/dishComponent';
import MenuBuilder from './components/menuBuilder';
import OrderedDishComponent from './components/orderedDishComponent';
import PrintPreview from './components/printPreview';
import MenuLogic from './logic/menuLogic';
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
const designMenuBtn = document.getElementById('designMenuBtn');
const printPreviewBtn = document.getElementById('printPreviewBtn');

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
}

function parseRoute(pathname: string): ParsedRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const segments = clean.split('/').filter(Boolean);

  // Check /restaurant/:id[/disena | /print-preview]
  if (segments[0]?.toLowerCase() === 'restaurant' && segments[1]) {
    const restaurantId = decodeURIComponent(segments[1]);
    const sub = segments[2]?.toLowerCase();
    if (sub === 'disena' || sub === 'builder') {
      return { view: 'builder', restaurantId };
    }
    if (sub === 'print-preview' || sub === 'print') {
      return { view: 'print', restaurantId };
    }
    return { view: 'menu', restaurantId };
  }

  // Check /demo/disena, /disena, /demo/print-preview, /print-preview
  const last = segments[segments.length - 1]?.toLowerCase();
  if (last === 'disena' || last === 'builder') {
    return { view: 'builder', restaurantId: menuLogic.currentRestaurantId };
  }
  if (last === 'print-preview' || last === 'print') {
    return { view: 'print', restaurantId: menuLogic.currentRestaurantId };
  }

  return { view: 'menu', restaurantId: null };
}

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  void handleRouteChange();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleRouteChange() {
  const { view, restaurantId } = parseRoute(window.location.pathname);

  if (restaurantId !== menuLogic.currentRestaurantId) {
    await menuLogic.init(restaurantId);
  }

  if (menuView) menuView.hidden = view !== 'menu';
  if (builderView) builderView.hidden = view !== 'builder';
  if (printView) printView.hidden = view !== 'print';

  if (view === 'builder' && builderView) {
    if (!menuBuilder) {
      menuBuilder = new MenuBuilder(
        builderView,
        menuLogic,
        (targetId) => navigateTo(targetId ? `/restaurant/${encodeURIComponent(targetId)}` : '/demo'),
        (targetId) => navigateTo(targetId ? `/restaurant/${encodeURIComponent(targetId)}/print-preview` : '/demo/print-preview')
      );
    }
    menuBuilder.open();
  } else if (view === 'print' && printView) {
    if (!printPreview) {
      printPreview = new PrintPreview(
        printView,
        menuLogic,
        () => {
          const id = menuLogic.currentRestaurantId;
          navigateTo(id ? `/restaurant/${encodeURIComponent(id)}` : '/demo');
        },
        () => {
          const id = menuLogic.currentRestaurantId;
          navigateTo(id ? `/restaurant/${encodeURIComponent(id)}/disena` : '/demo/disena');
        }
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
    const id = menuLogic.currentRestaurantId;
    navigateTo(id ? `/restaurant/${encodeURIComponent(id)}/disena` : '/demo/disena');
  });
}

if (printPreviewBtn) {
  printPreviewBtn.addEventListener('click', () => {
    const id = menuLogic.currentRestaurantId;
    navigateTo(id ? `/restaurant/${encodeURIComponent(id)}/print-preview` : '/demo/print-preview');
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

//#region Modal Order
if (showCartButton) {
  showCartButton.addEventListener('click', () => {
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

    const phone = (menuLogic.config.whatsappPhone || '525619331064').replace(/[^\d]/g, '');
    const encodedMessage = menuLogic.orderLogic.formatOrderUrlText();
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
    closeModal(modals[1]);
  });
}
//#endregion