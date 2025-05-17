// import getgetMonthTypes from the getMonth => getMonth method';
import { LightningElement, wire, track } from "lwc";
import getMonth from "@salesforce/apex/MonthData.getMonth";

export default class MonthSearch extends LightningElement {
  @track selectedMonthTypeId = "";
  @track error = undefined;
  @track searchOptions;
    @wire (getMonth)
      month({ error, data }) {
      if (data) {
        this.searchOptions = data.map(type => {
          return {
            label: type.Name,
            value: type.Id 
          };
        });
        this.searchOptions.unshift({ label: 'Select a month', value: '' });
      } else if (error) {
        this.searchOptions = undefined;
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