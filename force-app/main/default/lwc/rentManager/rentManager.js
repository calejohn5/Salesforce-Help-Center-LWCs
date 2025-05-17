import { LightningElement, track, wire } from 'lwc';
import getMonth from "@salesforce/apex/MonthData.getMonth";
import getRoommate from "@salesforce/apex/MonthData.getRoommate";

export default class RentManager extends LightningElement {
    @track error = undefined;
    @track monthOptions;
    @track roommateOptions
      @wire (getMonth)
        month({ error, data }) {
        if (data) {
          this.monthOptions = data.map(type => {
            return {
              label: type.Name,
              value: type.Id 
            };
          });
          this.monthOptions.unshift({ label: 'Select a month', value: '' });
        } else if (error) {
          this.monthOptions = undefined;
          this.error = error;
        }
      }

      @wire (getRoommate)
      roommate({ error, data }) {
      if (data) {
        this.roommateOptions = data.map(type => {
          return {
            label: type.Name,
            value: type.Id 
          };
        });
        this.roommateOptions.unshift({ label: 'Select a month', value: '' });
      } else if (error) {
        this.roommateOptions = undefined;
        this.error = error;
      }
    }

      handleSearchOptionChange(event) {
        event.preventDefault();
        this.selectedMonthTypeId = event.detail.value;
        const searchEvent = new CustomEvent('search', {
          detail: {
            monthTypeId: this.selectedMonthTypeId
          }
        })
        searchEvent;
        this.dispatchEvent(searchEvent);
      }
    }