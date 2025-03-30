export default class OrderedDish {
    public id: number;
    public name: string;
    public price: number; 
    public quantity: number;

    constructor(id: number, name: string, price: number ) {
        this.id = id;
        this.name = name; 
        this.price = price; 
        this.quantity = 1; // Default quantity is 1
    }
}