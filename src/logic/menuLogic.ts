import Dish from "../model/dish";
import { DEFAULT_RESTAURANT_CONFIG, RestaurantConfig } from "../model/restaurantConfig";
import OrderLogic from "./orderLogic";

export const CUSTOM_CONFIG_STORAGE_KEY = 'rikomenu_custom_config_v1';

export default class MenuLogic {
    public config: RestaurantConfig = structuredClone(DEFAULT_RESTAURANT_CONFIG);
    public currentRestaurantId: string | null = null;
    public dishes: Dish[] = [];
    public dishesComponents: HTMLElement[] = [];
    public orderLogic: OrderLogic; 

    constructor() {
        this.orderLogic = new OrderLogic();    
    } 

    public async init(restaurantId: string | null = null): Promise<void> {
        this.currentRestaurantId = restaurantId;
        // On /restaurant/:id, load directly from the static [id].json file; on /demo, allow localStorage draft preview
        const ignoreLocalDraft = restaurantId !== null;
        await this.loadDishes(ignoreLocalDraft, restaurantId);
        this.applyRestaurantConfig();
        this.generateDishes();
    }

    private getStorageKey(restaurantId?: string | null): string {
        const id = restaurantId || this.currentRestaurantId;
        return id ? `${CUSTOM_CONFIG_STORAGE_KEY}_${id}` : CUSTOM_CONFIG_STORAGE_KEY;
    }

    public hasCustomConfig(): boolean {
        try {
            return localStorage.getItem(this.getStorageKey()) !== null;
        } catch {
            return false;
        }
    }

    public saveCustomConfig(newConfig: RestaurantConfig) {
        this.config = this.normalizeConfig(newConfig);
        this.dishes = this.config.dishes;
        try {
            localStorage.setItem(CUSTOM_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
        } catch {
            // Ignore quota errors
        }
        this.applyRestaurantConfig();
        this.generateDishes();
    }

    public async resetToDefaultConfig(): Promise<void> {
        try {
            localStorage.removeItem(this.getStorageKey());
            localStorage.removeItem(CUSTOM_CONFIG_STORAGE_KEY);
        } catch {
            // Ignore storage errors
        }
        await this.loadDishes(true, this.currentRestaurantId);
        this.applyRestaurantConfig();
        this.generateDishes();
    }

    public exportConfigAsJson(configToExport: RestaurantConfig = this.config) {
        const normalized = this.normalizeConfig(configToExport);
        const jsonString = JSON.stringify(normalized, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const cleanId = (normalized.restaurantId || '')
            .trim()
            .replace(/[^a-zA-Z0-9_-]+/g, '');
        const fallbackSlug = (normalized.restaurantName || 'menu')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        link.href = url;
        link.download = `${cleanId || fallbackSlug || 'data'}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    private normalizeConfig(raw: unknown, fallbackId?: string | null): RestaurantConfig {
        if (Array.isArray(raw)) {
            return {
                ...structuredClone(DEFAULT_RESTAURANT_CONFIG),
                restaurantId: fallbackId || DEFAULT_RESTAURANT_CONFIG.restaurantId,
                dishes: raw.map((d, idx) => new Dish(
                    Number(d.id ?? idx + 1),
                    String(d.name ?? ''),
                    Number(d.price ?? 0),
                    String(d.description ?? ''),
                    String(d.imageUrl ?? '')
                ))
            };
        }

        const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<RestaurantConfig>;
        const def = DEFAULT_RESTAURANT_CONFIG;

        const dishes = Array.isArray(obj.dishes)
            ? obj.dishes.map((d, idx) => new Dish(
                Number(d.id ?? idx + 1),
                String(d.name ?? ''),
                Number(d.price ?? 0),
                String(d.description ?? ''),
                String(d.imageUrl ?? '')
            ))
            : structuredClone(def.dishes);

        return {
            restaurantId: String(obj.restaurantId || fallbackId || def.restaurantId),
            restaurantName: String(obj.restaurantName ?? def.restaurantName),
            subtitle: String(obj.subtitle ?? def.subtitle),
            whatsappPhone: String(obj.whatsappPhone ?? def.whatsappPhone),
            mapsUrl: String(obj.mapsUrl ?? def.mapsUrl),
            theme: {
                primaryColor: String(obj.theme?.primaryColor || def.theme.primaryColor),
                backgroundColor: String(obj.theme?.backgroundColor || def.theme.backgroundColor),
                cardColor: String(obj.theme?.cardColor || def.theme.cardColor),
            },
            payment: {
                bankName: String(obj.payment?.bankName ?? def.payment.bankName),
                accountHolder: String(obj.payment?.accountHolder ?? def.payment.accountHolder),
                clabe: String(obj.payment?.clabe ?? def.payment.clabe),
                cardNumber: String(obj.payment?.cardNumber ?? def.payment.cardNumber),
            },
            social: {
                facebookUrl: String(obj.social?.facebookUrl ?? def.social.facebookUrl),
                tiktokUrl: String(obj.social?.tiktokUrl ?? def.social.tiktokUrl),
                instagramUrl: String(obj.social?.instagramUrl ?? def.social.instagramUrl ?? ''),
            },
            dishes
        };
    }

    public applyRestaurantConfig() {
        const { theme, restaurantName, subtitle, payment, social } = this.config;

        // Apply CSS Theme Variables
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--bg-color', theme.backgroundColor);
        root.style.setProperty('--card-bg', theme.cardColor);

        // Update Header & Page Title
        const titleEl = document.getElementById('restaurantName');
        if (titleEl) titleEl.textContent = restaurantName;

        const subtitleEl = document.getElementById('restaurantSubtitle');
        if (subtitleEl) subtitleEl.textContent = subtitle;

        document.title = `RikoMenu - ${restaurantName}`;

        // Update BankTag Modal Details
        const bankNameEl = document.getElementById('bankNameValue');
        if (bankNameEl) bankNameEl.textContent = payment.bankName || 'No especificado';

        const holderEl = document.getElementById('cardHolderValue');
        if (holderEl) holderEl.textContent = payment.accountHolder || 'No especificado';

        const clabeWrapper = document.getElementById('bankTagClabe');
        const clabeEl = document.getElementById('clabeNumber');
        if (clabeEl) clabeEl.textContent = payment.clabe || '';
        if (clabeWrapper) {
            clabeWrapper.style.display = payment.clabe ? 'flex' : 'none';
        }

        const cardWrapper = document.getElementById('bankTagCardNumber');
        const accountEl = document.getElementById('accountNumber');
        if (accountEl) accountEl.textContent = payment.cardNumber || '';
        if (cardWrapper) {
            cardWrapper.style.display = payment.cardNumber ? 'flex' : 'none';
        }

        // Update Social Modal Links
        const fbLink = document.getElementById('socialFb') as HTMLAnchorElement | null;
        if (fbLink) {
            fbLink.href = social.facebookUrl || '#';
            fbLink.style.display = social.facebookUrl ? 'inline-flex' : 'none';
        }

        const tiktokLink = document.getElementById('socialTiktok') as HTMLAnchorElement | null;
        if (tiktokLink) {
            tiktokLink.href = social.tiktokUrl || '#';
            tiktokLink.style.display = social.tiktokUrl ? 'inline-flex' : 'none';
        }

        const igLink = document.getElementById('socialInstagram') as HTMLAnchorElement | null;
        if (igLink) {
            igLink.href = social.instagramUrl || '#';
            igLink.style.display = social.instagramUrl ? 'inline-flex' : 'none';
        }
    }

    getDishes() {  
        return this.dishes;
    }

    getDishById(id: number) {
        id = Number(id);
        return this.dishes.find(dish => Number(dish.id) === id);
    }

    public generateDishes() {
        const menuContainer = document.querySelector('.menu') as HTMLElement | null;
        if (!menuContainer) return;

        menuContainer.querySelectorAll('dish-component, .menu-status').forEach(el => el.remove());
        this.dishesComponents = [];

        if (this.dishes.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'menu-status';
            emptyMsg.textContent = 'No hay platillos disponibles en este momento.';
            menuContainer.appendChild(emptyMsg);
            return;
        }

        this.dishes.forEach((dish) => { 
            const dishTemplate = document.createElement('dish-component') as HTMLElement;
            dishTemplate.setAttribute('dish-name', dish.name);
            dishTemplate.setAttribute('dish-description', dish.description);
            dishTemplate.setAttribute('dish-price', Number(dish.price).toFixed(2));
            dishTemplate.setAttribute('dish-image', dish.imageUrl || '');
            dishTemplate.setAttribute('dish-id', dish.id.toString());
            menuContainer.appendChild(dishTemplate);
            this.dishesComponents.push(dishTemplate);

            dishTemplate.addEventListener('add-to-order', (event: Event) => {
                const customEvent = event as CustomEvent;
                const dishId = Number(customEvent.detail.id);
                const selectedDish = this.getDishById(dishId);

                if (selectedDish) { 
                    this.orderLogic.addToOrder(selectedDish);
                }
            });
        });
    }

    async loadDishes(ignoreLocalStorage = false, restaurantId: string | null = null): Promise<void> {
        const targetId = restaurantId ?? this.currentRestaurantId;

        // 1. Check localStorage override for this restaurant ID (or demo draft)
        if (!ignoreLocalStorage) {
            try {
                const specificKey = this.getStorageKey(targetId);
                const stored = localStorage.getItem(specificKey) || (!targetId ? localStorage.getItem(CUSTOM_CONFIG_STORAGE_KEY) : null);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.config = this.normalizeConfig(parsed, targetId);
                    this.dishes = this.config.dishes;
                    return;
                }
            } catch {
                // Fall back to static JSON files
            }
        }

        // 2. Build candidate JSON URLs based on /restaurant/[id] or default data.json
        const candidateUrls = targetId
            ? [
                `/assets/${encodeURIComponent(targetId)}.json`,
                `/assets/restaurants/${encodeURIComponent(targetId)}.json`,
                `/restaurant/${encodeURIComponent(targetId)}.json`,
                `/assets/data.json`
              ]
            : [`/assets/data.json`];

        for (const url of candidateUrls) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('text/html')) continue; // Skip SPA HTML fallback
                const data = await response.json();
                this.config = this.normalizeConfig(data, targetId);
                this.dishes = this.config.dishes;
                return;
            } catch {
                // Try next candidate path
            }
        }

        this.config = this.normalizeConfig(DEFAULT_RESTAURANT_CONFIG, targetId);
        this.dishes = this.config.dishes;
    } 
}