export default class AlertComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const alertMessage = this.getAttribute('alert-message');
        const alertType = this.getAttribute('alert-type');

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
                <style>
                    .alert {  
                        padding: 20px;
                        margin: 10px 0;
                        border-radius: 5px;
                        font-size: 16px;
                        color: #fff;
                    }
                    .success {
                        background-color: #4CAF50; /* Green */
                    }
                    .error {
                        background-color: #f44336; /* Red */
                    }
                    .warning {
                        background-color: #ff9800; /* Orange */
                    }
                </style>
                <div class="alert ${alertType}">
                    ${alertMessage}
                </div>
            `;
        }
    }
}