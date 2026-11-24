import Dish from "./dish";

export interface ThemeConfig {
    primaryColor: string;
    backgroundColor: string;
    cardColor: string;
}

export interface PaymentConfig {
    bankName: string;
    accountHolder: string;
    clabe: string;
    cardNumber: string;
}

export interface SocialConfig {
    facebookUrl: string;
    tiktokUrl: string;
    instagramUrl?: string;
}

export interface RestaurantConfig {
    restaurantId: string;
    restaurantName: string;
    subtitle: string;
    whatsappPhone: string;
    mapsUrl: string;
    theme: ThemeConfig;
    payment: PaymentConfig;
    social: SocialConfig;
    dishes: Dish[];
}

export const DEFAULT_RESTAURANT_CONFIG: RestaurantConfig = {
    restaurantId: "123456789",
    restaurantName: "Birria Los Panchos",
    subtitle: "— Menú Digital —",
    whatsappPhone: "525619331064",
    mapsUrl: "https://maps.app.goo.gl/MV7Tepvimy9GDWtY6",
    theme: {
        primaryColor: "#cb202d",
        backgroundColor: "#1e1e1e",
        cardColor: "#2c2c2c"
    },
    payment: {
        bankName: "Klar",
        accountHolder: "Porfirio Díaz Cortez",
        clabe: "646180123456789012",
        cardNumber: "1234 5678 9012 3456"
    },
    social: {
        facebookUrl: "https://www.facebook.com",
        tiktokUrl: "https://www.tiktok.com",
        instagramUrl: ""
    },
    dishes: [
        {
            id: 1,
            name: "Taco de Birria",
            description: "A traditional Mexican dish made with slow-cooked beef, spices, and served in a corn tortilla.",
            price: 10.99,
            imageUrl: "/assets/platillos/birria.jpg"
        },
        {
            id: 2,
            name: "Taco de Pescado",
            description: "A delicious fish taco topped with cabbage, salsa, and a creamy sauce.",
            price: 12.99,
            imageUrl: "/assets/platillos/birria.jpg"
        },
        {
            id: 3,
            name: "Taco al Pastor",
            description: "A popular Mexican taco made with marinated pork, pineapple, and onions.",
            price: 11.99,
            imageUrl: "/assets/platillos/birria.jpg"
        }
    ]
};
