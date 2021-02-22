import { api } from 'lwc';
import { BaseComponentLwc } from 'c/baseComponentLwc';
import { isEmpty, isNotEmpty, isUndefinedOrNull, dispatchCustomEvent, dispatchCustomEventWithPayload } from 'c/utility';
import getPickListValuesIntoList from '@salesforce/apex/PickListController.getPickListValuesIntoList';

const PICKLIST_EVENTS = {
	VALUE_CHANGE: 'picklistvaluechange',
	VALUE_CHANGE_USER: 'picklistvaluechangeuser',
	VALUE__INIT: 'picklistinit',
	BLUR: 'picklistblur'
};
Object.freeze(PICKLIST_EVENTS);

export default class PicklistLwc extends BaseComponentLwc {
	@api objectName; //API name of the object to which the picklist field belongs
	@api fieldName; //API name of the picklist field
	@api picklistLabel; //Label to be displayed for the picklist field
	@api isRequired = false; //Indicate whether the picklist field should be marked as required
	@api includeNone = false; //Indicate whether to include a '--None--' option in the picklist
	@api selectedValue; //Indicate the selected value
	@api picklistValuesGiven = false; //Indicates that the list of picklist values will be supplied by the parent component and shouldn't be queried in the init
	@api picklistValues; //List of options for the picklist
	@api defaultValue; //Default option for the picklist
	@api recordType = null; //API name of the RecordType, when  picklist values are filtered by RecordType. Currently only supported when used with readFromMetaData flag
	@api readFromMetadata = false; //Indicates that the picklist options will be read from a record in the PickList Values Custom Metadata
	@api isRequiredPicklistValueChangeEvent; //Indicate whether the PickListValueChange event should be raised
	@api isRequiredPicklistValueChangeEventUser; //Indicate whether the PickListValueChange event should be raised when the user interact from the UI
	@api messageWhenValueMissing; //Message to display if required value missing
	@api messageIfInvalid; //Show the invalid input message
	@api isDisabled = false; //Specifies that the picklist is disabled
	@api variant = 'standard'; //Available variants include standard, label-hidden, label-inline, and label-stacked
	@api type = 'picklist'; //component type
	@api isRequiredPicklistBlurEventUser; //Indicate whether the PickListValue blur event should be raised when the user interact from the UI
    @api initDispatchSelectedValue;// if true it will send the Selected record type
	picklistValuesToBound; //List of options for the picklist value to bound

    connectedCallback() {
		if(this.picklistValuesGiven) {
			//load and init from provided list
			this.loadPicklistValuesFromManualEntry();
		}
		else {
			//load and init from database
        	this.loadPicklistValuesFromDatabase();
		}
	}

	@api
    loadPicklistValuesFromDatabase() {
        getPickListValuesIntoList({
			objectType: this.objectName, 
			selectedField: this.fieldName,
			recType: this.recordType,
			includeNone: this.includeNone, 
			readFromMetaData: this.readFromMetadata
		})
        .then(result => {
			//update display list and set default and selected values
			this.picklistValuesToBound = this.addSelectedValue(result);
			this.setDefaultAndSelectedValues();
		})
		.catch(error => {
			console.log('Error in populating the picklist options: ' + error);
		});
	}
	
	//Exposed to api for the scenario where parent wants to refresh the list
	@api
	loadPicklistValuesFromManualEntry() {
		if(isNotEmpty(this.picklistValues)) {
			//add None option if requested
			let picklistValuesToBound = Array.from(this.picklistValues);
			if(this.includeNone) {                    
				picklistValuesToBound.unshift({value: '', label: '--None--'});
			}

			//update display list and set default and selected values
			this.picklistValuesToBound = this.addSelectedValue(picklistValuesToBound);
			this.setDefaultAndSelectedValues();
		} else {
			this.picklistValuesToBound = [];
			if(this.includeNone) {
				this.picklistValuesToBound.push({value: '', label: '--None--'});
			}
		}
		
	}

	setDefaultAndSelectedValues() {
		//set default value if no default value given and provided picklist has values
		if(isEmpty(this.defaultValue) && this.picklistValuesToBound.length > 0) {
			this.defaultValue = this.picklistValuesToBound[0].value;
		}
		
		//set selected value
		if(isEmpty(this.selectedValue)) {
			if(isNotEmpty(this.defaultValue)) {
				this.selectedValue = this.defaultValue;
			}
			else {
				this.selectedValue = '';
			}
		}
		if(this.initDispatchSelectedValue){
			dispatchCustomEventWithPayload(PICKLIST_EVENTS.VALUE__INIT, this.selectedValue, this);
		}
	}

	addSelectedValue(valueList) {
		let selectedVal = this.selectedValue;
		//add additional value to list if selected value is outside of provided list, e.g migrated field with old value
		if(!isUndefinedOrNull(valueList) && isNotEmpty(valueList) && !isUndefinedOrNull(selectedVal) && isNotEmpty(selectedVal)) {
            let selectedValAlreadyIncluded = false;
			let selectedValValue;
			
            //Check if the selectedVal is String or Object
            if (typeof selectedVal === 'string' || selectedVal instanceof String) {
                selectedValValue = selectedVal;
			}
			else {
                selectedValValue = selectedVal.value;
			}
			
			//Check if the selectedValValue exists in the List
            for(let i = 0 ; i < valueList.length; i++) {
                if(selectedValValue == valueList[i].value) {
                    selectedValAlreadyIncluded = true;
                    break;    
                }
                //Special case for '--None--' check, Label '--None--', Value ''
                else if(selectedValValue == '--None--' && selectedValValue == valueList[i].label) {
                    selectedValAlreadyIncluded = true;
                    break;    
                }               
			}
			
            if(!selectedValAlreadyIncluded) {
				//Check if the selectedVal is String or Object
				let selectedValKey;
                if (typeof selectedVal === 'string' || selectedVal instanceof String) {
                    selectedValKey = {'label' : selectedVal , 'value' : selectedVal};
				}
				else {
                    selectedValKey = {'label' : selectedVal.label , 'value' : selectedVal.value};
                }
                valueList.push(selectedValKey);
            }
        }
        return valueList;
	}
	
	@api
	handleSelectedValueChange(newValue) {
		//assign new selected value
		this.selectedValue = newValue;

		//refresh picklist and add new value if required
		this.picklistValuesToBound = this.addSelectedValue(this.picklistValuesToBound);

		//fire event if required
		if(this.isRequiredPicklistValueChangeEvent) {
			dispatchCustomEvent(PICKLIST_EVENTS.VALUE_CHANGE, this);
		}
	}

	handleSelectedValueChangeUser(event) {
		//assign new selected value
		this.selectedValue = event.detail.value;

		//fire event if required
		if(this.isRequiredPicklistValueChangeEventUser) {
			dispatchCustomEvent(PICKLIST_EVENTS.VALUE_CHANGE_USER, this);
		}
	}

	@api
	validateInputIfInvalid() {
		//run validation on picklist
		const picklist = this.template.querySelector('lightning-combobox');
		picklist.showHelpMessageIfInvalid();

		//update error message based on validation result
		if(picklist.validity.valid) {
			this.messageIfInvalid = '';
		}
		else {
			this.messageIfInvalid = this.messageWhenValueMissing;
		}
		return !picklist.validity.valid;
	}
	
	handleBlur(event){
		//fire event if required
		if(this.isRequiredPicklistBlurEventUser) {
			dispatchCustomEvent(PICKLIST_EVENTS.BLUR, this);
		}
	}

	@api
	clearValidation() {
		if (this.isRequired)
        {
            let inputCmp = this.template.querySelector('lightning-combobox');
            inputCmp.value="*";
            inputCmp.reportValidity();
            inputCmp.value="";
            inputCmp.setCustomValidity(''); 
        }
	}
}