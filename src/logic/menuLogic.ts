import Dish from "../model/dish";
import OrderLogic from "./orderLogic";

export default class MenuLogic {
    public dishes: Dish[] = [];
    public dishesComponents : HTMLElement[] = [];
    public orderLogic: OrderLogic; 

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
                let dishTemplate : HTMLElement = document.createElement('dish-component') as HTMLElement;
                dishTemplate.setAttribute('dish-name', dish.name);
                dishTemplate.setAttribute('dish-description', dish.description);
                dishTemplate.setAttribute('dish-price', dish.price.toString());
                dishTemplate.setAttribute('dish-image', dish.imageUrl);
                dishTemplate.setAttribute('dish-id', dish.id.toString());
                menuContainer.appendChild(dishTemplate);

                dishTemplate.addEventListener('add-to-order', (event: Event) => {
                    const customEvent = event as CustomEvent;
                    const dishId = customEvent.detail.id;
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