public class PickListController {

    public class PickListOption {
        @AuraEnabled
        public String value {get;set;}
        @AuraEnabled
        public String label {get;set;}
        
        public PickListOption(String val, String lbl) { 
            this.value = val;
            this.label = lbl;
        }
    }
 
    @AuraEnabled       
    public static List<PickListOption> getPickListValuesIntoList(String objectType, String selectedField, String recType, 
        Boolean includeNone, Boolean readFromMetaData) {
    	System.debug('ObjectType: ' + objectType + ', SelectedField: ' + selectedField);
        List<PickListOption> pickListValuesList = new List<PickListOption>();
        try {
            if(includeNone) {
                pickListValuesList.add(new PickListOption('', '--None--'));
            }

            if(readFromMetaData) {
            	PickList_Values__mdt pickListValues = DALCustomMetadata.selectFieldPickListValues(objectType, selectedField, recType);
                if(pickListValues != null && pickListValues.PickList_Options__c != null) {
                    List<PickListOption> options = new List<PickListOption>();
                    for(String token : pickListValues.PickList_Options__c.split(',')) {
                        options.add(new PickListOption(token, token));                      
                    }
                    pickListValuesList.addAll(options);
                } 
            }             
            else { 
                Schema.SObjectType convertToObj = Schema.getGlobalDescribe().get(objectType);
                Schema.DescribeSObjectResult res = convertToObj.getDescribe();
                Schema.DescribeFieldResult fieldResult = res.fields.getMap().get(selectedField).getDescribe();
                List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
                for(Schema.PicklistEntry pickListVal : ple) {                    
                    pickListValuesList.add(new PickListOption(pickListVal.getValue(), pickListVal.getLabel()));
                }
            }
        }
        catch(Exception ex) {
        	throw new DALException(true, 'getPickListValuesIntoList() Params:' + objectType + ', ' + selectedField + ', ' + includeNone, ex);
        }
        return pickListValuesList;
    }
}