import { LightningElement, track, wire, api } from 'lwc';
import getNavigationalTopicsAndSubTopics from '@salesforce/apex/ArticleController.getNavigationalTopicsAndSubTopics';
import getHelpCenterUrl from '@salesforce/apex/ArticleController.getHelpCenterUrl';
import getAllArticlesForAllTopics from '@salesforce/apex/ArticleController.getAllArticlesForAllTopics';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class helpCenterTopicCategories extends LightningElement {
    @track rawTopics = [];
    @track selectedTopic = null;
    @track helpCenterUrl; // URL to the help center's main page
    @track articles = [];  // To store articles related to the selected topic
    @track articlesMap = {}; // Stores articles associated with each topic ID
    @api articlesMapLoaded = false;  // Reactive property to check if articles map is loaded
    @track baseUrl; // Store the base URL dynamically fetched
    @track openSections = {}; // Tracks which sections are open
    @track selectedSubtopicId = null;

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    // Fetch the base URL and topics data initially.
    connectedCallback() {
        this.initializeComponent();
    }
    
    async initializeComponent() {
        try {
            await this.fetchBaseUrl(); // Fetch and set the base URL
            await this.fetchTopicsAndArticles(); // Fetch topics and their respective articles
            this.updateSelectedTopicFromUrl(); // Set the topic based on URL or default
        } catch (error) {
            console.error("Error during component initialization:", error);
        }
    }
    

    // Fetch base URL
    async fetchBaseUrl() {
        try {
            const baseUrl = await getHelpCenterUrl();
            this.baseUrl = baseUrl.trim().replace(/\/+$/, ''); // Normalize the base URL
            console.log('Base URL fetched:', this.baseUrl);
        } catch (error) {
            console.error('Error fetching Base URL:', error);
            throw new Error('Failed to fetch Base URL');
        }
    }
    
    async fetchTopicsAndArticles() {
        try {
            const topicsData = await getNavigationalTopicsAndSubTopics();
            this.processTopics(topicsData);
        } catch (error) {
            console.error('Error fetching topics and articles:', error);
            throw new Error('Failed to fetch topics and articles');
        }
    }
    

    // Fetch topics data
    fetchTopics() {
        return getNavigationalTopicsAndSubTopics()
            .then(data => {
                this.processTopics(data);
            });
    }
    
    // Load and process topics, then update the selected topic based on the URL or default to the first topic.
    loadTopics() {
        getNavigationalTopicsAndSubTopics()
            .then(data => {
                this.processTopics(data);
                this.updateSelectedTopicFromUrl(); // Ensure this is called after topics are loaded
            })
            .catch(error => {
                console.error('Error loading topics:', error);
            });
    }


    //get base URL before wire methods run
    async fetchInitialData() {
        try {
            const baseUrl = await getHelpCenterUrl();
            this.baseUrl = baseUrl;
    
            const topicsData = await getNavigationalTopicsAndSubTopics();
            this.processTopics(topicsData);
        } catch (error) {
            console.error('Error in fetching initial data:', error);
        }
    }
    
    fetchTopicsData() {
        return getNavigationalTopicsAndSubTopics().then(data => {
            this.processTopics(data);
        });
    }
    

    // Process fetched topics and prepare them for rendering
    processTopics(data) {
        const topics = JSON.parse(data);
        this.rawTopics = topics.map(parentTopic => ({
            ...parentTopic,
            children: parentTopic.children.map(subTopic => {
                const subTopicArticles = this.articlesMap[subTopic.topic.id] || [];
                return {
                    ...subTopic,
                    articles: subTopicArticles.map(article => ({
                        ...article,
                        Title: this.decodeHtml(article.Title),
                        fullUrl: `${this.baseUrl}/article/${article.UrlName}`
                    })),
                    name: this.decodeHtml(subTopic.topic.name)
                };
            }),
            name: this.decodeHtml(parentTopic.topic.name)
        }));
        console.log('Topics and subtopics loaded:', this.rawTopics);
    }    
    

    // Update the selected topic based on URL or default selection
    updateSelectedTopicFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const topicSlug = params.get('topic');
        if (topicSlug) {
            this.selectTopicBySlug(decodeURIComponent(topicSlug));
        } else if (this.rawTopics.length > 0) {
            this.selectTopicBySlug(this.slugify(this.rawTopics[0].name)); // Default to the first topic
        }
    }
    
    
    

    // Select topic by slug
    selectTopicBySlug(topicSlug) {
        const foundTopic = this.rawTopics.find(topic => this.slugify(topic.name) === topicSlug);
        if (foundTopic) {
            this.selectedTopic = foundTopic;
            this.fetchArticlesForSelectedTopic(foundTopic.topic.id);
            window.history.pushState({}, '', `?topic=${topicSlug}`);
        } else {
            console.log('Topic not found for slug:', topicSlug);
        }
    }
    
    
    

    getTopicFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const topicSlug = params.get('topic');
        return topicSlug ? decodeURIComponent(topicSlug) : null;
    }

    disconnectedCallback() {
        // Remove the listener to avoid memory leaks
        document.removeEventListener('click', this.handleClickOutside);
    }

    @wire(getAllArticlesForAllTopics)
    articlesMapResponse({ error, data }) {
        if (data) {
            this.articlesMap = Object.keys(data).reduce((acc, key) => ({
                ...acc,
                [key]: JSON.parse(data[key])
            }), {});
            console.log('Articles map:', JSON.parse(JSON.stringify(this.articlesMap)));
            this.articlesMapLoaded = true;
        } else if (error) {
            console.error('Error fetching articles for all topics:', error);
            this.articlesMapLoaded = false;
        }
    }

    @wire(getNavigationalTopicsAndSubTopics)
    topicsResponse({ error, data }) {
        if (data) {
            this.topicsData = data; // Store raw data
            if (this.baseUrl) { // Ensure baseUrl is set before processing
                this.processTopics(data);
            }
        } else if (error) {
            console.error('Error fetching topics:', error);
        }
    }
    
    selectTopic(topicId) {
        this.selectedTopic = this.rawTopics.find(topic => topic.topic.id === topicId);
        if (this.selectedTopic) {
            this.fetchArticlesForSelectedTopic(this.selectedTopic.topic.id);
            window.history.pushState({}, '', `?topic=${this.selectedTopic.topic.id}`); // Update URL
        }
    }

    // Fetch articles for the selected topic
    fetchArticlesForSelectedTopic(topicId) {
        if (this.articlesMap[topicId] && this.baseUrl) {
            this.articles = this.articlesMap[topicId].map(article => ({
                ...article,
                Title: this.decodeHtml(article.Title),
                fullUrl: `${this.baseUrl}/article/${article.UrlName}`
            }));
            console.log('Articles loaded for topic:', topicId);
        } else {
            this.articles = [];
            console.error('Waiting for base URL or no articles found for topic', topicId);
        }
    }
    

    //update topic when user clicks one. changes url
    handleTopicSelect(event) {
        const topicId = event.target.closest('a').dataset.id;
        const topic = this.rawTopics.find(topic => topic.topic.id === topicId);
        if (topic) {
            this.selectTopicBySlug(this.slugify(topic.name));
        }
    }

    // Getter to format topics for rendering
    get topics() {
        return this.rawTopics.map(topic => ({
            ...topic,
            cssClass: `grid-item ${this.selectedTopic && this.selectedTopic.id === topic.id ? 'selected' : ''}`
        }));
    }

    // Decodes HTML
    decodeHtml(html) {
        let txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    // Concatenates paths while ensuring there is exactly one slash between segments
    concatenatePaths(base, path) {
        if (base.endsWith('/') && path.startsWith('/')) {
            return base.slice(0, -1) + path; // Remove the trailing slash from base before adding
        } else if (!base.endsWith('/') && !path.startsWith('/')) {
            return base + '/' + path; // Add a slash between base and path
        }
        return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    }

    // Toggles the visibility of sections in an accordion
    toggleSection(event) {
        const sectionId = event.currentTarget.dataset.id;
        const currentlyOpen = this.openSections[sectionId];
        this.openSections[sectionId] = !currentlyOpen;
    
        const content = this.template.querySelector(`.accordion-content[data-id="${sectionId}"]`);
        const arrow = this.template.querySelector(`.accordion-arrow[data-id="${sectionId}"]`);
    
        if (this.openSections[sectionId]) {
            content.classList.remove('slds-hide');
            content.classList.add('slds-show');
            arrow.classList.remove('arrow-right');
            arrow.classList.add('arrow-down');
        } else {
            content.classList.remove('slds-show');
            content.classList.add('slds-hide');
            arrow.classList.remove('arrow-down');
            arrow.classList.add('arrow-right');
        }
    
        if (this.selectedSubtopicId !== sectionId) {
            this.selectedSubtopicId = sectionId;
            this.updateSubtopicHighlight(sectionId);
        }
    
        event.stopPropagation(); // Prevent event bubbling
    }
    

    //styling for last clicked subtopic to be highlighted
    updateSubtopicHighlight(selectedId) {
        this.template.querySelectorAll('.accordion-header').forEach(header => {
            if (header.dataset.id === selectedId) {
                header.classList.add('selected');
            } else {
                header.classList.remove('selected');
            }
        });
    }
    

    //same as above
    removeSubtopicHighlight() {
        this.template.querySelectorAll('.accordion-header').forEach(header => {
            header.classList.remove('selected');
        });
    }

    // Fetch and set the Help Center URL
    @wire(getHelpCenterUrl)
    helpCenterUrlResponse({ error, data }) {
        if (data) {
            this.helpCenterUrl = data;
            console.log('Help Center URL fetched and set:', this.helpCenterUrl);
        } else if (error) {
            console.error('Error fetching Help Center URL:', error);
            this.helpCenterUrl = ''; // Set as empty to avoid undefined
        }
    }
    
    // Method to handle clicking on the Help Center link
    handleHelpCenterClick(event) {
        event.preventDefault(); // Prevent default action
        if (this.helpCenterUrl) {
            window.location.href = this.helpCenterUrl; // Navigate if URL is set
        } else {
            console.error('Help Center URL is not available.');
        }
    }
    
    
    updateArticleUrls() {
        if (this.rawTopics.length > 0 && this.baseUrl) {
            this.rawTopics.forEach(topic => {
                topic.children.forEach(subTopic => {
                    subTopic.articles = subTopic.articles.map(article => ({
                        ...article,
                        Title: this.decodeHtml(article.Title),
                        fullUrl: this.concatenatePaths(this.baseUrl, `article/${article.UrlName}`)
                    }));
                });
            });
            // If maintaining a separate articles array or need a re-render
            if (this.articles) {
                this.articles = this.articles.map(article => ({
                    ...article,
                    fullUrl: this.concatenatePaths(this.baseUrl, `article/${article.UrlName}`)
                }));
            }
        }
    }


    set baseUrl(value) {
        // Ensure the base URL does not end with a slash
        this._baseUrl = value.replace(/\/$/, '');
        this.updateArticleUrls(); // Update URLs whenever the base URL changes
    }
    
    get baseUrl() {
        return this._baseUrl;
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