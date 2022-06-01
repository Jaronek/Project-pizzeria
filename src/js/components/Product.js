import {select, classNames, templates, settings} from './settings.js';
import utils from './utils.js';
import AmountWidget from './components/AmountWidget.js';

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

    const formData = utils.serializeFormToObject(thisProduct.form);

    const params = {};
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      params[paramId] = {
        label: param.label,
        options: {}
      };

      for(let optionId in param.options) { 

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

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
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
      
    thisProduct.accordionTrigger.addEventListener('click', function(event) {
      event.preventDefault();

      const activeProduct = document.querySelector(select.all.menuProductsActive);

      if(activeProduct != null && activeProduct != thisProduct.element){
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
       
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

    const formData = utils.serializeFormToObject(thisProduct.form);

    let price = thisProduct.data.price;

    for(let paramId in thisProduct.data.params) {
       
      const param = thisProduct.data.params[paramId];
        
      for(let optionId in param.options) {
    
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
    
    thisProduct.priceSingle = price;
    price *= settings.amountWidget.defaultValue;
    thisProduct.priceElem.innerHTML = price;
  }
}

export default Product;