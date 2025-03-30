export default class OrderedDishComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
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
        let totalDish = parseFloat(dishPrice) * parseInt(dishQuantity);

        if(this.shadowRoot) { 
            this.shadowRoot.innerHTML = `
                <style>
                    .cartItem{
                        display: grid;
                        grid-template-columns: 1fr 2fr 1fr;
                        grid-gap: 10px;
                        padding: 10px;
                        border-bottom: 1px solid #6f6f6f;
                    }
                        
                    .addItem {
                        width: 2rem;
                        height: 2rem;
                        border-radius: 100%;
                        border: none;
                        background-color: #cb202d;
                    }
                    
                    .removeItem {
                        width: 2rem;
                        height: 2rem;
                        border-radius: 100%;
                        border: none;
                        background-color: #cb202d;
                    }
                </style>

                <div class="cartItem">
                    <h3>${dishQuantity}</h3>
                    <h4>${dishName}</h4>
                    <h3>$${totalDish}</h3>
                    <button class="addItem">+</button>
                    <span></span>
                    <button class="removeItem">-</button>
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