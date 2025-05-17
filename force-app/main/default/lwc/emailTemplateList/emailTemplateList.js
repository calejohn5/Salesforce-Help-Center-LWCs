import { LightningElement, wire, track } from 'lwc';
import getEmailTemplates from '@salesforce/apex/emailTemplateListController.getEmailTemplates';
import deleteEmailTemplate from '@salesforce/apex/emailTemplateListController.deleteEmailTemplate';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const PAGE_SIZE = 30; // Number of records displayed per page

export default class EmailTemplateList extends NavigationMixin(LightningElement) {
  @track emailTemplates = [];  // Holds the email templates for the current page
  @track allEmailTemplates = [];  // Holds all the email templates fetched from server
  @track currentPage = 1;  // Default to the first page
  @track isModalOpen = false; // Track if modal is open or not
  @track searchTerm = ''; // Track the search term entered by the user
  @track sortBy = 'Name'; // Default sort field
  @track sortDirection = 'asc'; // Default sort direction
  totalEmailTemplates = 0;  // Total number of email templates
  
  wiredResult = {}; // Store the result of the wire service

  get columns() {
    return [
        {
            label: 'Email Template Name',
            fieldName: 'Id',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Name' },
                target: '_self',
                tooltip: { fieldName: 'Name' }
            },
            sortable: true
        },
        {
            label: 'Description',
            fieldName: 'Description',
            type: 'text',
            wrapText: true,
            sortable: true,
            cellAttributes: { class: 'description-column' }
        },
        {
            label: 'Template Type',
            fieldName: 'DisplayedEntityType',
            type: 'text',
            sortable: true
        },
        {
            label: 'Last Modified Date',
            fieldName: 'FormattedLastModifiedDate',
            type: 'text',
            sortable: true
        },
        {
            label: 'Last Modified By',
            fieldName: 'LastModifiedBy',
            type: 'text',
            typeAttributes: {
                label: { fieldName: 'LastModifiedBy.Name' }
            },
            sortable: true
        },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Delete', name: 'delete' }
                ]
            }
        }
    ];
  }

  // Get Email Templates
  @wire(getEmailTemplates)
    wiredEmailTemplates(result) {
        this.wiredResult = result; 
        const { data, error } = result;
        if (data) {
            this.totalEmailTemplates = data.length;
            this.allEmailTemplates = data;
            this.filterAndSortEmailTemplates(); // Update to use the new method
        } else if (error) {
            console.error('Error retrieving email templates:', error);
        }
    }

  // Getters for sort icons and states for each column
  get isNameSorted() {
    return this.sortBy === 'Name';
  }
  
  get nameSortIcon() {
    return this.sortDirection === 'asc' ? 'utility:arrowup' : 'utility:arrowdown';
  }
  
  get isDescriptionSorted() {
    return this.sortBy === 'Description';
  }
  
  get descriptionSortIcon() {
    return this.sortDirection === 'asc' ? 'utility:arrowup' : 'utility:arrowdown';
  }
  
  get isEntityTypeSorted() {
    return this.sortBy === 'DisplayedEntityType';
  }
  
  get entityTypeSortIcon() {
    return this.sortDirection === 'asc' ? 'utility:arrowup' : 'utility:arrowdown';
  }
  
  get isLastModifiedDateSorted() {
    return this.sortBy === 'FormattedLastModifiedDate';
  }
  
  get lastModifiedDateSortIcon() {
    return this.sortDirection === 'asc' ? 'utility:arrowup' : 'utility:arrowdown';
  }
  
  get isLastModifiedBySorted() {
    return this.sortBy === 'LastModifiedBy';
  }
  
  get lastModifiedBySortIcon() {
    return this.sortDirection === 'asc' ? 'utility:arrowup' : 'utility:arrowdown';
  }

  // Method to handle header click for sorting
  handleHeaderClick(event) {
    const fieldName = event.currentTarget.dataset.field;
    
    // If clicking on the same column, toggle direction
    if (this.sortBy === fieldName) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // If clicking on a new column, set it as the sort column with default 'asc'
        this.sortBy = fieldName;
        this.sortDirection = 'asc';
    }
    
    this.filterAndSortEmailTemplates();
  }

  // Method to filter and sort email templates
  filterAndSortEmailTemplates() {
    // First filter by search term
    let filteredTemplates = this.allEmailTemplates.filter(template => 
        template.Name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    
    // Then sort the filtered results
    let sortedTemplates = [...filteredTemplates];
    
    if (this.sortBy && this.sortDirection) {
        sortedTemplates.sort((a, b) => {
            let valueA = a[this.sortBy];
            let valueB = b[this.sortBy];
            
            // Handle special cases
            if (this.sortBy === 'LastModifiedBy') {
                valueA = a.LastModifiedBy?.Name || '';
                valueB = b.LastModifiedBy?.Name || '';
            }
            
            // Default values if undefined or null
            valueA = valueA || '';
            valueB = valueB || '';
            
            // Convert to lowercase strings for comparison
            const strA = valueA.toString().toLowerCase();
            const strB = valueB.toString().toLowerCase();
            
            // Perform the comparison
            if (this.sortDirection === 'asc') {
                return strA.localeCompare(strB);
            } else {
                return strB.localeCompare(strA);
            }
        });
    }
    
    this.emailTemplates = sortedTemplates;
  }

  // Utility method to get email templates for the current page
  getEmailTemplatesForCurrentPage() {
    const startIndex = (this.currentPage - 1) * PAGE_SIZE;
    const endIndex = this.currentPage * PAGE_SIZE;
    return this.emailTemplates.slice(startIndex, endIndex);
  }

  // Get sort indicator class for a specific field
  getSortIndicator(field) {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'asc' ? 'slds-icon-utility-up' : 'slds-icon-utility-down';
  }
  
  // Check if specific field is currently sorted
  isSorted(field) {
    return this.sortBy === field;
  }

  // Method to navigate to specific record detail page
  navigateToRecordDetail(event) {
    event.preventDefault();
    const recordId = event.currentTarget.dataset.recordId;
    this[NavigationMixin.Navigate]({
      type: 'comm__namedPage',
      attributes: {
          name: 'Email_Template_Record_Detail_Subpage__c'
      },
      state: {
          recordId: recordId
      }
    });
  }

  // Handle "next" pagination action
  handleNext() {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.emailTemplates = this.getEmailTemplatesForCurrentPage();
    }
  }

  // Handle "previous" pagination action
  handlePrevious() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.emailTemplates = this.getEmailTemplatesForCurrentPage();
    }
  }

  // Check if pagination is needed
  get hasPagination() {
    return this.totalEmailTemplates > PAGE_SIZE;
  }

  // Calculate the total number of pages
  get totalPages() {
    return Math.ceil(this.totalEmailTemplates / PAGE_SIZE);
  }

  // Check if "next" button should be available
  get hasNext() {
    return this.currentPage < this.totalPages;
  }

  // Check if "previous" button should be available
  get hasPrevious() {
    return this.currentPage > 1;
  }

  // Handle actions on each row, like delete
  handleRowAction(event) {
    event.preventDefault();
    const recordId = event.currentTarget.dataset.recordId; // Accessing the recordId from the lightning-button-menu's data attribute

    let actionName = event.detail.value;  // Get the action from the clicked menu item (i.e., "delete")

    switch (actionName) {
        case 'delete':
            this.deleteRow(recordId); // Use the recordId directly to delete
            break;
        default:
            break;
    }
  }

  // Delete a specific email template
  deleteRow(rowId) {
    deleteEmailTemplate({ templateId: rowId })
    .then(result => {
        // If the deletion was successful
        if (result === 'success') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Email Template Deleted Successfully',
                    variant: 'success'
                }),
            );
            // Refresh the page after successfull delete
            refreshApex(this.wiredResult);
            // return this.refreshComponent();
        } else {
            // If there was an error
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error deleting Email Template',
                    message: result,
                    variant: 'error'
                }),
            );
        }
    })
    .catch(error => {
        // Handle any unexpected error
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error deleting Email Template',
                message: error.body.message,
                variant: 'error'
            }),
        );
    });
  }

  // Add these two methods at the end of the class
  handleOpenModal() {
      this.isModalOpen = true;
  }

  handleCloseModal() {
    this.isModalOpen = false;
  }

  handleSearchInputChange(event) {
    this.searchTerm = event.target.value.toLowerCase(); // store the search term (in lowercase for case insensitive search)
    this.filterAndSortEmailTemplates(); // apply the filter and sort
  }
}