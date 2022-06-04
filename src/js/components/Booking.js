import {select, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DataPicker from './DataPicker.js';
import HourPicker from './HourPicker.js';
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

    thisBooking.dom.dataPicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
  }

  initWidgets(){
    const thisBooking = this;
        
    thisBooking.widgetPeopleAmountElement = new AmountWidget(thisBooking.dom.peopleAmount);
    
    thisBooking.widgetHoursAmountElement = new AmountWidget(thisBooking.dom.hoursAmount);
    console.log(thisBooking.dom.dataPicker);
    thisBooking.dom.dataPicker = new DataPicker(thisBooking.dom.dataPicker);
    thisBooking.dom.hoursAmount = new HourPicker(thisBooking.dom.hourPicker);
    console.log(thisBooking.dom.dataPicker);
  }
}

export default Booking;