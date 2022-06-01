import {select, classNames, settings, templates} from '../settings.js';
import cartProduct from '../components/CartProduct.js';
import utils from '../utils.js';

class Cart {
  constructor(element){

    const thisCart = this;

    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
      
  }

  getElements(element){
    const thisCart = this;
      
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.productList = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.productList.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);     
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.adress = thisCart.dom.wrapper.querySelector(select.cart.adress);
      
  }
   
  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', function(){
      thisCart.remove(event.detail.cartProduct); 
    });
    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  sendOrder(){
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.orders;
    const payload = {
      adress: thisCart.dom.adress,
      phone: thisCart.dom.phone,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: thisCart.dom.deliveryFee,
      products: []
    };
    console.log(payload);
    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options);
      
  }

  remove(event){
    const thisCart = this;

    const eventDel = event.dom.wrapper;

    const index = thisCart.products.indexOf(event);

    thisCart.products.splice(index, 1);

    eventDel.remove();
    thisCart.update();
      
  }
  
  add(menuProduct) {
    const thisCart = this;

    const generatedHTML = templates.cartProduct(menuProduct);
      
    thisCart.element = utils.createDOMFromHTML(generatedHTML);
    const menuContainer = thisCart.dom.productList;

    menuContainer.appendChild(thisCart.element);

    thisCart.products.push(new cartProduct(menuProduct, thisCart.element));
    console.log(menuProduct);
    thisCart.update();
  }

  update(){
    const thisCart = this;
    const transportFee = settings.cart.defaultDeliveryFee;
    console.log(thisCart.products);
    let totalNumber = 1;
    let subtotalPrice = 0;
    for(let cartProducts of thisCart.products){
      console.log(cartProducts);
      const amount = parseInt(cartProducts.amount);
      totalNumber = amount + totalNumber;
      thisCart.totalNumber = totalNumber;
      subtotalPrice = cartProducts.price + subtotalPrice;
      thisCart.subtotalPrice = subtotalPrice;
    }
    if(totalNumber != 0){
      thisCart.totalPrice = subtotalPrice + transportFee;
    }else if (totalNumber == 0){
      thisCart.totalPrice = 0;
    }
      
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.deliveryFee.innerHTML = transportFee;
    thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
  }
}

export default Cart;