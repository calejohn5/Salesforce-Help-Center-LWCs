public with sharing class RoommateController {

    @AuraEnabled(cacheable=true)
    
    public static List<Roommate__c> getRoommates() {
        return [SELECT Id, Name, (SELECT Id, Name, Payment__c FROM Months__r ORDER BY Name) FROM Roommate__c];
    }
}