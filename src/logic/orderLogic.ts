import Dish from "../model/dish";
import OrderedDish from "../model/orderedDish";

const CART_STORAGE_KEY = 'rikomenu_cart_v1';

export default class OrderLogic {
    private orderedDishes: OrderedDish[];
    private alertComponent: HTMLElement;
    private alertTimeoutId: number | null = null;
    
    constructor() {
        this.orderedDishes = this.loadFromStorage();
        this.alertComponent = document.createElement('alert-component') as HTMLElement;
        this.notifyCartUpdated();
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
    } 

    public formatOrderUrlText(): string {
        let lines = 'Hola, me gustaría ordenar:\n';
        this.orderedDishes.forEach(dish => {
            const lineSubtotal = (dish.price * dish.quantity).toFixed(2);
            lines += `• ${dish.quantity}x ${dish.name} - $${lineSubtotal} ($${dish.price.toFixed(2)} c/u)\n`;
        });
        lines += `\n*Total: $${this.getTotalPrice().toFixed(2)}*`;
        return encodeURIComponent(lines);
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