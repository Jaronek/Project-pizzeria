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
        amount: (settings.amountWidget.defaultValue),
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
            console.log(option.label, paramId, optionId);
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

        thisWidget.setValue(settings.amountWidget.defaultValue - 1); 
      });
        
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();

        thisWidget.setValue(settings.amountWidget.defaultValue + 1);
      });
   
    }
    
    announce(){
      const thisWidget = this;

      const event = new Event('updated');
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
    }
   
    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
    }
    add(menuProduct) {
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);
      
      thisCart.element = utils.createDOMFromHTML(generatedHTML);
      console.log(thisCart.element);
      const menuContainer = thisCart.dom.productList;

      menuContainer.appendChild(thisCart.element);

      thisCart.products.push(new cartProduct(menuProduct, thisCart.element));
      console.log('thisCart.products', thisCart.products);
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
    
      
    }

    getElements(element){
      const thisCartProduct = this;
      
      thisCartProduct.dom = {};
      
      thisCartProduct.dom.wrapper = element;

      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      console.log(thisCartProduct.dom.amountWidget);

      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      console.log(thisCartProduct.dom.price);

      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
     
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);

    }

  }

  const app = {
    initMenu: function(){
      const thisApp = this;

      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    initData: function(){
      const thisApp = this;
      thisApp.data = dataSource;
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
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}
