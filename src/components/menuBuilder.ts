import Dish from "../model/dish";
import { RestaurantConfig } from "../model/restaurantConfig";
import MenuLogic from "../logic/menuLogic";

interface ThemePreset {
    name: string;
    primaryColor: string;
    backgroundColor: string;
    cardColor: string;
}

const THEME_PRESETS: ThemePreset[] = [
    { name: "Rojo Taquería", primaryColor: "#cb202d", backgroundColor: "#1e1e1e", cardColor: "#2c2c2c" },
    { name: "Naranja Brasas", primaryColor: "#e65100", backgroundColor: "#1c1917", cardColor: "#292524" },
    { name: "Verde Agave", primaryColor: "#2e7d32", backgroundColor: "#141e16", cardColor: "#213024" },
    { name: "Azul Mariscos", primaryColor: "#0277bd", backgroundColor: "#101c26", cardColor: "#1b2d3b" },
    { name: "Dorado Gourmet", primaryColor: "#c59b27", backgroundColor: "#18181b", cardColor: "#27272a" },
];

export default class MenuBuilder {
    private container: HTMLElement;
    private menuLogic: MenuLogic;
    private draft: RestaurantConfig;
    private onNavigateToMenu: (restaurantId?: string) => void;
    private onNavigateToPrint: (restaurantId?: string) => void;

    constructor(
        container: HTMLElement,
        menuLogic: MenuLogic,
        onNavigateToMenu: (restaurantId?: string) => void,
        onNavigateToPrint: (restaurantId?: string) => void
    ) {
        this.container = container;
        this.menuLogic = menuLogic;
        this.draft = structuredClone(this.menuLogic.config);
        this.onNavigateToMenu = onNavigateToMenu;
        this.onNavigateToPrint = onNavigateToPrint;
    }

    public open() {
        this.draft = structuredClone(this.menuLogic.config);
        this.render();
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    public render() {
        const { restaurantId, restaurantName, subtitle, whatsappPhone, mapsUrl, theme, payment, social, dishes } = this.draft;

        const presetsHtml = THEME_PRESETS.map((preset, idx) => `
            <button type="button" class="preset-chip" data-preset-idx="${idx}">
                <span class="preset-dot" style="background-color: ${preset.primaryColor}"></span>
                <span>${preset.name}</span>
            </button>
        `).join('');

        const dishesHtml = dishes.map((dish, index) => {
            const hasImage = Boolean(dish.imageUrl && dish.imageUrl.trim());
            return `
            <div class="builder-dish-card" data-dish-idx="${index}">
                <div class="builder-dish-header">
                    <span class="dish-badge">Platillo #${index + 1}</span>
                    <button type="button" class="remove-dish-btn" data-remove-idx="${index}">Eliminar</button>
                </div>
                <div class="builder-grid-2">
                    <label class="builder-field">
                        <span>Nombre del platillo *</span>
                        <input type="text" class="dish-name-input" data-idx="${index}" value="${this.escapeHtml(dish.name)}" placeholder="Ej. Quesabirria Especial" required />
                    </label>
                    <label class="builder-field">
                        <span>Precio ($) *</span>
                        <input type="number" step="0.01" min="0" class="dish-price-input" data-idx="${index}" value="${Number(dish.price).toFixed(2)}" placeholder="0.00" required />
                    </label>
                </div>
                <label class="builder-field">
                    <span>Descripción / Ingredientes</span>
                    <textarea class="dish-desc-input" data-idx="${index}" rows="2" placeholder="Describe los ingredientes, tamaño o preparación...">${this.escapeHtml(dish.description)}</textarea>
                </label>
                <div class="builder-dish-image-row">
                    ${hasImage ? `<img src="${this.escapeHtml(dish.imageUrl)}" alt="Preview" class="dish-thumb-preview" data-thumb-idx="${index}" />` : ''}
                    <label class="builder-field flex-1">
                        <span>URL de Imagen (Opcional — puedes dejarlo vacío)</span>
                        <input type="text" class="dish-img-input" data-idx="${index}" value="${this.escapeHtml(dish.imageUrl || '')}" placeholder="Opcional: /assets/platillos/birria.jpg o vacío sin foto" />
                    </label>
                    <label class="upload-photo-btn">
                        <span>Subir foto</span>
                        <input type="file" accept="image/*" class="dish-file-input" data-idx="${index}" hidden />
                    </label>
                    ${hasImage ? `<button type="button" class="builder-secondary-btn clear-img-btn" data-clear-img-idx="${index}">Sin foto</button>` : ''}
                </div>
            </div>
        `}).join('');

        this.container.innerHTML = `
            <div class="builder-shell">
                <div class="builder-topbar">
                    <div class="builder-topbar-left">
                        <button type="button" id="builderBackBtn" class="builder-secondary-btn">&larr; Volver al Menú</button>
                        <div>
                            <h1 class="builder-title">Diseña tu Menú Digital e Impreso</h1>
                            <p class="builder-subtitle">Configura tu restaurante, genera su archivo <code>${this.escapeHtml(restaurantId || '123456789')}.json</code> para <code>/restaurant/${this.escapeHtml(restaurantId || '123456789')}</code> o imprímelo con QR.</p>
                        </div>
                    </div>
                    <div class="builder-topbar-actions">
                        <label class="builder-secondary-btn">
                            <span>Importar JSON</span>
                            <input type="file" id="importJsonInput" accept="application/json,.json" hidden />
                        </label>
                        <button type="button" id="resetDemoBtn" class="builder-secondary-btn">Restaurar Demo</button>
                        <button type="button" id="openPrintPreviewTopBtn" class="builder-outline-btn">🖨️ Vista de Impresión</button>
                        <button type="button" id="exportJsonTopBtn" class="builder-outline-btn">Descargar ${this.escapeHtml(restaurantId || '123456789')}.json</button>
                        <button type="button" id="savePreviewTopBtn" class="builder-primary-btn">Guardar y Ver Menú</button>
                    </div>
                </div>

                <form id="menuBuilderForm" class="builder-form" novalidate>
                    <!-- 1. Restaurant Info -->
                    <section class="builder-card">
                        <h2>1. Identificador y Datos del Restaurante</h2>
                        <div class="builder-grid-2">
                            <label class="builder-field">
                                <span>ID / Código del Restaurante (Ruta y nombre del JSON) *</span>
                                <input type="text" id="cfgRestaurantId" value="${this.escapeHtml(restaurantId || '123456789')}" placeholder="Ej. 123456789" required />
                                <small>Ruta: <code>/restaurant/${this.escapeHtml(restaurantId || '123456789')}</code> &rarr; Lee <code>/assets/${this.escapeHtml(restaurantId || '123456789')}.json</code></small>
                            </label>
                            <label class="builder-field">
                                <span>Nombre del Restaurante *</span>
                                <input type="text" id="cfgRestaurantName" value="${this.escapeHtml(restaurantName)}" placeholder="Ej. Birria Los Panchos" required />
                            </label>
                            <label class="builder-field">
                                <span>Eslogan o Subtítulo</span>
                                <input type="text" id="cfgSubtitle" value="${this.escapeHtml(subtitle)}" placeholder="Ej. — Menú Digital —" />
                            </label>
                            <label class="builder-field">
                                <span>WhatsApp para recibir pedidos (con código de país) *</span>
                                <input type="tel" id="cfgWhatsapp" value="${this.escapeHtml(whatsappPhone)}" placeholder="Ej. 525619331064" required />
                                <small>Los clientes enviarán su orden directamente a este número.</small>
                            </label>
                            <label class="builder-field">
                                <span>URL de Ubicación en Google Maps</span>
                                <input type="url" id="cfgMapsUrl" value="${this.escapeHtml(mapsUrl)}" placeholder="https://maps.app.goo.gl/..." />
                                <small>Enlace que se abrirá al tocar el botón de ubicación.</small>
                            </label>
                        </div>
                    </section>

                    <!-- 2. Theme Colors -->
                    <section class="builder-card">
                        <h2>2. Colores del Tema</h2>
                        <p class="builder-section-hint">Elige una paleta predefinida o personaliza los colores de tu marca:</p>
                        <div class="preset-chips-row">
                            ${presetsHtml}
                        </div>
                        <div class="builder-grid-3">
                            <label class="builder-color-field">
                                <span>Color Principal (Botones y Encabezado)</span>
                                <div class="color-picker-wrap">
                                    <input type="color" id="cfgPrimaryColor" value="${this.escapeHtml(theme.primaryColor)}" />
                                    <input type="text" id="cfgPrimaryColorText" value="${this.escapeHtml(theme.primaryColor)}" />
                                </div>
                            </label>
                            <label class="builder-color-field">
                                <span>Color de Fondo del Menú</span>
                                <div class="color-picker-wrap">
                                    <input type="color" id="cfgBgColor" value="${this.escapeHtml(theme.backgroundColor)}" />
                                    <input type="text" id="cfgBgColorText" value="${this.escapeHtml(theme.backgroundColor)}" />
                                </div>
                            </label>
                            <label class="builder-color-field">
                                <span>Color de Tarjetas de Platillos</span>
                                <div class="color-picker-wrap">
                                    <input type="color" id="cfgCardColor" value="${this.escapeHtml(theme.cardColor)}" />
                                    <input type="text" id="cfgCardColorText" value="${this.escapeHtml(theme.cardColor)}" />
                                </div>
                            </label>
                        </div>
                    </section>

                    <!-- 3. Payment / CLABE -->
                    <section class="builder-card">
                        <h2>3. Datos Bancarios para Transferencias (SPEI / BankTag)</h2>
                        <p class="builder-section-hint">Permite que tus comensales copien tu CLABE o tarjeta con un solo toque.</p>
                        <div class="builder-grid-2">
                            <label class="builder-field">
                                <span>Institución Bancaria (Banco)</span>
                                <input type="text" id="cfgBankName" value="${this.escapeHtml(payment.bankName)}" placeholder="Ej. Klar, BBVA, Nu, Santander, Banorte" />
                            </label>
                            <label class="builder-field">
                                <span>Nombre del Titular / Beneficiario</span>
                                <input type="text" id="cfgAccountHolder" value="${this.escapeHtml(payment.accountHolder)}" placeholder="Ej. Porfirio Díaz Cortez" />
                            </label>
                            <label class="builder-field">
                                <span>CLABE Interbancaria (18 dígitos)</span>
                                <input type="text" id="cfgClabe" maxlength="22" value="${this.escapeHtml(payment.clabe)}" placeholder="Ej. 646180123456789012" />
                                <small>Estándar en México para transferencias SPEI sin comisión.</small>
                            </label>
                            <label class="builder-field">
                                <span>Número de Tarjeta o Cuenta (Opcional)</span>
                                <input type="text" id="cfgCardNumber" maxlength="24" value="${this.escapeHtml(payment.cardNumber)}" placeholder="Ej. 1234 5678 9012 3456" />
                            </label>
                        </div>
                    </section>

                    <!-- 4. Social Networks -->
                    <section class="builder-card">
                        <h2>4. Redes Sociales</h2>
                        <div class="builder-grid-3">
                            <label class="builder-field">
                                <span>Facebook URL</span>
                                <input type="url" id="cfgFacebookUrl" value="${this.escapeHtml(social.facebookUrl)}" placeholder="https://facebook.com/turestaurante" />
                            </label>
                            <label class="builder-field">
                                <span>TikTok URL</span>
                                <input type="url" id="cfgTiktokUrl" value="${this.escapeHtml(social.tiktokUrl)}" placeholder="https://tiktok.com/@turestaurante" />
                            </label>
                            <label class="builder-field">
                                <span>Instagram URL (Opcional)</span>
                                <input type="url" id="cfgInstagramUrl" value="${this.escapeHtml(social.instagramUrl || '')}" placeholder="https://instagram.com/turestaurante" />
                            </label>
                        </div>
                    </section>

                    <!-- 5. Dishes -->
                    <section class="builder-card">
                        <div class="builder-dishes-header">
                            <div>
                                <h2>5. Platillos del Menú (${dishes.length})</h2>
                                <p class="builder-section-hint">Agrega, edita o elimina los platillos que verán tus clientes.</p>
                            </div>
                            <button type="button" id="addDishBtn" class="builder-primary-btn">+ Agregar Platillo</button>
                        </div>
                        <div id="builderDishesList" class="builder-dishes-list">
                            ${dishesHtml}
                        </div>
                    </section>

                    <div class="builder-bottom-bar">
                        <button type="button" id="openPrintPreviewBottomBtn" class="builder-outline-btn">🖨️ Vista de Impresión</button>
                        <button type="button" id="exportJsonBottomBtn" class="builder-outline-btn">Exportar ${this.escapeHtml(restaurantId || '123456789')}.json</button>
                        <button type="submit" id="savePreviewBottomBtn" class="builder-primary-btn">Guardar y Ver Menú</button>
                    </div>
                </form>
            </div>
        `;

        this.attachEvents();
    }

    private syncFormToDraft() {
        const getVal = (id: string) => (this.container.querySelector(`#${id}`) as HTMLInputElement | null)?.value.trim() ?? '';

        this.draft.restaurantId = getVal('cfgRestaurantId').replace(/[^a-zA-Z0-9_-]/g, '') || '123456789';
        this.draft.restaurantName = getVal('cfgRestaurantName') || 'Mi Restaurante';
        this.draft.subtitle = getVal('cfgSubtitle') || '— Menú Digital —';
        this.draft.whatsappPhone = getVal('cfgWhatsapp').replace(/[^\d+]/g, '');
        this.draft.mapsUrl = getVal('cfgMapsUrl');

        this.draft.theme = {
            primaryColor: getVal('cfgPrimaryColorText') || getVal('cfgPrimaryColor') || '#cb202d',
            backgroundColor: getVal('cfgBgColorText') || getVal('cfgBgColor') || '#1e1e1e',
            cardColor: getVal('cfgCardColorText') || getVal('cfgCardColor') || '#2c2c2c',
        };

        this.draft.payment = {
            bankName: getVal('cfgBankName'),
            accountHolder: getVal('cfgAccountHolder'),
            clabe: getVal('cfgClabe'),
            cardNumber: getVal('cfgCardNumber'),
        };

        this.draft.social = {
            facebookUrl: getVal('cfgFacebookUrl'),
            tiktokUrl: getVal('cfgTiktokUrl'),
            instagramUrl: getVal('cfgInstagramUrl'),
        };

        const dishCards = this.container.querySelectorAll('.builder-dish-card');
        const updatedDishes: Dish[] = [];
        dishCards.forEach((card, idx) => {
            const name = (card.querySelector('.dish-name-input') as HTMLInputElement)?.value.trim() || `Platillo ${idx + 1}`;
            const rawPrice = parseFloat((card.querySelector('.dish-price-input') as HTMLInputElement)?.value || '0');
            const price = Number.isFinite(rawPrice) && rawPrice >= 0 ? Math.round(rawPrice * 100) / 100 : 0;
            const description = (card.querySelector('.dish-desc-input') as HTMLTextAreaElement)?.value.trim() || '';
            const imageUrl = (card.querySelector('.dish-img-input') as HTMLInputElement)?.value.trim() || '';
            updatedDishes.push(new Dish(idx + 1, name, price, description, imageUrl));
        });

        this.draft.dishes = updatedDishes;
    }

    private bindColorPair(colorId: string, textId: string) {
        const colorInput = this.container.querySelector(`#${colorId}`) as HTMLInputElement | null;
        const textInput = this.container.querySelector(`#${textId}`) as HTMLInputElement | null;
        if (!colorInput || !textInput) return;

        colorInput.addEventListener('input', () => {
            textInput.value = colorInput.value;
            this.syncFormToDraft();
            this.applyLiveThemePreview();
        });

        textInput.addEventListener('input', () => {
            if (/^#[0-9a-fA-F]{6}$/.test(textInput.value.trim())) {
                colorInput.value = textInput.value.trim();
                this.syncFormToDraft();
                this.applyLiveThemePreview();
            }
        });
    }

    private applyLiveThemePreview() {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', this.draft.theme.primaryColor);
        root.style.setProperty('--bg-color', this.draft.theme.backgroundColor);
        root.style.setProperty('--card-bg', this.draft.theme.cardColor);
    }

    private attachEvents() {
        this.bindColorPair('cfgPrimaryColor', 'cfgPrimaryColorText');
        this.bindColorPair('cfgBgColor', 'cfgBgColorText');
        this.bindColorPair('cfgCardColor', 'cfgCardColorText');

        // Theme preset chips
        this.container.querySelectorAll('.preset-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.syncFormToDraft();
                const idx = Number((btn as HTMLElement).dataset.presetIdx);
                const preset = THEME_PRESETS[idx];
                if (preset) {
                    this.draft.theme = {
                        primaryColor: preset.primaryColor,
                        backgroundColor: preset.backgroundColor,
                        cardColor: preset.cardColor,
                    };
                    this.applyLiveThemePreview();
                    this.render();
                    this.menuLogic.orderLogic.showAlert(`Tema "${preset.name}" aplicado`, 'success');
                }
            });
        });

        // Add Dish (image is optional by default)
        const addDishBtn = this.container.querySelector('#addDishBtn');
        addDishBtn?.addEventListener('click', () => {
            this.syncFormToDraft();
            const nextId = this.draft.dishes.length + 1;
            this.draft.dishes.push(new Dish(
                nextId,
                `Nuevo Platillo ${nextId}`,
                10.00,
                "Descripción del platillo...",
                ""
            ));
            this.render();
        });

        // Clear Dish Image (make dish text-only)
        this.container.querySelectorAll('.clear-img-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.syncFormToDraft();
                const idx = Number((btn as HTMLElement).dataset.clearImgIdx);
                if (this.draft.dishes[idx]) {
                    this.draft.dishes[idx].imageUrl = '';
                    this.render();
                }
            });
        });

        // Remove Dish
        this.container.querySelectorAll('.remove-dish-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.syncFormToDraft();
                const idx = Number((btn as HTMLElement).dataset.removeIdx);
                if (this.draft.dishes.length <= 1) {
                    this.menuLogic.orderLogic.showAlert('Tu menú debe tener al menos 1 platillo', 'warning');
                    return;
                }
                this.draft.dishes.splice(idx, 1);
                this.render();
            });
        });

        // Live image URL preview & local file upload (converts to base64 Data URL for serverless usage)
        this.container.querySelectorAll('.dish-img-input').forEach(input => {
            input.addEventListener('input', () => {
                const el = input as HTMLInputElement;
                const idx = el.dataset.idx;
                const thumb = this.container.querySelector(`.dish-thumb-preview[data-thumb-idx="${idx}"]`) as HTMLImageElement | null;
                if (thumb && el.value.trim()) {
                    thumb.src = el.value.trim();
                }
            });
        });

        this.container.querySelectorAll('.dish-file-input').forEach(fileInput => {
            fileInput.addEventListener('change', () => {
                const el = fileInput as HTMLInputElement;
                const idx = Number(el.dataset.idx);
                const file = el.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        this.syncFormToDraft();
                        if (this.draft.dishes[idx]) {
                            this.draft.dishes[idx].imageUrl = reader.result;
                            this.render();
                            this.menuLogic.orderLogic.showAlert('Imagen cargada correctamente', 'success');
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        });

        // Save & preview handlers
        const handleSaveAndPreview = () => {
            this.syncFormToDraft();
            this.menuLogic.saveCustomConfig(this.draft);
            this.menuLogic.orderLogic.showAlert('Menú actualizado en vista previa', 'success');
            this.onNavigateToMenu(this.draft.restaurantId);
        };

        const handleOpenPrintPreview = () => {
            this.syncFormToDraft();
            this.menuLogic.saveCustomConfig(this.draft);
            this.onNavigateToPrint(this.draft.restaurantId);
        };

        const form = this.container.querySelector('#menuBuilderForm') as HTMLFormElement | null;
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSaveAndPreview();
        });

        this.container.querySelector('#savePreviewTopBtn')?.addEventListener('click', handleSaveAndPreview);
        this.container.querySelector('#openPrintPreviewTopBtn')?.addEventListener('click', handleOpenPrintPreview);
        this.container.querySelector('#openPrintPreviewBottomBtn')?.addEventListener('click', handleOpenPrintPreview);

        // Export JSON
        const handleExport = () => {
            this.syncFormToDraft();
            this.menuLogic.saveCustomConfig(this.draft);
            this.menuLogic.exportConfigAsJson(this.draft);
            this.menuLogic.orderLogic.showAlert('Archivo JSON descargado', 'success');
        };

        this.container.querySelector('#exportJsonTopBtn')?.addEventListener('click', handleExport);
        this.container.querySelector('#exportJsonBottomBtn')?.addEventListener('click', handleExport);

        // Import JSON
        const importInput = this.container.querySelector('#importJsonInput') as HTMLInputElement | null;
        importInput?.addEventListener('change', async () => {
            const file = importInput.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                this.menuLogic.saveCustomConfig(parsed);
                this.draft = structuredClone(this.menuLogic.config);
                this.render();
                this.menuLogic.orderLogic.showAlert('Configuración JSON importada con éxito', 'success');
            } catch {
                this.menuLogic.orderLogic.showAlert('El archivo JSON no tiene un formato válido', 'error');
            }
        });

        // Reset Demo
        this.container.querySelector('#resetDemoBtn')?.addEventListener('click', async () => {
            await this.menuLogic.resetToDefaultConfig();
            this.draft = structuredClone(this.menuLogic.config);
            this.render();
            this.menuLogic.orderLogic.showAlert('Demo original restaurado', 'success');
        });

        // Back button
        this.container.querySelector('#builderBackBtn')?.addEventListener('click', () => {
            this.menuLogic.applyRestaurantConfig();
            this.onNavigateToMenu();
        });
    }
}
