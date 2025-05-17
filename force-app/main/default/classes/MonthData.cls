public with sharing class MonthData {
    
    @AuraEnabled(cacheable=true)
    public static List<Month__c> getMonth() {
        return [SELECT Name, Id FROM Month__c WITH SECURITY_ENFORCED ORDER BY Name];
    }
}