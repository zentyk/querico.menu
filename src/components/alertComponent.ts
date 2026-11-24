export default class AlertComponent extends HTMLElement {
    static get observedAttributes() {
        return ['alert-message', 'alert-type'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        if (this.isConnected) {
            this.render();
        }
    }

    render() {
        const alertMessage = this.getAttribute('alert-message') || '';
        const alertType = this.getAttribute('alert-type') || 'success';

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: flex;
                        justify-content: center;
                        pointer-events: none;
                    }

                    @keyframes toastSlideUp {
                        from {
                            opacity: 0;
                            transform: translateY(16px) scale(0.96);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

                    .alert {  
                        padding: 12px 22px;
                        border-radius: 999px;
                        font-size: 0.95rem;
                        font-weight: 600;
                        color: #fff;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        animation: toastSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    .success {
                        background-color: #2e7d32;
                        border: 1px solid #4caf50;
                    }
                    .error {
                        background-color: #c62828;
                        border: 1px solid #ef5350;
                    }
                    .warning {
                        background-color: #ef6c00;
                        border: 1px solid #ff9800;
                    }
                </style>
                <div class="alert ${alertType}" role="status" aria-live="polite">
                    <span>${alertMessage}</span>
                </div>
            `;
        }
    }
}