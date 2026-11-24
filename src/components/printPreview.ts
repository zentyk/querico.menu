import MenuLogic from "../logic/menuLogic";
import { generateQrSvg } from "../logic/qrGenerator";

type ClabeQrMode = 'qr_full' | 'qr_clabe_only' | 'text_only';
type PrintMarginSize = 'normal' | 'wide' | 'compact';

export default class PrintPreview {
    private container: HTMLElement;
    private menuLogic: MenuLogic;
    private onBackToMenu: () => void;
    private onGoToBuilder: () => void;

    private showImages = false;
    private clabeQrMode: ClabeQrMode = 'qr_full';
    private showMenuUrlQr = true;
    private marginSize: PrintMarginSize = 'normal';

    constructor(
        container: HTMLElement,
        menuLogic: MenuLogic,
        onBackToMenu: () => void,
        onGoToBuilder: () => void
    ) {
        this.container = container;
        this.menuLogic = menuLogic;
        this.onBackToMenu = onBackToMenu;
        this.onGoToBuilder = onGoToBuilder;
    }

    public open() {
        this.render();
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    private formatClabeReadable(clabe: string): string {
        const clean = clabe.replace(/\s+/g, '');
        if (clean.length === 18) {
            return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 17)} ${clean.slice(17)}`;
        }
        return clabe;
    }

    public render() {
        const { restaurantId, restaurantName, subtitle, whatsappPhone, payment, social, dishes, theme } = this.menuLogic.config;

        // Build CLABE / Deposit QR payload
        const clabeClean = (payment.clabe || '').replace(/\s+/g, '');
        const depositQrPayload = this.clabeQrMode === 'qr_clabe_only'
            ? (clabeClean || payment.cardNumber || restaurantName)
            : [
                `Restaurante: ${restaurantName}`,
                payment.bankName ? `Banco: ${payment.bankName}` : '',
                payment.accountHolder ? `Titular: ${payment.accountHolder}` : '',
                payment.clabe ? `CLABE: ${clabeClean}` : '',
                payment.cardNumber ? `Tarjeta: ${payment.cardNumber}` : ''
              ].filter(Boolean).join('\n');

        const depositQrSvg = this.clabeQrMode !== 'text_only'
            ? generateQrSvg(depositQrPayload, 136)
            : '';

        const menuUrl = `${window.location.origin}/restaurant/${encodeURIComponent(restaurantId || '123456789')}`;
        const menuUrlQrSvg = this.showMenuUrlQr ? generateQrSvg(menuUrl, 120) : '';

        // Group dishes by category for print
        const categoriesMap = new Map<string, typeof dishes>();
        dishes.forEach(dish => {
            const cat = (dish.category || 'General').trim() || 'General';
            if (!categoriesMap.has(cat)) {
                categoriesMap.set(cat, []);
            }
            categoriesMap.get(cat)!.push(dish);
        });

        const showCategoryHeaders = categoriesMap.size > 1 || !categoriesMap.has('General');

        const dishesPrintHtml = Array.from(categoriesMap.entries()).map(([catName, catDishes]) => {
            const itemsHtml = catDishes.map((dish) => {
                const hasImg = this.showImages && dish.imageUrl && dish.imageUrl.trim().length > 0;
                return `
                    <div class="print-dish-item">
                        ${hasImg ? `<img class="print-dish-thumb" src="${this.escapeHtml(dish.imageUrl)}" alt="${this.escapeHtml(dish.name)}" />` : ''}
                        <div class="print-dish-body">
                            <div class="print-dish-line">
                                <span class="print-dish-name">${this.escapeHtml(dish.name)}</span>
                                <span class="print-dish-dots"></span>
                                <span class="print-dish-price">$${Number(dish.price).toFixed(2)}</span>
                            </div>
                            ${dish.description ? `<p class="print-dish-desc">${this.escapeHtml(dish.description)}</p>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="print-category-block">
                    ${showCategoryHeaders ? `<h3 class="print-category-title">${this.escapeHtml(catName)}</h3>` : ''}
                    <div class="print-dishes-grid">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="print-view-wrapper">
                <!-- Interactive Control Toolbar (hidden when printing) -->
                <div class="print-toolbar no-print">
                    <div class="print-toolbar-left">
                        <button type="button" id="printBackBtn" class="builder-secondary-btn">&larr; Volver al Menú</button>
                        <button type="button" id="printEditBtn" class="builder-secondary-btn">✏️ Editar Datos</button>
                    </div>

                    <div class="print-toolbar-controls">
                        <label class="print-toggle-label">
                            <input type="checkbox" id="togglePrintImages" ${this.showImages ? 'checked' : ''} />
                            <span>Mostrar imágenes (Opcional)</span>
                        </label>

                        <label class="print-select-label">
                            <span>Sección CLABE / Depósito:</span>
                            <select id="selectClabeQrMode">
                                <option value="qr_full" ${this.clabeQrMode === 'qr_full' ? 'selected' : ''}>QR con todos los datos + Texto</option>
                                <option value="qr_clabe_only" ${this.clabeQrMode === 'qr_clabe_only' ? 'selected' : ''}>QR sólo números CLABE + Texto</option>
                                <option value="text_only" ${this.clabeQrMode === 'text_only' ? 'selected' : ''}>Sólo texto impreso (Sin QR)</option>
                            </select>
                        </label>

                        <label class="print-select-label">
                            <span>Margen de hoja:</span>
                            <select id="selectPrintMargin">
                                <option value="normal" ${this.marginSize === 'normal' ? 'selected' : ''}>Estándar (16 mm)</option>
                                <option value="wide" ${this.marginSize === 'wide' ? 'selected' : ''}>Amplio / Seguro (24 mm)</option>
                                <option value="compact" ${this.marginSize === 'compact' ? 'selected' : ''}>Compacto (10 mm)</option>
                            </select>
                        </label>

                        <label class="print-toggle-label">
                            <input type="checkbox" id="toggleMenuUrlQr" ${this.showMenuUrlQr ? 'checked' : ''} />
                            <span>QR al Menú Digital</span>
                        </label>
                    </div>

                    <div class="print-toolbar-right">
                        <button type="button" id="triggerPrintBtn" class="builder-primary-btn">🖨️ Imprimir / Guardar PDF</button>
                    </div>
                </div>

                <!-- Printable A4/Letter Menu Sheet -->
                <article class="print-sheet margin-${this.marginSize}" style="--print-accent: ${this.escapeHtml(theme.primaryColor)}">
                    <header class="print-header">
                        <div class="print-header-text">
                            <h1 class="print-restaurant-title">${this.escapeHtml(restaurantName)}</h1>
                            <p class="print-restaurant-subtitle">${this.escapeHtml(subtitle)}</p>
                            ${whatsappPhone ? `<p class="print-contact-line">Pedidos por WhatsApp: <strong>+${this.escapeHtml(whatsappPhone)}</strong></p>` : ''}
                        </div>
                        ${this.showMenuUrlQr ? `
                        <div class="print-menu-qr-box">
                            ${menuUrlQrSvg}
                            <span class="print-qr-caption">Escanea el menú digital</span>
                        </div>
                        ` : ''}
                    </header>

                    <section class="print-menu-section">
                        <h2 class="print-section-heading">Nuestro Menú</h2>
                        <div class="print-categories-wrapper">
                            ${dishesPrintHtml}
                        </div>
                    </section>

                    <footer class="print-deposit-section">
                        <div class="print-deposit-info">
                            <h3 class="print-deposit-title">Datos para Pago por Transferencia / Depósito (SPEI)</h3>
                            <div class="print-deposit-grid">
                                ${payment.bankName ? `
                                <div class="print-deposit-field">
                                    <span class="print-field-label">Banco:</span>
                                    <span class="print-field-value">${this.escapeHtml(payment.bankName)}</span>
                                </div>` : ''}
                                ${payment.accountHolder ? `
                                <div class="print-deposit-field">
                                    <span class="print-field-label">Titular / Beneficiario:</span>
                                    <span class="print-field-value">${this.escapeHtml(payment.accountHolder)}</span>
                                </div>` : ''}
                                ${payment.clabe ? `
                                <div class="print-deposit-field print-deposit-highlight">
                                    <span class="print-field-label">CLABE Interbancaria (18 dígitos):</span>
                                    <span class="print-field-clabe">${this.escapeHtml(this.formatClabeReadable(payment.clabe))}</span>
                                </div>` : ''}
                                ${payment.cardNumber ? `
                                <div class="print-deposit-field">
                                    <span class="print-field-label">Tarjeta / Cuenta:</span>
                                    <span class="print-field-mono">${this.escapeHtml(payment.cardNumber)}</span>
                                </div>` : ''}
                            </div>
                            ${whatsappPhone ? `<p class="print-deposit-note">Envía tu comprobante de transferencia por WhatsApp al <strong>+${this.escapeHtml(whatsappPhone)}</strong></p>` : ''}
                            ${(social.facebookUrl || social.tiktokUrl || social.instagramUrl) ? `
                            <p class="print-social-line">
                                Síguenos:
                                ${social.facebookUrl ? `<span>Facebook: ${this.escapeHtml(social.facebookUrl)}</span>` : ''}
                                ${social.tiktokUrl ? `<span> • TikTok: ${this.escapeHtml(social.tiktokUrl)}</span>` : ''}
                            </p>` : ''}
                        </div>

                        ${this.clabeQrMode !== 'text_only' ? `
                        <div class="print-clabe-qr-box">
                            ${depositQrSvg}
                            <span class="print-qr-caption">
                                ${this.clabeQrMode === 'qr_clabe_only' ? 'QR CLABE Interbancaria' : 'QR Datos de Depósito'}
                            </span>
                        </div>
                        ` : ''}
                    </footer>
                </article>
            </div>
        `;

        this.attachEvents();
    }

    private attachEvents() {
        this.container.querySelector('#printBackBtn')?.addEventListener('click', () => {
            this.onBackToMenu();
        });

        this.container.querySelector('#printEditBtn')?.addEventListener('click', () => {
            this.onGoToBuilder();
        });

        const imgCheckbox = this.container.querySelector('#togglePrintImages') as HTMLInputElement | null;
        imgCheckbox?.addEventListener('change', () => {
            this.showImages = imgCheckbox.checked;
            this.render();
        });

        const modeSelect = this.container.querySelector('#selectClabeQrMode') as HTMLSelectElement | null;
        modeSelect?.addEventListener('change', () => {
            this.clabeQrMode = modeSelect.value as ClabeQrMode;
            this.render();
        });

        const menuQrCheckbox = this.container.querySelector('#toggleMenuUrlQr') as HTMLInputElement | null;
        menuQrCheckbox?.addEventListener('change', () => {
            this.showMenuUrlQr = menuQrCheckbox.checked;
            this.render();
        });

        const marginSelect = this.container.querySelector('#selectPrintMargin') as HTMLSelectElement | null;
        marginSelect?.addEventListener('change', () => {
            this.marginSize = marginSelect.value as PrintMarginSize;
            this.render();
        });

        this.container.querySelector('#triggerPrintBtn')?.addEventListener('click', () => {
            window.print();
        });
    }
}
