@isTest
public class PickListControllerTest {

    static testMethod void testGetPickListValuesIntoList_withoutNone() {
        List<PickListController.PickListOption> picklistValues = new List<PickListController.PickListOption>(PickListController.getPickListValuesIntoList('OpportunityLineItem', 'Frequency__c', null, false, false));
        System.assert(picklistValues.size() > 0);
    }
    
    static testMethod void testGetPickListValuesIntoList_withNone() {
        List<PickListController.PickListOption> picklistValues = new List<PickListController.PickListOption>(PickListController.getPickListValuesIntoList('OpportunityLineItem', 'Frequency__c', null, true, false));
        List<String> pickListValueList = new List<String>();
        for(PickListController.PickListOption plo : picklistValues) {
            pickListValueList.add(plo.label);
        }
        System.assert(pickListValueList.contains('--None--'));
    }

    static testMethod void testGetPickListValuesIntoList_FromCustomMetadata() {
        List<PickListController.PickListOption> picklistValues = new List<PickListController.PickListOption>(PickListController.getPickListValuesIntoList('Client_Income__c', 'Employment_Type__c', 'PAYG', true, false));
        List<PickListController.PickListOption> picklistValuesFromMetadata = new List<PickListController.PickListOption>(PickListController.getPickListValuesIntoList('Client_Income__c', 'Employment_Type__c', 'PAYG', true, true));

        System.assert(picklistValues.size() > picklistValuesFromMetadata.size());
    }
    
    static testMethod void testGetPickListValuesIntoList_Exception() {
        try { 
            List<PickListController.PickListOption> picklistValues = new List<PickListController.PickListOption>(PickListController.getPickListValuesIntoList('Opportunity', 'Frequency__c', null, true, false));
            List<String> pickListValueList = new List<String>();
            for(PickListController.PickListOption plo : picklistValues) {
                pickListValueList.add(plo.label);
            }
            System.assert(pickListValueList.contains('--None--'));
        }
        catch(Exception e) {
            
        }
    }

}