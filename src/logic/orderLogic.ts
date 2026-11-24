import Dish from "../model/dish";
import OrderedDish from "../model/orderedDish";

const CART_STORAGE_KEY = 'rikomenu_cart_v1';
const CHECKOUT_STORAGE_KEY = 'rikomenu_checkout_v1';

export type FulfillmentMode = 'dine_in' | 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'spei';

export interface OrderCheckoutDetails {
    fulfillment: FulfillmentMode;
    customerName: string;
    tableNumber: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    notes: string;
}

export interface ScannedOrderTicket {
    restaurantId: string;
    restaurantMismatch: boolean;
    folio: string;
    items: Array<{ id: number; name: string; quantity: number; price: number; subtotal: number }>;
    total: number;
    details: OrderCheckoutDetails;
}

const DEFAULT_CHECKOUT_DETAILS: OrderCheckoutDetails = {
    fulfillment: 'dine_in',
    customerName: '',
    tableNumber: '',
    deliveryAddress: '',
    paymentMethod: 'cash',
    notes: ''
};

export default class OrderLogic {
    private orderedDishes: OrderedDish[];
    public checkoutDetails: OrderCheckoutDetails;
    private alertComponent: HTMLElement;
    private alertTimeoutId: number | null = null;
    
    constructor() {
        this.orderedDishes = this.loadFromStorage();
        this.checkoutDetails = this.loadCheckoutFromStorage();
        this.alertComponent = document.createElement('alert-component') as HTMLElement;
        this.notifyCartUpdated();
    }

    private loadCheckoutFromStorage(): OrderCheckoutDetails {
        try {
            const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
            if (!raw) return structuredClone(DEFAULT_CHECKOUT_DETAILS);
            const parsed = JSON.parse(raw);
            return {
                fulfillment: (['dine_in', 'pickup', 'delivery'].includes(parsed.fulfillment) ? parsed.fulfillment : 'dine_in') as FulfillmentMode,
                customerName: String(parsed.customerName ?? ''),
                tableNumber: String(parsed.tableNumber ?? ''),
                deliveryAddress: String(parsed.deliveryAddress ?? ''),
                paymentMethod: (['cash', 'spei'].includes(parsed.paymentMethod) ? parsed.paymentMethod : 'cash') as PaymentMethod,
                notes: String(parsed.notes ?? '')
            };
        } catch {
            return structuredClone(DEFAULT_CHECKOUT_DETAILS);
        }
    }

    public saveCheckoutDetails(partial: Partial<OrderCheckoutDetails>) {
        this.checkoutDetails = { ...this.checkoutDetails, ...partial };
        try {
            localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(this.checkoutDetails));
        } catch {
            // Ignore quota errors
        }
    }

    private loadFromStorage(): OrderedDish[] {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter(item => item && typeof item.id === 'number' && typeof item.name === 'string' && typeof item.price === 'number' && typeof item.quantity === 'number' && item.quantity > 0)
                .map(item => {
                    const dish = new OrderedDish(Number(item.id), String(item.name), Number(item.price));
                    dish.quantity = Number(item.quantity);
                    return dish;
                });
        } catch {
            return [];
        }
    }

    private saveToStorage() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.orderedDishes));
        } catch {
            // Ignore storage quota errors
        }
        this.notifyCartUpdated();
    }

    private notifyCartUpdated() {
        window.dispatchEvent(new CustomEvent('cart-updated', {
            detail: {
                totalItems: this.getTotalItems(),
                totalPrice: this.getTotalPrice()
            }
        }));
    }

    public getTotalItems(): number {
        return this.orderedDishes.reduce((acc, dish) => acc + dish.quantity, 0);
    }

    public getTotalPrice(): number {
        const rawTotal = this.orderedDishes.reduce((acc, dish) => acc + (dish.price * dish.quantity), 0);
        return Math.round(rawTotal * 100) / 100;
    }

    public isEmpty(): boolean {
        return this.orderedDishes.length === 0;
    }
    
    addToOrder(dish: Dish) {
        const id = Number(dish.id);
        const price = Number(dish.price);
        const existingIndex = this.orderedDishes.findIndex(item => item.id === id);

        if (existingIndex !== -1) {
            this.orderedDishes[existingIndex].quantity++;
        } else {
            const orderedDish = new OrderedDish(id, dish.name, price);
            this.orderedDishes.push(orderedDish);
        }

        this.saveToStorage();
        this.showAlert('Platillo agregado a tu orden', 'success');
    }

    removeFromOrder(dishId: number) {
        const id = Number(dishId);
        const index = this.orderedDishes.findIndex(dish => dish.id === id);
        if (index !== -1) {
            this.orderedDishes[index].quantity--;
            if (this.orderedDishes[index].quantity <= 0) {
                this.orderedDishes.splice(index, 1);
            }
            this.saveToStorage();
            this.showAlert('Platillo eliminado de tu orden', 'error');
        }
    }

    clearOrder() {
        this.orderedDishes = [];
        this.saveToStorage();
        this.getOrder();
    }
    
    public getOrder() {
        const orderCart = document.getElementById('cart') as HTMLElement | null;
        if (!orderCart) return;

        orderCart.innerHTML = '';

        if (this.orderedDishes.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'cart-empty-state';
            emptyState.innerHTML = `
                <p class="cart-empty-title">Tu orden está vacía</p>
                <p class="cart-empty-subtitle">Agrega platillos del menú para comenzar tu pedido.</p>
            `;
            orderCart.appendChild(emptyState);
        } else {
            this.orderedDishes.forEach(dish => {
                const dishComponent = document.createElement('ordered-dish-component') as HTMLElement;
                dishComponent.setAttribute('dish-name', dish.name);
                dishComponent.setAttribute('dish-price', dish.price.toFixed(2));
                dishComponent.setAttribute('dish-id', dish.id.toString());
                dishComponent.setAttribute('dish-quantity', dish.quantity.toString());
                
                orderCart.appendChild(dishComponent);

                dishComponent.addEventListener('add-to-order', (event: Event) => {
                    const customEvent = event as CustomEvent;
                    const dishId = Number(customEvent.detail.id);
                    this.addToOrder(new Dish(dishId, dish.name, dish.price, '', ''));
                    this.getOrder();
                });
                
                dishComponent.addEventListener('remove-from-order', (event: Event) => {
                    const customEvent = event as CustomEvent;
                    const dishId = Number(customEvent.detail.id);
                    this.removeFromOrder(dishId);
                    this.getOrder();
                });
            });
        }

        const totalEl = document.getElementById('total');
        if (totalEl) {
            totalEl.textContent = `Total: $${this.getTotalPrice().toFixed(2)}`;
        }

        const orderBtn = document.getElementById('orderCart') as HTMLButtonElement | null;
        if (orderBtn) {
            orderBtn.disabled = this.orderedDishes.length === 0;
        }

        const qrBtn = document.getElementById('showOrderQrBtn') as HTMLButtonElement | null;
        if (qrBtn) {
            qrBtn.disabled = this.orderedDishes.length === 0;
        }
    } 

    public getFulfillmentLabel(details: OrderCheckoutDetails = this.checkoutDetails): string {
        if (details.fulfillment === 'dine_in') {
            return details.tableNumber ? `Comer en mesa (Mesa #${details.tableNumber})` : 'Comer en restaurante';
        }
        if (details.fulfillment === 'pickup') {
            return 'Para llevar (Recoger en local)';
        }
        return 'Envío a domicilio';
    }

    public getPaymentLabel(details: OrderCheckoutDetails = this.checkoutDetails): string {
        return details.paymentMethod === 'spei'
            ? 'Transferencia SPEI (Adjunto comprobante)'
            : 'Efectivo';
    }

    public formatOrderUrlText(restaurantName = 'el restaurante', restaurantId = '123456789'): string {
        const d = this.checkoutDetails;
        const folio = this.getOrderFolio(restaurantId);
        let lines = `Hola, me gustaría hacer un pedido en *${restaurantName}* (ID: ${restaurantId} | Folio: *#${folio}*):\n\n`;
        lines += `📋 *DETALLE DE LA ORDEN:*\n`;
        this.orderedDishes.forEach(dish => {
            const lineSubtotal = (dish.price * dish.quantity).toFixed(2);
            lines += `• [#${dish.id}] ${dish.quantity}x ${dish.name} - $${lineSubtotal} ($${dish.price.toFixed(2)} c/u)\n`;
        });

        if (d.notes.trim()) {
            lines += `\n📝 *Notas de cocina:* ${d.notes.trim()}`;
        }

        lines += `\n\n📍 *Modalidad:* ${this.getFulfillmentLabel(d)}`;
        if (d.customerName.trim()) {
            lines += `\n👤 *Cliente:* ${d.customerName.trim()}`;
        }
        if (d.fulfillment === 'delivery' && d.deliveryAddress.trim()) {
            lines += `\n🏠 *Dirección:* ${d.deliveryAddress.trim()}`;
        }
        lines += `\n💳 *Pago:* ${this.getPaymentLabel(d)}`;
        lines += `\n\n💰 *TOTAL: $${this.getTotalPrice().toFixed(2)}*`;
        return encodeURIComponent(lines);
    }

    /**
     * Computes a deterministic 4-character alphanumeric order folio from restaurantId + items + total
     * so waiter and customer can verify they are looking at the exact same order.
     */
    public getOrderFolio(restaurantId: string): string {
        const raw = `${restaurantId}|${this.orderedDishes.map(d => `${d.id}x${d.quantity}`).join(',')}|${this.getTotalPrice().toFixed(2)}`;
        let hash = 2166136261;
        for (let i = 0; i < raw.length; i++) {
            hash ^= raw.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36).toUpperCase().slice(-4).padStart(4, '0');
    }

    /**
     * Returns a ultra-short visual code of dish IDs & quantities (e.g. "#1×2 + #3×1")
     * for instant human reading by a waiter.
     */
    public getQuickDishIdsCode(): string {
        return this.orderedDishes.map(d => `#${d.id}×${d.quantity}`).join('  ');
    }

    /**
     * Generates a compact human-readable ticket (~140-220 bytes) that includes Restaurant ID, Folio, and Dish #IDs.
     */
    public buildCompactTicketQrText(restaurantName: string, restaurantId: string): string {
        const d = this.checkoutDetails;
        const folio = this.getOrderFolio(restaurantId);
        const header = `[REST:${restaurantId} | ${restaurantName.slice(0, 18)} | #${folio}]`;
        const items = this.orderedDishes
            .map(item => `#${item.id} ${item.quantity}x ${item.name.slice(0, 20)} $${(item.price * item.quantity).toFixed(2)}`)
            .join('\n');
        const mode = d.fulfillment === 'dine_in'
            ? `Mesa:${d.tableNumber || 'S/N'}`
            : d.fulfillment === 'pickup' ? 'Llevar' : `Dom:${d.deliveryAddress.slice(0, 24)}`;
        const meta = [
            mode,
            d.customerName ? `Cli:${d.customerName.slice(0, 15)}` : '',
            `Pago:${d.paymentMethod === 'spei' ? 'SPEI' : 'Efec'}`
        ].filter(Boolean).join('|');
        const notesLine = d.notes.trim() ? `\nNota:${d.notes.trim().slice(0, 40)}` : '';
        return `${header}\n${items}\n${meta}${notesLine}\nTOTAL: $${this.getTotalPrice().toFixed(2)}`;
    }

    /**
     * Generates an ultra-compact fast-scan URL QR (~65-110 chars) with low module density for <0.2s camera focus.
     * Explicitly embeds `r` (restaurantId) and compact dish ID pairs (`1.2_3.1`) so orders never collide across restaurants.
     */
    public buildStatelessOrderUrl(restaurantId: string): string {
        const d = this.checkoutDetails;
        const cleanRestId = (restaurantId || '123456789').trim();
        const basePath = `/restaurant/${encodeURIComponent(cleanRestId)}`;
        const params = new URLSearchParams();
        const itemsCode = this.orderedDishes.map(item => `${item.id}.${item.quantity}`).join('_');
        params.set('r', cleanRestId);
        params.set('o', itemsCode);
        params.set('f', d.fulfillment === 'dine_in' ? 'M' : d.fulfillment === 'pickup' ? 'L' : 'D');
        params.set('p', d.paymentMethod === 'spei' ? 'S' : 'E');
        if (d.customerName.trim()) params.set('n', d.customerName.trim().slice(0, 24));
        if (d.tableNumber.trim() && d.fulfillment === 'dine_in') params.set('t', d.tableNumber.trim().slice(0, 8));
        if (d.deliveryAddress.trim() && d.fulfillment === 'delivery') params.set('a', d.deliveryAddress.trim().slice(0, 45));
        if (d.notes.trim()) params.set('m', d.notes.trim().slice(0, 50));

        return `${window.location.origin}${basePath}?${params.toString()}`;
    }

    /**
     * Parses a stateless order query string (?r=123456789&o=1.2_3.1&...) and validates the restaurantId against the loaded catalog.
     */
    public parseStatelessOrderFromUrl(search: string, catalog: Dish[], loadedRestaurantId: string): ScannedOrderTicket | null {
        const params = new URLSearchParams(search);
        const oParam = params.get('o');
        if (!oParam) return null;

        const qrRestaurantId = (params.get('r') || loadedRestaurantId || '123456789').trim();
        const restaurantMismatch = Boolean(params.get('r') && loadedRestaurantId && qrRestaurantId !== loadedRestaurantId);

        const items: ScannedOrderTicket['items'] = [];
        let total = 0;

        oParam.split('_').forEach(pair => {
            const [idStr, qtyStr] = pair.split('.');
            const id = Number(idStr);
            const quantity = Number(qtyStr);
            if (!Number.isFinite(id) || !Number.isFinite(quantity) || quantity <= 0) return;
            const found = catalog.find(d => Number(d.id) === id);
            if (found) {
                const subtotal = Math.round(found.price * quantity * 100) / 100;
                total = Math.round((total + subtotal) * 100) / 100;
                items.push({ id: found.id, name: found.name, quantity, price: found.price, subtotal });
            } else {
                items.push({ id, name: `Platillo ID #${id} (No encontrado)`, quantity, price: 0, subtotal: 0 });
            }
        });

        if (items.length === 0) return null;

        const rawF = params.get('f') || 'M';
        const fulfillment: FulfillmentMode =
            rawF === 'L' || rawF === 'pickup' ? 'pickup' :
            rawF === 'D' || rawF === 'delivery' ? 'delivery' : 'dine_in';

        const rawP = params.get('p') || 'E';
        const paymentMethod: PaymentMethod =
            rawP === 'S' || rawP === 'spei' ? 'spei' : 'cash';

        const folioRaw = `${qrRestaurantId}|${items.map(i => `${i.id}x${i.quantity}`).join(',')}|${total.toFixed(2)}`;
        let hash = 2166136261;
        for (let i = 0; i < folioRaw.length; i++) {
            hash ^= folioRaw.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        const folio = (hash >>> 0).toString(36).toUpperCase().slice(-4).padStart(4, '0');

        return {
            restaurantId: qrRestaurantId,
            restaurantMismatch,
            folio,
            items,
            total,
            details: {
                fulfillment,
                paymentMethod,
                customerName: params.get('n') || '',
                tableNumber: params.get('t') || '',
                deliveryAddress: params.get('a') || '',
                notes: params.get('m') || ''
            }
        };
    }

    public showAlert(message: string, type: 'success' | 'error' | 'warning' = 'success') {
        if (this.alertTimeoutId !== null) {
            window.clearTimeout(this.alertTimeoutId);
            this.alertTimeoutId = null;
        }

        if (this.alertComponent.isConnected) {
            this.alertComponent.remove();
        }

        this.alertComponent.setAttribute('alert-message', message);
        this.alertComponent.setAttribute('alert-type', type);
        document.body.appendChild(this.alertComponent);

        this.alertTimeoutId = window.setTimeout(() => {
            this.alertComponent.remove();
            this.alertTimeoutId = null;
        }, 1800);
    }
}