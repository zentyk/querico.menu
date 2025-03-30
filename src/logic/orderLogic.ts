import Dish from "../model/dish";
import OrderedDish from "../model/orderedDish";

export default class OrderLogic {
    private orderedDishes: OrderedDish[];
    private alertComponent: HTMLElement;
    
    constructor() {
        this.orderedDishes = [];
        this.alertComponent = document.createElement('alert-component') as HTMLElement;
    }
    
    addToOrder(dish:Dish) {
        dish.id = Number(dish.id);
        let orderedDish = new OrderedDish(dish.id, dish.name,dish.price); 

        if(this.orderedDishes.some(dish => dish.id === orderedDish.id)) {
            let index = this.orderedDishes.findIndex(dish => dish.id === orderedDish.id);
            this.orderedDishes[index].quantity++;
            orderedDish = this.orderedDishes[index];
        } else {
            this.orderedDishes.push(orderedDish);
        }

        this.addItemAlert();
    }

    removeFromOrder(dishId: number) {
        dishId = Number(dishId);
        let index = this.orderedDishes.findIndex(dish => dish.id === dishId);
        if(index !== -1) {
            this.orderedDishes[index].quantity--;
            if(this.orderedDishes[index].quantity <= 0) {
                this.orderedDishes.splice(index, 1);
            }
        }

        this.removeItemAlert();
    }
    
    public getOrder() {
        let orderCart = document.getElementById('cart') as HTMLElement;
        orderCart.innerHTML = '';
        if(orderCart) { 
            this.orderedDishes.forEach(dish => {
                let dishComponent = document.createElement('ordered-dish-component') as HTMLElement;
                dishComponent.setAttribute('dish-name', dish.name);
                dishComponent.setAttribute('dish-price', dish.price.toString());
                dishComponent.setAttribute('dish-id', dish.id.toString());
                dishComponent.setAttribute('dish-quantity', dish.quantity.toString());
                
                orderCart.appendChild(dishComponent);

                dishComponent.addEventListener('add-to-order', (event: Event) => {
                    const customEvent = event as CustomEvent;
                    const dishId = customEvent.detail.id;
                    this.addToOrder(new Dish(dishId, dish.name, dish.price,'',''));
                    this.getOrder();
                });
                
                dishComponent.addEventListener('remove-from-order', (event: Event) => {
                    const customEvent = event as CustomEvent;
                    const dishId = customEvent.detail.id;
                    this.removeFromOrder(dishId);
                    this.getOrder();
                });
            });

            document.getElementById('total')!.innerHTML = `Total: $${this.orderedDishes.reduce((acc, dish) => acc + (dish.price * dish.quantity), 0)}`;
        }
    } 

    public formatOrderUrlText() {
        let orderUrlText = '';
        this.orderedDishes.forEach(dish => {
            orderUrlText += `%0a * ${dish.quantity} ${dish.name} - $${dish.price} `;
        });
        return orderUrlText;
    }

    addItemAlert() {
        if(this.alertComponent) {
            this.alertComponent.remove();
        }        
        this.alertComponent.setAttribute('alert-message', 'Platillo Agregado');
        this.alertComponent.setAttribute('alert-type', 'success');

        document.body.appendChild(this.alertComponent);

        setTimeout(() => {
            this.alertComponent.remove();
        }, 1000);
    }

    removeItemAlert() { 
        this.alertComponent.setAttribute('alert-message', 'Platillo Eliminado');
        this.alertComponent.setAttribute('alert-type', 'error');

        document.body.appendChild(this.alertComponent);

        setTimeout(() => {
            this.alertComponent.remove();
        }, 1000);
    }
}