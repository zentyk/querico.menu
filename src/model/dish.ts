export default class Dish {
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string;
    category: string;

    constructor(id: number, name: string, price: number, description: string, imageUrl: string, category = 'General') {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
        this.category = category || 'General';
    }    
}