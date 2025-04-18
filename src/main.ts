import AlertComponent from './components/alertComponent';
import DishComponent from './components/dishComponent';
import OrderedDishComponent from './components/orderedDishComponent';
import MenuLogic from './logic/menuLogic';
import './style.css';

let showMapButton = document.getElementById('ShowMap');
let showCartButton = document.getElementById('ShowCart');
let showSocialButton = document.getElementById('ShowSocial');
let showBankTagButton = document.getElementById('ShowBankTag');

let closeCartButton = document.getElementById('closeCart');
let closeSocialButton = document.getElementById('closeSocial');
let closeBankTagButton = document.getElementById('closeBankTag');

window.customElements.define('dish-component', DishComponent);
window.customElements.define('ordered-dish-component', OrderedDishComponent);
window.customElements.define('alert-component', AlertComponent);

let alertComponent = document.createElement('alert-component') as HTMLElement;

let modals = [
  'modalMap',
  'modalOrder',
  'modalSocial',
  'modalBankTag', 
]

//#region Menu


let menuLogic = new MenuLogic();

setTimeout(() => {
  menuLogic.getDishes()
}, 1000);

setTimeout(() => {
  menuLogic.generateDishes();
}, 1000);

//#endregion

//#region Modal BankTag
if(showBankTagButton) {
  showBankTagButton.addEventListener('click', () => {
    let modal = document.getElementById(modals[3]);

    if (modal) {
      modal.style.display = 'block';
    }
  });
}

if(closeBankTagButton) {
  closeBankTagButton.addEventListener('click', () => {
    let modal = document.getElementById(modals[3]);

    if (modal) {
      modal.style.display = 'none';
    }
  });
}

let copyAccountButton = document.getElementById('copyAccount');
if(copyAccountButton) {
  copyAccountButton.addEventListener('click', () => {
    let account = document.getElementById('accountNumber');

    if(account) {
      let accountText = account.innerText.replace(/\s/g, '');

      navigator.clipboard.writeText(accountText);
       
      if(alertComponent) alertComponent.remove();
      alertComponent = document.createElement('alert-component') as HTMLElement;
      alertComponent.setAttribute('alert-message', 'Número de cuenta copiado');
      alertComponent.setAttribute('alert-type', 'success');
      document.body.appendChild(alertComponent); 

      setTimeout(() => {
        alertComponent.remove();
      }, 1000);
    } 
  });
}
//#endregion

//#region Modal Map
if(showMapButton) {
  showMapButton.addEventListener('click', () => {
    //to google maps
    window.open('https://maps.app.goo.gl/MV7Tepvimy9GDWtY6'); 
  });
}
//#endregion

//#region Modal Social
if (showSocialButton) {
  showSocialButton.addEventListener('click', () => {
    let modal = document.getElementById(modals[2]);

    if (modal) {
      modal.style.display = 'block';
    }
  });
}

if(closeSocialButton) {
  closeSocialButton.addEventListener('click', () => {
    let modal = document.getElementById(modals[2]);

    if (modal) {
      modal.style.display = 'none';
    }
  });
}
//#endregion

//#region Modal Order

if (showCartButton) {
  showCartButton.addEventListener('click', () => {
    let modal = document.getElementById(modals[1]);

    if (modal) {
      modal.style.display = 'block';
      menuLogic.orderLogic.getOrder();
    }
  });
}

if(closeCartButton) {
  closeCartButton.addEventListener('click', () => {
    let modal = document.getElementById(modals[1]);

    if (modal) {
      modal.style.display = 'none';
    }
  });
}

let orderCart = document.getElementById('orderCart');
if(orderCart) {
  orderCart.addEventListener('click', () => {

    let orderData = menuLogic.orderLogic.formatOrderUrlText();

    let message = `Hola, me gustaría ordenar:${orderData}`; 

    window.open(`https://wa.me/+525619331064?text=${message}`);

    let closingModal = document.getElementById(modals[1]);
    if (closingModal) {
      closingModal.style.display = 'none';
    }  
  });
}
//#endregion