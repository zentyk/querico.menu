export default class DishComponent extends HTMLElement{
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); 
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const dishName = this.getAttribute('dish-name');
        const dishDescription = this.getAttribute('dish-description');
        const dishPrice = this.getAttribute('dish-price');
        const dishImage = this.getAttribute('dish-image');
        const dishId = this.getAttribute('dish-id');

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
                <style>
                .food-items{
                    display: grid;
                    position: relative;
                    grid-template-rows: auto 1fr;
                    border-radius: 15px;
                    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
                    margin-right: 5em;
                }

                .food-items img{
                    position: relative;
                    width: 100%;
                    border-radius: 15px 15px 0 0;
                }
                    
                .details{
                    padding: 20px 10px;
                    display: grid;
                    grid-template-rows: auto 1fr 50px;
                    grid-row-gap: 15px;
                }

                .details-sub{
                    display: grid;
                    grid-template-columns: auto auto;
                    }

                .details-sub>h5{
                    font-weight: 600;
                    font-size: 18px;
                }

                .price{
                    text-align: right;
                    font-size: 18px;
                }

                .details>p{
                    color: #6f6f6f;
                    font-size: 15px;
                    line-height: 28px;
                    font-weight: 400;
                    align-self: stretch;
                }

                .details>button{
                    background-color:#cb202d;
                    border:none;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: 5px;
                    width: 180px;
                }
                </style>

                <div class="food-items">
                    <img src="${dishImage}" alt="">
                    <div class="details">
                        <div class="details-sub">
                            <h5>${dishName}</h5>
                            <h2 class="price">${dishPrice}</h2>
                        </div>
                        <p>${dishDescription}</p>
                        <button id="dish${dishId}">Agregar a la orden</button>
                    </div>
                </div>`;
                
            const button = this.shadowRoot.getElementById(`dish${dishId}`);
            
            if (button) {
                button.addEventListener('click', () => { 
                    const event = new CustomEvent('add-to-order', {
                        detail: {
                            id: dishId,
                            name: dishName,
                            description: dishDescription,
                            price: dishPrice,
                            imageUrl: dishImage
                        }
                    });
                    this.dispatchEvent(event);
                });
            }
        } 
    }
}