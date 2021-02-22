import { api,track } from 'lwc';
import { BaseComponentLwc } from 'c/baseComponentLwc';
import savedAddresses from '@salesforce/apex/ClientAddressFormController.getSavedAddresses';
import getRecordData from '@salesforce/apex/ClientAddressFormController.getRecordData';
import performSave from '@salesforce/apex/ClientAddressFormController.performSave';
import endDateAfterStartDate from '@salesforce/label/c.FE_Address_End_Date_After_Start_Date';
import addressdetailmissing from '@salesforce/label/c.FE_Address_Detail_Missing';

import { isNotEmpty, isEmpty, isUndefinedOrNull, validateInputComponents, toast,contains,
        generateGUID, isGUID, compareDateLessThanOrEqualString, buildInClauseParameter,
        dispatchCustomEvent, dispatchCustomEventWithPayload
       } from 'c/utility';

//declare events
const CLIENT_ADDRESS_FORM_EVENTS = {
    FORM_CANCEL: 'formcancel',
    FORM_SUCCESS: 'formsuccess',
    FORM_FOCUS: 'formfocus'
};
Object.freeze(CLIENT_ADDRESS_FORM_EVENTS);

export default class ClientAddressFormLwc extends BaseComponentLwc {
    // Attributes with public access
    @api recId;//Client Address record Id
    @api clientRecordId;//Id of the related client record
    @track addressObject={ 'sobjectType': 'Address__c' };//An object to store address record
    @api clientAddressObject={ 'sobjectType': 'Client_Address__c' };//An object to store client address record
    @api newAddressFlag;// Flag to render the address cmp for new address creation form

    // Attributes with private access
    addressFilterClause;//Filter clause for address
    initialAddresses=[];//Initial address list on the address form component    
    dataLoaded=false;//Flag to indicate that User interaction is blocked due to page content refresh
    hasPageErrors= false;//Indicates the existance of a validation error in this form or its child form
    pageErrors= "[]" ;//List of validation errors
    initialSelectedAddress ;

    get showhideclass(){
       return this.dataLoaded ? 'slds-show' : 'slds-hide';
    }
    get initialiseAddressCmp(){
        let initAddresscmp = false;
        if (this.newAddressFlag || !isUndefinedOrNull(this.initialSelectedAddress)) 
        initAddresscmp = true;
        return initAddresscmp;
    }

    
    loadInitData(){
        let recId = this.recId;		
        let clientId = this.clientRecordId;   
              
        this.dataLoaded=false;
        //get the saved addresses and filter clause
		if (clientId){
			this.initAddressesAndFilterClauseHlp(clientId);
		}
		//get the client address record for edit screen
		if (recId){
            this.initExistingRecordHlp(recId);
        }else {
            //In CREATE mode
            //re-apply the selected address type (on previous selection) if user clicked save and new.
            if(isNotEmpty(this.getSelectedAddressFromGlobalState())) 
                this.clientAddressObject.Address_Type__c= this.getSelectedAddressFromGlobalState();                    
        }       
        this.dataLoaded=true;
    }
    handleInputChange(event) {
        this.clientAddressObject = {
            ...this.clientAddressObject,
            [event.target.dataset.fieldName]: event.detail.value
        }; 
    }
    handlePicklistChange(event) {
        this.clientAddressObject = {
            ...this.clientAddressObject,
            [event.target.fieldName]: event.target.selectedValue
        };
    }

    //cancel the form
    @api
    cancel() {
        this.removeDataFromGlobalState();
        dispatchCustomEvent(CLIENT_ADDRESS_FORM_EVENTS.FORM_CANCEL, this);
        dispatchCustomEvent(CLIENT_ADDRESS_FORM_EVENTS.FORM_FOCUS, this);
    }
     //save the form
     @api
     save() {
         this.saveData(false);
     }
 
     //save and open new form
     @api
     saveAndNew() {
         this.saveData(true);
     }

    @api
    saveData(isSaveAndNew) {
        dispatchCustomEvent(CLIENT_ADDRESS_FORM_EVENTS.FORM_FOCUS, this);
        let insertData = [];
		let updateData = [];
    
        //validate the form
		let isFormValid = this.isAddressFormValidHlp();
        
        if(isFormValid) {    
            let clientAddressObject = this.clientAddressObject;
            let addressObject = this.addressObject; 
            clientAddressObject.Client__c = this.clientRecordId;                             

            if(addressObject) {
                if(addressObject.Id && !isGUID(addressObject.Id)) {
                    updateData.push(addressObject);
                }
                else {
                    addressObject.Id = generateGUID();                            
                    insertData.push(addressObject);
                }
            }
            if(clientAddressObject) {
                if(clientAddressObject.Id && !isGUID(clientAddressObject.Id)) {
                    clientAddressObject.Address__c = addressObject.Id;
                    updateData.push(clientAddressObject);
                }
                else {
                    clientAddressObject.Id = generateGUID();
                    clientAddressObject.Address__c = addressObject.Id;
                    insertData.push(clientAddressObject);
                }
            }

            //start spinner.
            this.dataLoaded=false;
        
            //create server action and parameter to save the Income form data
            performSave({ 
                insertData: insertData,
                updateData: updateData,
            }).then(retVal => {
                if(retVal.status) {
                    toast().success(undefined,  'Address record was successfully saved', 1000,this);
                    this.newAddressFlag=false;
                    //if user clicks on save and new, following will be invoked.
                    if(isSaveAndNew){
                        this.dataLoaded=false;
                        this.persistDataToGlobalState();
                        this.resetForm();
                        this.newAddressFlag=true;
                    }
                    else{
                        this.removeDataFromGlobalState();
                    } 
                    dispatchCustomEventWithPayload(CLIENT_ADDRESS_FORM_EVENTS.FORM_SUCCESS, { isSaveAndNew }, this);
                } else {
                    toast().error(undefined, 'Error saving Address record: ' + retVal.statusMessage, 3000,this);
                }
                //stop spinner.
                this.dataLoaded= true;
            })
            .catch(error => {
                //stop spinner.
                this.dataLoaded= true;
                toast().error(undefined, 'Error saving Address record: '+error.message, 3000,this);
            });
        }else {
            let errorform=this.template.querySelector('c-form-validation-error-lwc');
            if(errorform) errorform.scrollIntoView();
        }
	}

	resetViewErrors () {
		//cleanup the page errors
        this.pageErrors= [];
        this.hasPageErrors= false;
	}

    initAddressesAndFilterClauseHlp(clientId) {
        //start spinner.
        this.dataLoaded= false;            
        
        let addressIdSearchList = [];
        
        savedAddresses({accountId : clientId})
        .then(addressList => {
            this.initialAddresses= addressList;
            addressList.forEach(addressRec => {
                addressIdSearchList.push(addressRec.Id);
                if(addressRec.Id===this.clientAddressObject.Address__c)
                  {
                    this.initialSelectedAddress= addressRec.Id;
                    this.addressObject=addressRec;
                  }
        	});
            if(addressIdSearchList.length > 0) {
            	this.addressFilterClause= "id IN (" + buildInClauseParameter(addressIdSearchList) + ")";
        	}
            else {
            	this.addressFilterClause= "id IN ('')";
            }
            //stop spinner.
            this.dataLoaded= true;            
        })
        .catch(error => {
            //stop spinner.
            this.dataLoaded= true;  
            toast().error(undefined, 'Error loading Saved Addresses: '+error, 3000,this); 
        });
	}
    
    initExistingRecordHlp(recId) {        
        //start spinner.
        this.dataLoaded= false;            
        
		getRecordData({clientAddressId : recId}).then(recordData => {
            this.clientAddressObject= recordData;
            let addressRecId = recordData.Address__c;
            this.initialSelectedAddress= addressRecId;            
            //stop spinner.
            this.dataLoaded= true;                            
        })
        .catch(error => {
            //stop spinner.
            this.dataLoaded= true;   
            toast().error(undefined, 'Error loading Client Address record: '+error, 3000,this);   
        });
    }

	validateAddressSectionHlp(){
        let isValid = true;
        let addressForm = this.template.querySelector('[data-id="addressFormId"]');
        this.addressObject=addressForm.addressRecord;
        addressForm.validateForm();
        let addressErrorMessage = addressForm.messagesWhenBadInput;  
        if(isNotEmpty(addressErrorMessage) && !isUndefinedOrNull(addressErrorMessage)) {
            this.concatErrorMessage(addressErrorMessage);
            isValid =  false;
        }
        //validate address details provided
        let addressObject = this.addressObject;       
        if (isEmpty(addressObject) || isEmpty(addressObject.RecordTypeId) || addressObject.RecordTypeId === '--None--'){
            this.concatErrorMessage(addressdetailmissing);            
            isValid =  false;
        }
        return isValid;
	}

	validateClientAddressSectionHlp() {
        let isValid = true;
        let validationResult = true;
        let errorMessage; 

        //Do the field level validation
        var addressFormFields =this.template.querySelectorAll('[data-id="clientAddressFormFieldId"]');
        if(isNotEmpty(addressFormFields)) {
            validationResult = validateInputComponents(addressFormFields);
        }
        if(!validationResult && !isUndefinedOrNull(validationResult)) {
            errorMessage = 'Review errors on the Address section';
            this.concatErrorMessage(errorMessage);
            isValid =  false;        
        }

        //validate Start Date - End Date
        let clientAddressObject = this.clientAddressObject; 

        if (isNotEmpty(clientAddressObject)){
            let startDate;            
            let endDate;
            if (isNotEmpty(clientAddressObject.Start_Date__c)){
                startDate = clientAddressObject.Start_Date__c;
            }            
            if (isNotEmpty(clientAddressObject.End_Date__c)){
                endDate = clientAddressObject.End_Date__c;
            }

            //compare start and end date                     
            validationResult = compareDateLessThanOrEqualString(startDate, endDate);
            if(!validationResult && !isUndefinedOrNull(validationResult)) { 
                this.concatErrorMessage(endDateAfterStartDate);
                isValid =  false;
            }
        }
        return isValid;
    }
    concatErrorMessage(errorMessage){
        this.hasPageErrors= true;            
        let pageErrorList = this.pageErrors;
        if (!contains(pageErrorList,errorMessage)){
            this.pageErrors= pageErrorList.concat(errorMessage);
        } 
    }

	isAddressFormValidHlp() {
		//reset page errors. 
		this.resetViewErrors();
        let isaddressvalid = true;
        let isclientaddressvalid = true;

        //validate address section
        isaddressvalid = this.validateAddressSectionHlp()  ;	

        //validate client address section
        isclientaddressvalid = this.validateClientAddressSectionHlp();

		return isaddressvalid && isclientaddressvalid;
    }
    resetForm(){   
        this.recId = null;
        this.clientAddressObject={ 'sobjectType': 'Client_Address__c'};
        this.loadInitData();
        this.template.querySelector('c-picklist-lwc[data-id="addressStatus"]').loadPicklistValuesFromDatabase();
        let addressForm = this.template.querySelector('[data-id="addressFormId"]');
        addressForm.resetData();
    }
	persistDataToGlobalState() {
        window.SELECTED_ADDRESS_TYPE =  this.clientAddressObject.Address_Type__c;
	}

	getSelectedAddressFromGlobalState() {
		return window.SELECTED_ADDRESS_TYPE;
    }
    removeDataFromGlobalState(){
        window.SELECTED_ADDRESS_TYPE =  undefined;
    }
   
     //initialize component
     connectedCallback() {
        this.loadInitData();
    }
}