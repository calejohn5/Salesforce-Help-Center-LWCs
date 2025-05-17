import { LightningElement, track } from 'lwc';
import getCurrentTopicAndSubtopic from '@salesforce/apex/ArticleController.getCurrentTopicAndSubtopic';
import getHelpCenterUrl from '@salesforce/apex/ArticleController.getHelpCenterUrl';

export default class HelpCenterBreadcrumbTrail extends LightningElement {
    @track breadcrumbs = [];
    @track helpCenterUrl = '';

    connectedCallback() {
        this.fetchHelpCenterUrl();
        this.fetchBreadcrumbData();
    }

    fetchHelpCenterUrl() {
        getHelpCenterUrl()
            .then(url => {
                this.helpCenterUrl = url;
            })
            .catch(error => {
                console.error('Error fetching Help Center URL:', error);
            });
    }

    fetchBreadcrumbData() {
        const path = window.location.pathname;
        const pathParts = path.split('/');
        const articleUrlNameIndex = pathParts.indexOf('article') + 1;
        const articleUrlName = pathParts[articleUrlNameIndex];
        if (articleUrlName) {
            getCurrentTopicAndSubtopic({ articleUrlName })
                .then(data => {
                    this.processBreadcrumbs(data);
                })
                .catch(error => {
                    console.error('Error fetching breadcrumb data:', error);
                });
        }
    }

    processBreadcrumbs(data) {
        const breadcrumbs = [];
        if (data.topic) {
            breadcrumbs.push({
                label: data.topic.toUpperCase(),
                url: this.helpCenterUrl + `topics?topic=${this.slugify(data.topic)}`,
                key: `topic-${data.topicId}`,
                isNotLast: !!data.subtopic
            });
        }
        if (data.subtopic) {
            breadcrumbs.push({
                label: data.subtopic.toUpperCase(),
                url: this.helpCenterUrl + `topics?topic=${this.slugify(data.topic)}`,  // Using parent topic URL for both
                key: `subtopic-${data.subtopicId}`,
                isNotLast: false
            });
        }
        // Insert separators with unique keys
        this.breadcrumbs = breadcrumbs.reduce((acc, crumb, index) => {
            acc.push(crumb);
            if (crumb.isNotLast) {
                acc.push({ label: ' > ', key: `sep-${index}`, class: 'separator' });  // No URL for separator
            }
            return acc;
        }, []);
    }
    
    slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }
}