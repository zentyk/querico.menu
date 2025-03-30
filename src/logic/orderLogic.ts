import Dish from "../model/dish";
import OrderedDish from "../model/orderedDish";

export default class OrderLogic {
    private orderedDishes: OrderedDish[];
    
    constructor() {
        this.orderedDishes = [];
    }
    
    addToOrder(dish:Dish) {
        let orderedDish = new OrderedDish(dish.id, dish.name, dish.price);

        if(this.orderedDishes.some(dish => dish.id === orderedDish.id)) {
            let index = this.orderedDishes.findIndex(dish => dish.id === orderedDish.id);
            this.orderedDishes[index].quantity++;
            orderedDish = this.orderedDishes[index];
        } else {
            this.orderedDishes.push(orderedDish);
        } 
    }

    removeFromOrder(dishId: number) {
        this.orderedDishes = this.orderedDishes.filter(dish => dish.id !== dishId);
        console.log(this.orderedDishes);
    }
    
    getOrder() {
        return this.orderedDishes;
    }
}