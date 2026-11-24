export default class DishComponent extends HTMLElement {
    static get observedAttributes() {
        return ['dish-name', 'dish-description', 'dish-price', 'dish-image', 'dish-id'];
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
        const dishName = this.getAttribute('dish-name') || '';
        const dishDescription = this.getAttribute('dish-description') || '';
        const rawPrice = parseFloat(this.getAttribute('dish-price') || '0');
        const formattedPrice = Number.isFinite(rawPrice) ? rawPrice.toFixed(2) : '0.00';
        const dishImage = (this.getAttribute('dish-image') || '').trim();
        const dishId = this.getAttribute('dish-id') || '';
        const hasImage = dishImage.length > 0;

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
                <style>
                :host {
                    display: block;
                }

                .food-items {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background-color: var(--card-bg, #2c2c2c);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
                    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                }

                .food-items:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.38);
                    border-color: var(--primary-color, #cb202d);
                }

                .image-wrapper {
                    position: relative;
                    width: 100%;
                    height: 210px;
                    overflow: hidden;
                    background-color: #1f1f1f;
                }

                .food-items img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.35s ease;
                }

                .food-items:hover img {
                    transform: scale(1.04);
                }
                    
                .details {
                    padding: 18px 20px 20px;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    gap: 12px;
                }

                .details-sub {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                }

                .details-sub h5 {
                    margin: 0;
                    font-weight: 700;
                    font-size: 1.15rem;
                    color: #ffffff;
                    line-height: 1.3;
                }

                .price {
                    margin: 0;
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #ffffff;
                    background-color: var(--primary-color, #cb202d);
                    padding: 4px 10px;
                    border-radius: 999px;
                    white-space: nowrap;
                }

                .details p {
                    margin: 0;
                    color: #b8b8b8;
                    font-size: 0.94rem;
                    line-height: 1.55;
                    font-weight: 400;
                    flex: 1;
                }

                .add-btn {
                    margin-top: 6px;
                    background-color: var(--primary-color, #cb202d);
                    border: none;
                    color: #fff;
                    font-size: 0.95rem;
                    font-weight: 600;
                    border-radius: 10px;
                    width: 100%;
                    padding: 12px 16px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: filter 0.2s ease, transform 0.1s ease;
                }

                .add-btn:hover {
                    filter: brightness(1.12);
                }

                .add-btn:active {
                    transform: scale(0.98);
                }
                </style>

                <article class="food-items">
                    ${hasImage ? `
                    <div class="image-wrapper" id="imgWrap${dishId}">
                        <img src="${dishImage}" alt="${dishName}" loading="lazy">
                    </div>` : ''}
                    <div class="details">
                        <div class="details-sub">
                            <h5>${dishName}</h5>
                            <span class="price">$${formattedPrice}</span>
                        </div>
                        <p>${dishDescription}</p>
                        <button class="add-btn" id="dish${dishId}" type="button">
                            <span>+ Agregar a la orden</span>
                        </button>
                    </div>
                </article>`;
                
            const imgEl = this.shadowRoot.querySelector('img');
            if (imgEl) {
                imgEl.addEventListener('error', () => {
                    const wrap = this.shadowRoot?.getElementById(`imgWrap${dishId}`);
                    if (wrap) wrap.style.display = 'none';
                });
            }

            const button = this.shadowRoot.getElementById(`dish${dishId}`);
            
            if (button) {
                button.addEventListener('click', () => { 
                    const event = new CustomEvent('add-to-order', {
                        detail: {
                            id: dishId,
                            name: dishName,
                            description: dishDescription,
                            price: formattedPrice,
                            imageUrl: dishImage
                        }
                    });
                    this.dispatchEvent(event);
                });
            }
        } 
    }
}