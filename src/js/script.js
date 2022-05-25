/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product {
    
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;
      
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.procesOrder();
    }

    prepareCartProduct(){
      const thisProduct = this;
    
      const productSummary = {
        id: (thisProduct.id),
        name: (thisProduct.data.name),
        amount: (thisProduct.amountWidget.input.value),
        priceSingle: (thisProduct.priceSingle),
        price: (thisProduct.priceSingle * settings.amountWidget.defaultValue),
        params: (thisProduct.prepareCartProductParams())
      };

      return productSummary;
    }

    prepareCartProductParams(){
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);

      // set price to default price
      const params = {};
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        params[paramId] = {
          label: param.label,
          options: {}
        };
        // for every option in this category
        for(let optionId in param.options) {
          
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          
          if(formData[paramId] && formData[paramId].includes(optionId)){
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
    

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

    renderInMenu(){
      const thisProduct = this;

      const generatedHTML = templates.menuProduct(thisProduct.data);
      
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      const menuContainer = document.querySelector(select.containerOf.menu);

      menuContainer.appendChild(thisProduct.element);

    }

    getElements(){
      const thisProduct = this;
     
      thisProduct.dom = {};

      thisProduct.dom.wrapper = thisProduct.element;

      thisProduct.accordionTrigger = thisProduct.dom.wrapper.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.dom.wrapper.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.dom.wrapper.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.dom.wrapper.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.dom.wrapper.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.dom.wrapper.querySelector(select.menuProduct.amountWidget);
    }

    initAmountWidget(){
      const thisProduct = this;
      
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.procesOrder();
      });
    }

    initAccordion(){
      const thisProduct = this;
      
      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */

        const activeProduct = document.querySelector(select.all.menuProductsActive);

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if(activeProduct != null && activeProduct != thisProduct.element){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
       
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      }); 
    }

    initOrderForm(){
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });

      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.procesOrder();
        });
      } 

      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.procesOrder();
        thisProduct.addToCart();
      });

    }
    procesOrder(){
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        
        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          

          if(formData[paramId] && formData[paramId].includes(optionId)){

            if(!option.default){
              price = price + option.price;
            } 
          } else if (option.default){
            price = price - option.price;
          }
          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionImage){
            if(optionSelected) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            }else if (!optionSelected){
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }  
          }
        }
      }
    
      // update calculated price in the HTML
      thisProduct.priceSingle = price;
      price *= settings.amountWidget.defaultValue;
      thisProduct.priceElem.innerHTML = price;
    }
  }
  
  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.initActions();
      thisWidget.setValue(thisWidget.input.value);
      
    }
  
    getElements(element){
      const thisWidget = this;
  
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      
    }
  
    setValue(value){
      const thisWidget = this;
      
      const newValue = parseInt(value);
  
      if(settings.amountWidget.defaultValue !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax){
        settings.amountWidget.defaultValue = newValue;
        thisWidget.announce();
      }
      
      thisWidget.input.value = settings.amountWidget.defaultValue;
    
    }
    
  
    initActions(){

      const thisWidget = this;
      
      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      
      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();

        thisWidget.setValue(--thisWidget.input.value); 
      });
        
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();

        thisWidget.setValue(++thisWidget.input.value);
      });
   
    }
    
    announce(){
      const thisWidget = this;

      const event = new CustomEvent('updated', {
        bubbles: true
      });

      thisWidget.element.dispatchEvent(event);
    }
  }

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
      //dlaczego przy wborze wszystkich elementow nie wstawia total price w innerHTML
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
      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      };
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
      thisCart.update();
    }

    update(){
      const thisCart = this;
      const transportFee = settings.cart.defaultDeliveryFee;
      let totalNumber = 0;
      let subtotalPrice = 0;
      for(let cartProducts of thisCart.products){
        const amount = parseInt(cartProducts.amount);
        totalNumber = amount + totalNumber;
        thisCart.totalNumber = totalNumber
        subtotalPrice = cartProducts.price + subtotalPrice;
        thisCart.subtotalPrice = subtotalPrice;
        console.log(subtotalPrice);
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
  
  class cartProduct {
    constructor(menuProduct, element){

      const thisCartProduct = this;

      thisCartProduct.menuProduct = menuProduct;

      thisCartProduct.id = menuProduct.id;

      thisCartProduct.amount = menuProduct.amount;

      thisCartProduct.name = menuProduct.name;

      thisCartProduct.priceSingle = menuProduct.priceSingle;

      thisCartProduct.price = menuProduct.price;
      
      thisCartProduct.params = menuProduct.params;
    
      thisCartProduct.getElements(element);
      thisCartProduct.initWidgetAmountCart();
      thisCartProduct.initActions();
    }

    getElements(element){
      const thisCartProduct = this;
      
      thisCartProduct.dom = {};
      
      thisCartProduct.dom.wrapper = element;
      
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);

      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);

      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
     
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);

    }

    initWidgetAmountCart(){
      const thisCartProduct = this;
      thisCartProduct.amountWidgetElem = new AmountWidget(thisCartProduct.dom.amountWidget); 
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        
        thisCartProduct.amount = thisCartProduct.amountWidgetElem.input.value;
        
        thisCartProduct.price = thisCartProduct.amountWidgetElem.input.value * thisCartProduct.priceSingle;

        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
        console.log(thisCartProduct.amount);
      });
    }

    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });  
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    
    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }

    getData(){
      const thisCartProduct = this;

      const cartProductSummary = {
        id: (thisCartProduct.id),
        amount: (thisCartProduct.amount),
        price: (thisCartProduct.price),
        priceSingle: (thisCartProduct.priceSingle),
        name: (thisCartProduct.name),
        params: (thisCartProduct.params)
      }
     return cartProductSummary;
    }
  }

  const app = {
    initMenu: function(){
      const thisApp = this;

      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    initData: function(){
      const thisApp = this;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);

          /*save parsedResponse as thisApp.data.products*/
          thisApp.data.products = parsedResponse;
          /*execute initMenu method */
          thisApp.initMenu();
        });
    },

    init: function(){
      const thisApp = this;
      console.log('thisApp.data:', thisApp.data);
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);
      thisApp.initData();
      thisApp.initCart();
    },
  };

  app.init();
}
