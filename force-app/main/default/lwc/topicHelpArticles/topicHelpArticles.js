import { LightningElement, wire, track } from 'lwc';
import getArticlesByTopics from '@salesforce/apex/ArticleController.getArticlesByTopics';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class TopicHelpArticles extends LightningElement {
    @track articles;
    @track errorMessage; // To store the error message
    @track errorDetails; // To store additional error details like stack trace
    @track isLoading = true; // Track the loading state

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    @wire(getArticlesByTopics)
    articleHandler({ error, data }) {
        if (data) {
            this.articles = data.map(article => ({
                ...article,
                style: `color: ${article.Font_Color__c}; font-size: ${article.Font_Size__c}px; font-family: '${article.Font_Name__c}';`
            }));
            this.errorMessage = undefined;
            this.errorDetails = undefined;
            this.isLoading = false; // Data loaded, set loading to false
        } else if (error) {
            this.isLoading = false; // Ensure loading state is updated even in error
            this.formatError(error);
        }
    }

    // Function to format error message and extract details for end-users
    formatError(error) {
        if (error && error.body) {
            this.errorMessage = error.body.message || 'An unexpected error occurred. Please try again later.';
            if (error.body.stackTrace) {
                this.errorDetails = `Details: ${error.body.stackTrace}`;
            } else {
                this.errorDetails = 'No additional details are available.';
            }
        } else {
            this.errorMessage = 'An unexpected error occurred with no additional details.';
            this.errorDetails = '';
        }
    }
}