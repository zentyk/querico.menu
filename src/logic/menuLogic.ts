import Dish from "../model/dish";
import OrderLogic from "./orderLogic";

export default class MenuLogic {
    public dishes: Dish[] = [];
    public dishesComponents : HTMLElement[] = [];
    private orderLogic: OrderLogic;

    constructor() {
        this.loadDishes(); 
        this.orderLogic = new OrderLogic();
    } 

    getDishes() {  
        return this.dishes;
    }

    getDishById(id: number) {
        id = Number(id);
        return this.dishes.find(dish => dish.id === id);
    }

    public generateDishes(){
        const menuContainer = document.getElementsByClassName('menu')[0] as HTMLElement;
        if (menuContainer) {
            this.dishes.forEach((dish) => {
                const dishComponent = document.createElement('dish-component') as HTMLElement;
                dishComponent.setAttribute('dish-name', dish.name);
                dishComponent.setAttribute('dish-description', dish.description);
                dishComponent.setAttribute('dish-price', dish.price.toString());
                dishComponent.setAttribute('dish-image', dish.imageUrl);
                dishComponent.setAttribute('dish-id', dish.id.toString());
                menuContainer.appendChild(dishComponent);

                dishComponent.addEventListener('add-to-order', (event: CustomEvent) => {
                    const dishId = event.detail.id;
                    const dish = this.getDishById(dishId);

                    if (dish) { 
                        this.orderLogic.addToOrder(dish);
                    }
                });
            });
        }
    }

    async loadDishes() {
        const response = await fetch('./assets/data.json');
        const data = await response.json();
        this.dishes = data;
    }
}