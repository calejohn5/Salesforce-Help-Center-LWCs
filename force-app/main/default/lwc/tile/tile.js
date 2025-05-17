import { LightningElement, api} from 'lwc';
export default class Tile extends LightningElement {
    @api roommate;


/* FOR FUTURE IMPLEMENTATION
    tileClick() {
        const event = new CustomEvent('tileclick', {
            detail: this.product.fields.Id.value
        });
        this.dispatchEvent(event);
    }
*/
}