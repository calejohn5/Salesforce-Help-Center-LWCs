public with sharing class ArticleController {
    static final String COMMUNITY_ID = '0DB4W000000wkpLWAQ';

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getCurrentTopicAndSubtopic(String articleUrlName) {
        Map<String, Object> breadcrumb = new Map<String, Object>();
        
        // Fetch article with its topic assignments
        KnowledgeArticleVersion article = [
            SELECT Id, UrlName, (SELECT TopicId FROM TopicAssignments)
            FROM KnowledgeArticleVersion
            WHERE UrlName = :articleUrlName AND Language = 'en_US' AND PublishStatus = 'Online'
            LIMIT 1
        ];
    
        if (article == null || article.TopicAssignments.isEmpty()) {
            return breadcrumb;
        }
    
        // Get topic IDs from article
        List<String> topicIds = new List<String>();
        for (TopicAssignment ta : article.TopicAssignments) {
            topicIds.add(ta.TopicId);
        }
        System.debug('Topic IDs from article: ' + topicIds);
        
        // Its not possible to distinguish between child/parent topic through queries using topicIDs we have
        // Retrieve all topics and build a map of child vs parents
        ConnectApi.ManagedTopicCollection topics = ConnectApi.ManagedTopics.getManagedTopics(COMMUNITY_ID, ConnectApi.ManagedTopicType.Navigational, 2);
        Map<String, ConnectApi.ManagedTopic> topicMap = new Map<String, ConnectApi.ManagedTopic>();
        for (ConnectApi.ManagedTopic topic : topics.managedTopics) {
            topicMap.put(topic.topic.id, topic); // Store by topic ID, not managed topic ID
            if (topic.children != null) {
                for (ConnectApi.ManagedTopic child : topic.children) {
                    topicMap.put(child.topic.id, child); // Also add children by their topic IDs
                }
            }
        }
        // Determine parent and subtopic based on the topic IDs from the article
        String subtopicId = null;
        for (String id : topicIds) {
            if (topicMap.containsKey(id) && topicMap.get(id).parent != null) {
                breadcrumb.put('subtopic', topicMap.get(id).topic.name);
                breadcrumb.put('subtopicId', id);
                subtopicId = id;
                break;
            }
        }
    
        // The other topic ID is the parent
        for (String id : topicIds) {
            if (!id.equals(subtopicId)) {
                breadcrumb.put('topic', topicMap.get(id).topic.name);
                breadcrumb.put('topicId', id);
                break;
            }
        }
    
        return breadcrumb;
    }

    @AuraEnabled(cacheable=true)
    public static String getNavigationalTopicsAndSubTopics(){
        ConnectApi.ManagedTopicCollection topics = ConnectApi.ManagedTopics.getManagedTopics(COMMUNITY_ID,ConnectApi.ManagedTopicType.Navigational,2);
        List<ConnectApi.ManagedTopic> navigationalTopics = new List<ConnectApi.ManagedTopic>();
        for(ConnectApi.ManagedTopic topic : topics.managedTopics){
            if(String.valueOf(topic.managedTopicType) == 'Navigational'){ navigationalTopics.add(topic); }
        }
        return JSON.serialize(navigationalTopics);
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getAllArticlesForAllTopics() {
        List<KnowledgeArticleVersion> articles = [
            SELECT Title, ArticleNumber, UrlName, Id, KnowledgeArticleId,
            (SELECT TopicId FROM TopicAssignments)
            FROM KnowledgeArticleVersion
            WHERE Language = 'en_US' AND PublishStatus = 'Online'
        ];
    
        Map<String, List<KnowledgeArticleVersion>> topicArticlesMap = new Map<String, List<KnowledgeArticleVersion>>();
        for (KnowledgeArticleVersion article : articles) {
            for (TopicAssignment ta : article.TopicAssignments) {
                if (!topicArticlesMap.containsKey(ta.TopicId)) {
                    topicArticlesMap.put(ta.TopicId, new List<KnowledgeArticleVersion>());
                }
                topicArticlesMap.get(ta.TopicId).add(article);
            }
        }
    
        Map<String, String> serializedTopicArticlesMap = new Map<String, String>();
        for (String topicId : topicArticlesMap.keySet()) {
            serializedTopicArticlesMap.put(topicId, JSON.serialize(topicArticlesMap.get(topicId)));
        }
    
        return serializedTopicArticlesMap;
    }
    
    //mdt for clickable link on help page and in breadcrumb for articles
    @AuraEnabled(cacheable=true)
    public static String getHelpCenterUrl() {
        EOS_Help_Center_Setting__mdt settings = [
            SELECT Help_Center_URL__c FROM EOS_Help_Center_Setting__mdt WHERE Label = 'Help Center Topic Categories'
            LIMIT 1
        ];
        return (settings != null) ? settings.Help_Center_URL__c : null;
    }

    @AuraEnabled(cacheable=true)
    public static List<Support_Article__c> getPopularArticles() {
        String popularRecordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName='Popular_Article' AND SObjectType='Support_Article__c'].Id;
        return [SELECT Id, Name, URL__c, Title__c, Font_Color__c, Font_Size__c, Font_Name__c
        FROM Support_Article__c 
        WHERE RecordTypeId = :popularRecordTypeId 
        ORDER BY Name ASC];
    }

    @AuraEnabled(cacheable=true)
    public static List<Support_Article__c> getArticlesByTopics() {
        String topicRecordTypeId = [SELECT Id FROM RecordType WHERE Name='Topic' AND SObjectType='Support_Article__c'].Id;
        return [SELECT Id, Name, URL__c, Title__c, Font_Color__c, Font_Size__c, Font_Name__c, Image__c
                FROM Support_Article__c 
                WHERE RecordTypeId = :topicRecordTypeId 
                ORDER BY Name ASC];
    }
}