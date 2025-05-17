public with sharing class emailTemplateListController {

    /*
    Fetches the list of all EmailTemplates.
    Wraps each EmailTemplate in an EmailTemplateWrapper to ensure no null values for better LWC compatibility.
    */
    @AuraEnabled(cacheable=true)
    public static List<EmailTemplateWrapper> getEmailTemplates() {
        List<EmailTemplateWrapper> templatesWrapper = new List<EmailTemplateWrapper>();
    
        Folder excludeFolder = [SELECT Id FROM Folder WHERE DeveloperName = 'EOSIEmailTemplatesPM' LIMIT 1];

        if (excludeFolder != null) {
            for (EmailTemplate template : [SELECT Id, Name, RelatedEntityType, Description, HtmlValue, LastModifiedDate, LastModifiedBy.Name 
                                          FROM EmailTemplate 
                                          WHERE FolderId != :excludeFolder.Id // Exclude templates from that folder
                                          WITH SECURITY_ENFORCED 
                                          ORDER BY Name ASC]) {
                templatesWrapper.add(new EmailTemplateWrapper(template));
            }
        }
    
        return templatesWrapper;
    }

    public class EmailTemplateWrapper {
        @AuraEnabled public Id Id;
        @AuraEnabled public String Name;
        @AuraEnabled public String Description;
        @AuraEnabled public String HtmlValue;
        @AuraEnabled public String RelatedEntityType;
        @AuraEnabled public DateTime LastModifiedDate;
        @AuraEnabled public User LastModifiedBy;
        @AuraEnabled public String FormattedLastModifiedDate; // This is the formatted date string
        @AuraEnabled public String DisplayedEntityType; //format to show label instead of api name for object (session)

        /*
        Constructor for EmailTemplateWrapper.
        Initializes the wrapper with an EmailTemplate.
        Assigns default values if the EmailTemplate properties are null.
        */
        public EmailTemplateWrapper(EmailTemplate template) {
            this.Id = template.Id;
            this.Name = template.Name != null ? template.Name : '';
            this.Description = template.Description != null ? template.Description : '';
            this.HtmlValue = template.HtmlValue != null ? template.HtmlValue : '';
            this.LastModifiedDate = template.LastModifiedDate != null ? template.LastModifiedDate : DateTime.now(); 
            this.RelatedEntityType = template.RelatedEntityType != null ? template.RelatedEntityType : '';
            this.FormattedLastModifiedDate = formatDateTime(this.LastModifiedDate); 
            this.LastModifiedBy = template.LastModifiedBy != null ? template.LastModifiedBy : new User();
            this.DisplayedEntityType = template.RelatedEntityType == 'Opportunity' ? 'Session' : template.RelatedEntityType;
        }

        private String formatDateTime(DateTime dt) {
            return dt.format('M/d/yyyy, h:mm a'); // Format datetime
        }
    }

    /*
    Fetches an EmailTemplate by its ID.
    Assigns default values if certain properties are null, otherise we cant use them in the js.
    */
    @AuraEnabled(cacheable=true)
    public static EmailTemplate getEmailTemplateById(String templateId) {
        EmailTemplate template = [SELECT Id, Name, RelatedEntityType, Description, Subject, HtmlValue, Body FROM EmailTemplate WHERE Id = :templateId LIMIT 1];

        if (template.Name == null) {
            template.Name = '';
        }
        if (template.Description == null) {
            template.Description = '';
        }
        if (template.RelatedEntityType == null) {
            template.RelatedEntityType = '';
        }
        if (template.Subject == null) {
            template.Subject = '';
        }
        if (template.HtmlValue == null) {
            template.HtmlValue = '';
        }
        if (template.Body == null) {
            template.Body = '';
        }
        
        
        return template;
    }

    /*
    Updates the given EmailTemplate.
    emailTemplateData - The EmailTemplate data to update
    */
    @AuraEnabled
    public static EmailTemplate updateEmailTemplate(EmailTemplate emailTemplateData) {
        update emailTemplateData;
        return emailTemplateData;
    }

    /*
    Deletes an EmailTemplate by its ID.
    String - 'success' if deletion succeeds, else returns the error message
    */
    @AuraEnabled
    public static String deleteEmailTemplate(String templateId) {
        try {
            delete [SELECT Id FROM EmailTemplate WHERE Id = :templateId LIMIT 1];
            return 'success';
        } catch (Exception e) {
            String errorMessage = e.getMessage();
    
            // Check if the error is related to DELETE_FAILED for an EmailTemplate that's in use
            if (errorMessage.contains('DELETE_FAILED') && errorMessage.contains('Templates used by other resources')) {
                return 'Error: This template is being used by other resources and cannot be deleted or deactivated. Please ensure its not being used elsewhere or contact an administrator.';
            }
            
            // Check if the error is related to insufficient access or readonly access
            if (errorMessage.contains('INSUFFICIENT_ACCESS_OR_READONLY')) {
                return 'You dont have access to delete this template. Contact an administrator for more information.';
            }
    
            // If it's some other error, just return the raw error message for now
            return errorMessage;
        }
    }
}