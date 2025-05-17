@isTest
public class ArticleControllerTest {

    // Using SeeAllData=true since ConnectApi methods are not supported in data siloed tests
    @isTest(SeeAllData=true)
    public static void testGetCurrentTopicAndSubtopic() {
        // Query for an article with existing topic assignments
        KnowledgeArticleVersion article = [
            SELECT Id, UrlName, (SELECT TopicId FROM TopicAssignments WHERE TopicId != null LIMIT 1)
            FROM KnowledgeArticleVersion
            WHERE Language = 'en_US' AND PublishStatus = 'Online'
            AND Id IN (SELECT EntityId FROM TopicAssignment WHERE TopicId != null)
            LIMIT 1
        ];

        // Check that an article was found and it has at least one topic assignment
        System.assert(article != null, 'No article found for testing');
        System.assert(!article.TopicAssignments.isEmpty(), 'Article has no topic assignments');

        // Use the UrlName of the fetched article for testing
        String testArticleUrlName = article.UrlName;

        // Call the method under test
        Map<String, Object> result = ArticleController.getCurrentTopicAndSubtopic(testArticleUrlName);

        // Verify the result
        System.assertNotEquals(null, result, 'The breadcrumb data should not be null');
        System.assert(result.containsKey('topic'), 'There should be a topic in the breadcrumb');
        System.assert(result.containsKey('topicId'), 'There should be a topic ID in the breadcrumb');
        System.assert(result.containsKey('subtopic'), 'There should be a subtopic in the breadcrumb');
        System.assert(result.containsKey('subtopicId'), 'There should be a subtopic ID in the breadcrumb');
    }
    
    // Utility method to retrieve RecordType IDs based on DeveloperName
    private static Id getRecordTypeId(String developerName) {
        RecordType rt = [SELECT Id FROM RecordType WHERE DeveloperName = :developerName LIMIT 1];
        return rt.Id;
    }

    // Utility method to create test data for Support_Article__c
    private static List<Support_Article__c> createTestSupportArticles(String recordTypeId) {
        List<Support_Article__c> articles = new List<Support_Article__c>();
        // Add test Support Articles
        articles.add(new Support_Article__c(
            Name='Popular Article', URL__c='http://example.com', Title__c='Test Pop Article',
            Font_Color__c='Black', Font_Size__c='12px', Font_Name__c='Arial',
            RecordTypeId=recordTypeId
        ));
        return articles;
    }

    static testMethod void testGetPopularArticles() {
        // Retrieve the RecordType ID for Popular_Article
        Id popularArticleTypeId = getRecordTypeId('Popular_Article');
        List<Support_Article__c> supportArticles = createTestSupportArticles(popularArticleTypeId);
        insert supportArticles;

        Test.startTest();
        List<Support_Article__c> result = ArticleController.getPopularArticles();
        Test.stopTest();

        // Assertions to check if popular articles are fetched correctly
        System.assertEquals(1, result.size(), 'Should fetch one popular article.');
    }

    static testMethod void testGetArticlesByTopics() {
        // Retrieve the RecordType ID for Topic
        Id topicRecordTypeId = getRecordTypeId('Topic');
        List<Support_Article__c> supportArticles = createTestSupportArticles(topicRecordTypeId);
        insert supportArticles;

        Test.startTest();
        List<Support_Article__c> result = ArticleController.getArticlesByTopics();
        Test.stopTest();

        // Assertions to check if topic-based articles are fetched correctly
        System.assertEquals(1, result.size(), 'Should fetch articles by topics.');
    }

    @IsTest(SeeAllData=true) static void testGetManagedTopics() {
        User usr = [select id,Name from User where id =: UserInfo.getUserId()];
        
        System.runAs(usr) {
            String topicName = 'Test topic';
            
            Topic topic = new Topic(Name = topicName);
            
            insert topic;
        }
        
        String result = ArticleController.getNavigationalTopicsAndSubTopics();
    }

    // Test method for getAllArticlesForAllTopics
    static testMethod void testGetAllArticlesForAllTopics() {

        Id topicRecordTypeId = getRecordTypeId('Topic');
        List<Support_Article__c> supportArticles = createTestSupportArticles(topicRecordTypeId);
        insert supportArticles;

        User usr = [select id,Name from User where id =: UserInfo.getUserId()];
        System.runAs(usr) {
            String topicName = 'Test topic';
            Topic topic = new Topic(Name = topicName);
            insert topic;
        }
        
        Test.startTest();
        Map<String, String> result = ArticleController.getAllArticlesForAllTopics();
        Test.stopTest();

        // Assertions to verify correct mapping and serialization
        System.assertNotEquals(null, result, 'Result should not be null.');
    }

    // This method tests the retrieval of the Help Center URL from custom metadata
    @isTest
    static void testGetHelpCenterUrl() {

        Test.startTest();
        String result = ArticleController.getHelpCenterUrl();
        Test.stopTest();

        // Verify that the result is not null or empty
        System.assertNotEquals(null, result, 'The Help Center URL should not be null.');
        System.assert(result.startsWith('http'), 'The Help Center URL should start with http.');
    }
}