import {LightningElement} from 'lwc';
import getRoommates from '@salesforce/apex/RoommateController.getRoommates';
export default class List extends LightningElement {
    error;
    records;

// hook when component is inserted into DOM
// store data in variables and let our html work with it
    connectedCallback() {
        getRoommates()
        .then(result=>{
            this.records=result;
            this.error=undefined;
        })
        .catch(error=>{
            this.records=undefined;
            this.error=error;
        })
    }
}