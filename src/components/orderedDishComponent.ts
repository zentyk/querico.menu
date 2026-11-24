export default class OrderedDishComponent extends HTMLElement {
    static get observedAttributes() {
        return ['dish-id', 'dish-name', 'dish-price', 'dish-quantity'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        if (this.isConnected) {
            this.render();
        }
    }

    render() {
        const dishId = this.getAttribute('dish-id');
        const dishName = this.getAttribute('dish-name');
        const dishPrice = this.getAttribute('dish-price');
        const dishQuantity = this.getAttribute('dish-quantity');

        if (!dishId || !dishName || !dishPrice || !dishQuantity) {
            console.error('Missing attributes for OrderedDishComponent');
            return;
        }
        const unitPrice = parseFloat(dishPrice);
        const quantity = parseInt(dishQuantity, 10);
        const totalDish = (unitPrice * quantity).toFixed(2);

        if (this.shadowRoot) { 
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;
                    }

                    .cartItem {
                        display: grid;
                        grid-template-columns: 1fr auto auto;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 6px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .itemInfo {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                        min-width: 0;
                    }

                    .itemName {
                        margin: 0;
                        font-size: 0.98rem;
                        font-weight: 600;
                        color: #ffffff;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .unitPrice {
                        margin: 0;
                        font-size: 0.8rem;
                        color: #a0a0a0;
                    }

                    .stepper {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background-color: #1c1c1c;
                        padding: 4px 6px;
                        border-radius: 999px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .qty {
                        margin: 0;
                        min-width: 1.4rem;
                        text-align: center;
                        font-size: 0.95rem;
                        font-weight: 700;
                        color: #fff;
                    }
                        
                    .stepBtn {
                        width: 1.75rem;
                        height: 1.75rem;
                        border-radius: 50%;
                        border: none;
                        background-color: var(--primary-color, #cb202d);
                        color: #ffffff;
                        font-size: 1rem;
                        font-weight: 700;
                        line-height: 1;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        transition: filter 0.15s ease, transform 0.1s ease;
                    }

                    .stepBtn:hover {
                        filter: brightness(1.12);
                    }

                    .stepBtn:active {
                        transform: scale(0.92);
                    }

                    .itemSubtotal {
                        margin: 0;
                        font-size: 1rem;
                        font-weight: 700;
                        color: #ffffff;
                        min-width: 68px;
                        text-align: right;
                    }
                </style>

                <div class="cartItem">
                    <div class="itemInfo">
                        <h4 class="itemName">${dishName}</h4>
                        <span class="unitPrice">$${unitPrice.toFixed(2)} c/u</span>
                    </div>
                    <div class="stepper">
                        <button class="stepBtn removeItem" type="button" aria-label="Disminuir cantidad">&minus;</button>
                        <span class="qty">${quantity}</span>
                        <button class="stepBtn addItem" type="button" aria-label="Aumentar cantidad">+</button>
                    </div>
                    <h3 class="itemSubtotal">$${totalDish}</h3>
                </div>`;
            
            const addButton = this.shadowRoot.querySelector('.addItem') as HTMLButtonElement;
            const removeButton = this.shadowRoot.querySelector('.removeItem') as HTMLButtonElement;

            const addEvent = new CustomEvent('add-to-order', {
                detail: {
                    id: dishId,
                    name: dishName,
                    price: dishPrice,
                    quantity: dishQuantity
                }
            });

            const removeEvent = new CustomEvent('remove-from-order', {
                detail: {
                    id: dishId
                }
            });

            if (addButton) {
                addButton.addEventListener('click', () => {
                    this.dispatchEvent(addEvent);
                });
            }
            if (removeButton) {
                removeButton.addEventListener('click', () => {
                    this.dispatchEvent(removeEvent);
                });
            }
        }
    }
}