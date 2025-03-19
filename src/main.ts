import './style.css';

let button = document.getElementById('platillo1');

let showMapButton = document.getElementById('ShowMap');
let showCartButton = document.getElementById('ShowCart');
let showSocialButton = document.getElementById('ShowSocial');
let showBankTagButton = document.getElementById('ShowBankTag');

let closeCartButton = document.getElementById('closeCart');
let closeSocialButton = document.getElementById('closeSocial');
let closeBankTagButton = document.getElementById('closeBankTag');

let modals = [
  'modalMap',
  'modalOrder',
  'modalSocial',
  'modalBankTag', 
]

//#region CartBehavior
if (button) {
  button.addEventListener('click', () => {
    console.log('agregado taco de birria') 
  });
}
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
//#endregion