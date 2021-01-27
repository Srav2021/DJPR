@isTest
public class ClientFileSummaryControllerTest {
    @testSetup
	private static void createTestData() {
        Account testacc = new Account(LastName='ACC',FirstName='TEST' );
        insert testacc;
        
        ContentVersion contVersion = new ContentVersion();   
        contVersion.Title = 'Title';
        contVersion.IsMajorVersion = true;
        contVersion.PathOnClient ='Test';
        contVersion.Category__c = 'Category1';
        contVersion.VersionData = Blob.valueOf('Unit Test Attachment Body'); 
        insert contVersion;
        
        contVersion =[Select Id,ContentDocumentId from ContentVersion where id=:contVersion.Id];
        ContentDocumentLink cdl= new ContentDocumentLink(ContentDocumentId=contVersion.ContentDocumentId,LinkedEntityId=testacc.Id,ShareType='I',Visibility='AllUsers');
        insert cdl;
        
        ContentVersion contVersion2 = new ContentVersion();   
        contVersion2.Title = 'Title2';
        contVersion2.IsMajorVersion = true;
        contVersion2.PathOnClient ='Test2';
        contVersion2.Category__c = 'Category2';
        contVersion2.VersionData = Blob.valueOf('Unit Test Attachment Body2'); 
        insert contVersion2;
        
        contVersion2 =[Select Id,ContentDocumentId from ContentVersion where id=:contVersion2.Id];
        ContentDocumentLink cdl2= new ContentDocumentLink(ContentDocumentId=contVersion2.ContentDocumentId,LinkedEntityId=testacc.Id,ShareType='I',Visibility='AllUsers');
        insert cdl2;
	}
     @isTest 
     public static void testgetClientIdAndFiles() {	
         
         test.startTest();          
         ClientFileSummaryController.ContentDocumentWrap lstResult = ClientFileSummaryController.getClientIdAndFiles('ACC');
         System.assertEquals(2, lstResult.listDocdata.size());	
         test.stopTest();
     }
    
     @isTest 
     public static void testupdateContentVersionCategory() {
         Account testacc = [Select Id From Account Where LastName='ACC'AND FirstName='TEST'];
         ContentVersion contVersion3 = new ContentVersion();   
        contVersion3.Title = 'Title3';
        contVersion3.IsMajorVersion = true;
        contVersion3.PathOnClient ='Test3';
        contVersion3.VersionData = Blob.valueOf('Unit Test Attachment Body3'); 
        insert contVersion3;
        
        contVersion3 =[Select Id,ContentDocumentId from ContentVersion where id=:contVersion3.Id];
        ContentDocumentLink cdl3= new ContentDocumentLink(ContentDocumentId=contVersion3.ContentDocumentId,LinkedEntityId=testacc.Id,ShareType='I',Visibility='AllUsers');
        insert cdl3;
         test.startTest();          
         ClientFileSummaryController.ContentDocumentWrap lstResult = ClientFileSummaryController.updateContentVersionCategory(new List<Id> {contVersion3.ContentDocumentId}, 'Category3', testacc.Id);
         ContentVersion cvtemp=[Select Category__c From ContentVersion Where id=:contVersion3.Id];
         System.assertEquals('Category3', cvtemp.Category__c);	
         test.stopTest();
     }
    @isTest 
     public static void testperformUpdate() {	
         Account testacc = [Select Id From Account Where LastName='ACC'AND FirstName='TEST'];
         ContentVersion contVersion =[Select Id,Title,Description,ContentDocumentId,CreatedDate,ContentSize,Category__c From ContentVersion Where isLatest=true AND Category__c= 'Category1'];
         test.startTest();   
         contVersion.Title='Title Updated';
         contVersion.Description='Description Updated';
         ClientFileSummaryController.ContentDocumentWrap lstResult = ClientFileSummaryController.performUpdate(testacc.Id,new List<ContentVersion> {contVersion}, 'Category1');
         System.assertEquals('Title Updated', lstResult.listDocdata[0].Title);	
         test.stopTest();
     }
    @isTest 
     public static void testperformDelete() {	
         Account testacc = [Select Id From Account Where LastName='ACC'AND FirstName='TEST'];
         ContentVersion contVersion =[Select Id,Title,Description,ContentDocumentId,CreatedDate,ContentSize,Category__c From ContentVersion Where isLatest=true AND Category__c= 'Category1'];
         test.startTest(); 
         ClientFileSummaryController.ContentDocumentWrap lstResult = ClientFileSummaryController.performDelete(testacc.Id,contVersion.ContentDocumentId, 'Category1');
         System.assertEquals(0, lstResult.listDocdata.size());	
         test.stopTest();
     }
}