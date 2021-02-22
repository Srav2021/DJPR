import {
    generateGUID
} from 'c/utility';

export default class Address {
    /**
     * get Address
     */
    static createStandardAddress() {
        return {
            "Id": generateGUID(),
            "Name":"Standard Address",
            "Country__c":"Australia",
            "sobjectType":"Address__c" ,
            "Building_Name__c": '101 Building',
            "Floor_Number__c": 'L12',
            "Street_Number__c": '101',
            "Street_Name__c": 'Collins',
            "Street_Type__c": 'Street',
            "Unit_Number__c": 'U12',
            "RecordTypeId": this.getStandardRecordTypeId()          
        }
    }
    static createNonStandardAddress() {
        return {
            "Id": generateGUID(),
            "Name":"Non Standard Address",
            "Country__c":"Australia",
            "sobjectType":"Address__c" ,
            "Non_Standard_Street__c":'101 Building',
            "Country__c":'Sri Lanka',        
            "RecordTypeId":this.getNonStandardRecordTypeId()          
        }
    }
    static createPOBoxAddress() {
        return {
            "Id": generateGUID(),
            "Name":"PO Box Address",
            "Country__c":"Australia",
            "sobjectType":"Address__c",
            "PO_Box__c":'101',
            "PO_Box_Type__c":'POBox',
            "PO_Exchange__c":'10001',
            "RecordTypeId":this.getPORecordTypeId()        
        }
    }
    static getStandardRecordTypeId(){
        return 'STANDARD_RT_ID';
    }
    static getNonStandardRecordTypeId(){
        return 'NON_STANDARD_RT_ID';
    }
    static getPORecordTypeId(){
        return 'PO_RT_ID';
    }
    static ADDRESS_RECORD_TYPES() 
    {
        return {
        "addressRecordTypes":
            [
                {
                    "Id": this.getStandardRecordTypeId(), 
                    "DeveloperName":"Standard_Address", 
                    "Name":"Standard Address", 
                    "SobjectType":"Address__c"
                }, 
                {
                    "Id": this.getNonStandardRecordTypeId(), 
                    "DeveloperName":"Non_Standard_Address", 
                    "Name":"Non Standard Address", 
                    "SobjectType":"Address__c"
                }, 
                {
                    "Id": this.getPORecordTypeId(), 
                    "DeveloperName":"PO_Box_Address", 
                    "Name":"PO BOX Address", 
                    "SobjectType":"Address__c"
                }
            ]
        }
    }
}