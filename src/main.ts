import './style.css';

let button = document.getElementById('platillo1');
let showCartButton = document.getElementById('showCart');
let closeCartButton = document.getElementById('close');

if (button) {
  button.addEventListener('click', () => {
    console.log('agregado taco de birria') 
  });
}

if (showCartButton) {
  showCartButton.addEventListener('click', () => {
    let modal = document.getElementById('modal');

    if (modal) {
      modal.style.display = 'block';
    }
  });
}

if(closeCartButton) {
  closeCartButton.addEventListener('click', () => {
    let modal = document.getElementById('modal');

    if (modal) {
      modal.style.display = 'none';
    }
  });
}