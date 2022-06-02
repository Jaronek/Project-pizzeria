import {select, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
//import AmountWidget from './AmountWidget.js';

class Booking {

    constructor(element){
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
    }
    render(element){
        const thisBooking = this;
        thisBooking.dom = {};

        thisBooking.dom.wrapper = element;

        const generatedHTML = templates.bookingWidget();
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);

        thisBooking.dom.wrapper.appendChild(generatedDOM);
        console.log(thisBooking.dom.wrapper);
        console.log(thisBooking);
    }

    initWidgets(){
        const thisBooking = this;
        
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

        thisBooking.widgetAmountElement = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.widgetAmountElement = new AmountWidget(thisBooking.dom.hoursAmount);
        
    }
}

export default Booking;