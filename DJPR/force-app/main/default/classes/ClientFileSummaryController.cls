public class ClientFileSummaryController {
 @AuraEnabled(cacheable=true)
     public static ContentDocumentWrap getClientIdAndFiles(String searchText)
        {
        	ContentDocumentWrap cdwlist = new ContentDocumentWrap();  
        	cdwList.clientid=getClientId(searchText);
            cdwList.listDocdata=getRelatedFiles(cdwList.clientid);
        	return cdwList;
    	}
  @AuraEnabled(cacheable=true)   
     public static Id getClientId(String searchText) 
        {
            String sFilterName = '%' + searchText + '%'; 
            Account client=[Select Id from Account where name LIKE :sFilterName limit 1];
            return client.Id;
        }
  @AuraEnabled(cacheable=true)   
     public static List<ContentVersion> getRelatedFiles(Id clientId) 
        {
            List<ContentDocumentLink> cdllist=[select ContentDocumentId from ContentDocumentLink where LinkedEntityId =: clientId];
            Set<Id> docids=new Set<Id>();
            for(ContentDocumentLink cdl:cdllist )
            {
                docids.add(cdl.ContentDocumentId);
            }
            List<ContentVersion> listDocdata=[Select Id,Title,Description,ContentDocumentId,CreatedDate,ContentSize,Category__c From ContentVersion Where isLatest=true AND ContentDocumentId IN :docids];
            return listDocdata;
        }
    public class ContentDocumentWrap{
          @AuraEnabled public Id clientid;
        	//wrapper to hold files related to clientid
          @AuraEnabled public List<ContentVersion> listDocdata;
    }

    @AuraEnabled
    public static ContentDocumentWrap updateContentVersionCategory(List<Id> documentIdsUploaded, String category, Id clientId){
            if(!documentIdsUploaded.isEmpty()){
                List<ContentVersion> relatedContentVersion = [Select Id From ContentVersion Where ContentDocumentId IN :documentIdsUploaded];
                if(!relatedContentVersion.isEmpty()){
                    for(ContentVersion conVers : relatedContentVersion){
                        conVers.category__c = category; 
                    }            	
                    Update(relatedContentVersion);
                }
            }    
            ContentDocumentWrap cdwlist = new ContentDocumentWrap();  
            cdwList.listDocdata=getRelatedCategoryFiles(clientid,category);
        	return cdwList;             
    }
    @AuraEnabled(cacheable=true)   
     public static List<ContentVersion> getRelatedCategoryFiles(Id clientId, String category) 
        {
            List<ContentDocumentLink> cdllist=[select ContentDocumentId from ContentDocumentLink where LinkedEntityId =: clientId];
            Set<Id> docids=new Set<Id>();
            for(ContentDocumentLink cdl:cdllist )
            {
                docids.add(cdl.ContentDocumentId);
            }
            List<ContentVersion> listDocdata=[Select Id,Title,Description,ContentDocumentId,CreatedDate,ContentSize,Category__c From ContentVersion Where isLatest=true AND Category__c=: category AND ContentDocumentId IN :docids];
            return listDocdata;
        }

     
    @AuraEnabled  
    public static ContentDocumentWrap performUpdate(Id clientId, List<ContentVersion> updateData, String category) 
       {
        Set<Id> contentdocIds = new Set<Id>();
        for(ContentVersion version : updateData){
            contentdocIds.add(version.ContentDocumentId);
        }
        Map<Id,Id> versionDataMap = new Map<Id,Id>();
            for(ContentVersion versionData : [Select Id,ContentDocumentId From ContentVersion Where isLatest=true AND Category__c=: category AND ContentDocumentId IN :contentdocIds]){
                versionDataMap.put(versionData.ContentDocumentId,versionData.Id);
            }

            for(ContentVersion version : (List<ContentVersion>) updateData){
                version.Id = versionDataMap.get(version.ContentDocumentId);
            }

        if(!updateData.isEmpty()){
            Update(updateData);         
        }
        ContentDocumentWrap cdwlist = new ContentDocumentWrap();  
            cdwList.listDocdata=getRelatedCategoryFiles(clientid,category);
        	return cdwList;  
       }  
       
        
    @AuraEnabled  
    public static ContentDocumentWrap performDelete(Id clientId, Id deleteRecId, String category) 
       {
           ContentDocument cd=[Select Id From ContentDocument Where Id=:deleteRecId ];
           Delete(cd);
           ContentDocumentWrap cdwlist = new ContentDocumentWrap();  
           cdwList.listDocdata=getRelatedCategoryFiles(clientid,category);
           return cdwList;  
       }  
}