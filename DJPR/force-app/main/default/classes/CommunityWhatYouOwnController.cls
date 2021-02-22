/*********************************************************************************************************
* Class Name: CommunitySubCmpController 
* Description: Community Controller Apex class for Sub-Component page
*********************************************************************************************************/

public without sharing class CommunityWhatYouOwnController {

    @AuraEnabled
     public static Client_Asset__c createNewCommunityAsset(Id userId, String clientId,string containerFor){
       
         DALAccount dala = new DALAccount();        
         Account clientReltedAccount = dala.selectRelatedAccountById(clientId);
 
         Id ownerId=clientReltedAccount.ownerId;       
 
         Id recordTypeId;      
         if (containerFor == 'property')
         {
             recordTypeId=CRMRecordTypeHelper.getIdByDeveloperName(CRMRecordTypeHelper.ASSET_OBJECT, 'Real_Estate');
         }
         else if (containerFor == 'vehicles')
         {
             recordTypeId=CRMRecordTypeHelper.getIdByDeveloperName(CRMRecordTypeHelper.ASSET_OBJECT, 'Motor_Vehicle');
         }
         else
         {
              recordTypeId=CRMRecordTypeHelper.getIdByDeveloperName(CRMRecordTypeHelper.ASSET_OBJECT, 'Other_Asset');
         }
 
         try{
             Asset__c asset=new Asset__c();
             CRMUtilityCommon.setGUIDForSObject(asset);
             asset.RecordTypeId=recordTypeId;
             asset.OwnerId=ownerId;
             asset.Gross_Amount__c = 0;
             asset.Value__c =0;// (containerFor == 'property' ? 10000 : (containerFor == 'vehicles' ? 1000 : 100));           
 
             if(containerFor == 'property'){
                 Address__C address=new Address__C();
                 CRMUtilityCommon.setGUIDForSObject(address);
                 address.RecordTypeId=CRMRecordTypeHelper.getIdByDeveloperName(CRMRecordTypeHelper.ADDRESS_OBJECT, 'Standard_Address');       
                 address.OwnerId=ownerId;     
                 asset.Address__c = address.Id;
                 asset.Address__r = address;
             }
 
             Client_Asset__c clientAsset=new Client_Asset__c();
             CRMUtilityCommon.setGUIDForSObject(clientAsset);
             clientAsset.Ownership_Percentage__c=100;
             clientAsset.Client__r = clientReltedAccount;       
             clientAsset.Asset__r=asset;
             return clientAsset;
         }
         catch(Exception ex)
         {
             Client_Asset__c clientAssetEx=new Client_Asset__c();
             System.debug('Exception while creating Assest - ' + ex.getMessage());
             return clientAssetEx;
         }
     }
 
     @AuraEnabled
     public static Address__C createNewCommunityAssetAddress(Id userId, String clientId,string containerFor){
        DALAccount dala = new DALAccount();        
        Account clientReltedAccount = dala.selectRelatedAccountById(clientId);
        Id ownerId=clientReltedAccount.ownerId;  
         try{
             Address__C address=new Address__C();
             CRMUtilityCommon.setGUIDForSObject(address);
             address.OwnerId=ownerId;  
             address.RecordTypeId=CRMRecordTypeHelper.getIdByDeveloperName(CRMRecordTypeHelper.ADDRESS_OBJECT, 'Standard_Address');       
             return address;
         }
         catch(Exception ex)
         {
             Address__C clientAssetAddressEx=new Address__C();
             System.debug('Exception while creating Assest - ' + ex.getMessage());
             return clientAssetAddressEx;
         }
     }
 
     @AuraEnabled 
     public static CommunityWhatYouOwnData getClientAssestList(List<String> accountClientIdList)
     {
         CommunityWhatYouOwnData data = new CommunityWhatYouOwnData();
         try{    
             Set<Id> idList = new Set<Id>( (List<Id>) accountClientIdList);
             data.clientAssetList = new DALClientAsset().selectByAccountIdWithAssets(idList); 
         }
         catch (Exception ex){
             System.debug('Exception while getting Assest - ' + ex.getMessage());
         }
         return data;
     }
     
     public class CommunityWhatYouOwnData {
         
         @AuraEnabled
         public List<Client_Asset__c> clientAssetList;
         public CommunityWhatYouOwnData() {                        
                              
         }
     }
     
     public static List<SObject> convertJSONToListOfSObject(String json, Boolean flag) {
         object[] values = (object[])System.JSON.deserializeUntyped(json);
         List<SObject> newSObjectsList = new List<SObject>();
         for (Object v : values) {
             if(v!=NULL)
             {
             Map<String, Object> m = (Map<String, Object>)v;
             Schema.SObjectType targetType = Schema.getGlobalDescribe().get((String)m.get('sobjectType'));
             SObject o = targetType.newSObject();
 
             Map<String, Schema.SObjectField> fields = targetType.getDescribe().fields.getMap();
             for (String fieldName : m.keySet()) {
                 // Filter out any psuedo fields such as LastNameLocal
                 Schema.SObjectField fi = fields.get(fieldName);
                 if (fi != null) 
                 {
                     if(!fi.getDescribe().isCalculated())
                         {
                             Schema.DisplayType fielddataType = fi.getDescribe().getType();
                             if(fielddataType == Schema.DisplayType.Currency || fielddataType == Schema.DisplayType.Percent)
                                 o.put(fieldName,Decimal.valueOf(String.valueOf(m.get(fieldName)))); 
                             else if(fielddataType == Schema.DisplayType.Date)
                                 o.put(fieldName,Date.valueOf(String.valueOf(m.get(fieldName)))); 
                             else if(fielddataType == Schema.DisplayType.REFERENCE && !flag)
                             {
                                if(String.valueOf(fi) == 'RecordTypeId' || String.valueOf(fi) == 'Address__c' || String.valueOf(fi) != 'Client__c' ) o.put(fieldName, m.get(fieldName)); 
                             }
                             else
                                 o.put(fieldName, m.get(fieldName));   
                     }
                 }
             }
 
             newSObjectsList.add(o);
         }
         }
 
         return newSObjectsList;
     }
     
      @AuraEnabled
     public static  List<SurrogateIdSalesforceIdPair> performSave(String insertDataStr, String updateDataStr, String deleteDataStr) {
         System.debug('insertDataStr: ' + insertDataStr);
         System.debug('updateDataStr: ' + updateDataStr);
         System.debug('deleteDataStr: ' + deleteDataStr);
         
         List<sObject> insertData = convertJSONToListOfSObject(insertDataStr,true);
         System.debug('insertData after conversion: ' + insertData);
         List<sObject> updateData = convertJSONToListOfSObject(updateDataStr,false);
         System.debug('updateData after conversion: ' + updateData);
         List<sObject> deleteData = convertJSONToListOfSObject(deleteDataStr,false);
         
         Integer tranDateTime = DateTime.now().millisecond();                                            
         String tranGUID = CRMUtilityCommon.getGUID();                                        
         User communityUser = new DALCommunityUserHelper().selectByIdFull(new Set<Id>{UserInfo.getUserId()}).get(0);
         DALApplicationLog dapplog = new DALApplicationLog(communityUser);
         if(Test.isRunningTest()){
             dapplog.appLogUserSetting = true;
         }
         try{
             if (dapplog.appLogUserSetting == true)
             {
                 dapplog.appLogs.add(dapplog.createApplicationLogDebug(tranGUID,
                     'What you OWN Perform Save', 
                     'What you OWN Perform Save Triggered.',
                     DALApplicationLog.APPLICATION_LOG_LEVEL_DEBUG,
                     'What you OWN Perform Save Triggered.',
                     DateTime.now().millisecond() - tranDateTime,
                     communityUser.Id,
                     communityUser.AccountId,
                     ' -- Insert Data --> ' + insertData +  ' -- Update Data --> ' + updateData + ' -- Delete Data --> ' + deleteData,
                     'CommunityWhatYouOwnController',
                     'performSave' ));
             }
 
             Map<Schema.SObjectType, List<sObject>> insertDataMap = new Map<Schema.SObjectType, List<sObject>>(DALSaveHelper.convertDataListToMap(insertData));
             Map<Schema.SObjectType, List<sObject>> updateDataMap = new Map<Schema.SObjectType, List<sObject>>(DALSaveHelper.convertDataListToMap(updateData));      
             Map<Schema.SObjectType, List<sObject>> deleteDataMap = new Map<Schema.SObjectType, List<sObject>>(DALSaveHelper.convertDataListToMap(deleteData));       
             
             List<SurrogateIdSalesforceIdPair> surrogateIds = new List<SurrogateIdSalesforceIdPair>();
             
             List<GenericAction> afterSaveAction = new List<GenericAction> { new GenericActionUpdateFlag( new List<Schema.sObjectType> { Client_Asset__c.SObjectType }) };
             
             List<Schema.sObjectType> objTypeList = new List<Schema.sObjectType>();
             objTypeList.add(Address__c.sObjectType);
             objTypeList.add(Asset__c.sObjectType);
             objTypeList.add(Client_Asset__c.sObjectType);
             
             if (dapplog.appLogUserSetting == true)
             {
                 dapplog.appLogs.add(dapplog.createApplicationLogDebug(tranGUID,
                     'What you OWN Perform Save', 
                     'What you OWN Perform Save Data Manipulated.',
                     DALApplicationLog.APPLICATION_LOG_LEVEL_DEBUG,
                     'What you OWN Perform Save Data Manipulated.',
                     DateTime.now().millisecond() - tranDateTime,
                     communityUser.Id,
                     communityUser.AccountId,
                     ' -- Final DML Data Insert Data Map --> ' + insertDataMap + ' -- Update Data Map --> ' + updateDataMap + ' -- Delete Data Map --> '+ deleteDataMap + ' -- Object Type List --> '+ objTypeList + ' -- After Save Actions --> '+ afterSaveAction ,
                     'CommunityWhatYouOwnController',
                     'performSave' ));
             }
 
             surrogateIds = DALSaveHelper.saveData(insertDataMap, updateDataMap, deleteDataMap, objTypeList, null, afterSaveAction);
             System.debug('SurrogateIds: ' + surrogateIds);
             CommunityNotificationUtil.saveComment(CommunityNotificationUtil.SECTION_WHAT_YOU_OWN, communityUser);
             if (dapplog.appLogUserSetting == true)
             {
                 dapplog.appLogs.add(dapplog.createApplicationLogDebug(tranGUID,
                     'What you OWN Perform Save', 
                     'What you OWN Perform Save Data Completed.',
                     DALApplicationLog.APPLICATION_LOG_LEVEL_DEBUG,
                     'What you OWN Perform Save Data Completed.',
                     DateTime.now().millisecond() - tranDateTime,
                     communityUser.Id,
                     communityUser.AccountId,
                     string.join(surrogateIds,','),
                     'CommunityWhatYouOwnController',
                     'performSave' ));
             }  
             return surrogateIds; 
         }
         catch (Exception ex) {
             dapplog.appLogs.add(dapplog.createApplicationLogException(tranGUID,
                     'What you OWN Perform Save', 
                     'Perform Save Error.',
                     DALApplicationLog.APPLICATION_LOG_LEVEL_ERROR,
                     DateTime.now().millisecond() - tranDateTime,
                     communityUser.Id,
                     communityUser.AccountId,
                     ' -- Insert Data --> ' + insertData +  ' -- Update Data --> ' + updateData + ' -- Delete Data --> ' + deleteData,
                     'CommunityWhatYouOwnController',
                     'performSave',
                     ex ));
                 System.debug('Error: ' + ex.getStackTraceString());
                 throw new DALException(true, 'performSave(). Params:' + ' -- Insert Data --> ' + insertData +  ' -- Update Data --> ' + updateData + ' -- Delete Data --> ' + deleteData , ex);
         }
         finally{
             if ((dapplog.appLogs != null) && (!dapplog.appLogs.isEmpty()))
                 dapplog.saveApplicationLogs(dapplog.appLogs);
             
         }
 
     }
 }