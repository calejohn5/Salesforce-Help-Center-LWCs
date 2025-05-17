import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createEmailTemplate from '@salesforce/apex/emailTemplateBuilderController.createEmailTemplate';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunity';

const OBJECTS = {
    'Contact': CONTACT_OBJECT,
    'Opportunity': OPPORTUNITY_OBJECT
};

export default class EmailTemplateBuilder extends LightningElement {
    @track Name = '';
    @track Description = '';
    @track Subject = '';
    @track Body = '';
    @track relatedEntityType = '';
    @track objectApiName;
    @track selectedFieldApiName;
    @track fieldsOptions = [];

    // Options for the 'Related Entity Type' combobox.
    get relatedEntityTypeOptions() {
        return [
            { label: 'Contact', value: 'Contact' },
            { label: 'Session', value: 'Opportunity' }
        ];
    }

    // Handlers for input change events.
    handleNameChange(event) {
        this.Name = event.target.value;
    }

    handleDescriptionChange(event) {
        this.Description = event.target.value;
    }

    handleSubjectChange(event) {
        this.Subject = event.target.value;
    }

    handleBodyChange(event) {
        this.Body = event.target.value;
    }

    handleRelatedEntityTypeChange(event) {
        this.relatedEntityType = event.target.value;
        this.objectApiName = OBJECTS[this.relatedEntityType];
    }

    // Get object info dynamically based on the selected related entity
    @wire(getObjectInfo, { objectApiName: '$objectApiName' })
    wiredObjectInfo({ error, data }) {
        if (data) {
            this.fieldsOptions = this.getFieldsOptions(data);
            if(this.relatedEntityType === 'Opportunity') {
                //hardcode first and last name for Opportunity merge fields since it only appears as 'Name'
                this.addFieldToOptions('FirstName', 'First Name');
                this.addFieldToOptions('LastName', 'Last Name');
            }
        } else if (error) {
            this.showErrorMessage('Error fetching object information');
        }
    }
    
    addFieldToOptions(apiName, label) {
        this.fieldsOptions.push({
            value: apiName,
            label: label
        });
    
        // Sort again after adding new fields
        this.fieldsOptions.sort((a, b) => a.label.localeCompare(b.label));
    }    

    getFieldsOptions(objectInfo) {
        const fieldInfos = objectInfo.fields;
        const fieldsArray = Object.keys(fieldInfos).map(fieldApiName => ({
            label: fieldInfos[fieldApiName].label,
            value: fieldApiName
        }));
    
        // Sort by label
        fieldsArray.sort((a, b) => a.label.localeCompare(b.label));
        
        return fieldsArray;
    }

    // Handle the selection of merge fields
    handleFieldSelection(event) {
        this.selectedFieldApiName = event.detail.value;
        const inputElement = this.template.querySelector('lightning-input-rich-text');
        
        let prefix = 'Recipient';
        if ((this.relatedEntityType === 'Opportunity' || this.relatedEntityType === 'Session') 
            && this.selectedFieldApiName !== 'FirstName' && this.selectedFieldApiName !== 'LastName') {
            prefix = 'Opportunity';
        }
    
        if (inputElement && this.selectedFieldApiName) {
            const startPos = inputElement.selectionStart;
            const endPos = inputElement.selectionEnd;
            const selectedFieldText = `{{{${prefix}.${this.selectedFieldApiName}}}}`;
            inputElement.setRangeText(selectedFieldText, startPos, endPos, 'end');
        }
    }

    // Handle creating a new EmailTemplate record
    createEmailTemplate() {
        if(!this.Name) {
            this.showErrorMessage('Email Template Name is required.');
            return;
        }
        // Validate the starting character of the name
        if (!this.isValidStartingChar(this.Name)) {
            this.showErrorMessage('The Name should not start with a number or contain special characters.');
            return;
        }
        if(!this.relatedEntityType) {
            this.showErrorMessage('Related Entity Type is required.');
            return;
        }
        createEmailTemplate({
            Name: this.Name,
            Description: this.Description,
            Subject: this.Subject,
            Body: this.Body,
            RelatedEntityType: this.relatedEntityType
        })
        .then(() => {
            this.showToast('Success', 'Email Template created successfully', 'success');
            this.dispatchEvent(new CustomEvent('closemodal', { bubbles: true }));
            // Refresh the page after a slight delay to ensure modal closes smoothly
            setTimeout(() => {
                window.location.reload();
            }, 1000); // 1000 milliseconds = 1 second
        })
        .catch(error => {
            const errorMessage = (error && error.body && error.body.message) ? error.body.message : 'Unknown error occurred';
            this.showErrorMessage(errorMessage);
        });
    }

    isValidStartingChar(name) {
        return /^[a-zA-Z][a-zA-Z0-9 ]*$/.test(name);
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
    showErrorMessage(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error',
                mode: 'dismissable'
            })
        );
    }
    
    // Dispatch a close event to notify parent component to close the modal
    handleCancel() {
        this.dispatchEvent(new CustomEvent('closemodal'));
    }
}