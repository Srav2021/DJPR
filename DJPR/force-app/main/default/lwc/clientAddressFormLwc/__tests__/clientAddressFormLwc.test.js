import { createElement } from 'lwc';
import { dispatchCustomEvent } from 'c/utility';
import ClientAddressFormLwc from 'c/clientAddressFormLwc';
import getInstance from '@salesforce/apex/AddressFormController.getInstance';
import getSavedAddresses from '@salesforce/apex/ClientAddressFormController.getSavedAddresses';
import getRecordData from '@salesforce/apex/ClientAddressFormController.getRecordData';
import performSave from '@salesforce/apex/ClientAddressFormController.performSave';
import Address from '../../../../../test/jest-mocks/data/Address';
import ClientAddress from '../../../../../test/jest-mocks/data/ClientAddress';
var StandardRTId;
// Realistic data loaded from json
const scenarioMockData = require('./data/scenarioMockData.json');

// Mocking imperative Apex method call
jest.mock(
    '@salesforce/apex/AddressFormController.getInstance',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);
jest.mock(
    '@salesforce/apex/ClientAddressFormController.getSavedAddresses',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);
jest.mock(
    '@salesforce/apex/ClientAddressFormController.getRecordData',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);
jest.mock(
    '@salesforce/apex/ClientAddressFormController.performSave',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);

describe('c-client-address-form-lwc', () => {
    beforeAll(() => {
        //Test set up across test cases as a one time load
        initializeTestSetup();
    });

    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        // Prevent data saved on mocks from leaking between tests
        jest.clearAllMocks();
    });

    // Helper function to wait until the microtask queue is empty. This is needed for promise
    // timing when calling imperative Apex.
    function flushPromises() {
        // eslint-disable-next-line no-undef
        return new Promise(resolve => setImmediate(resolve));
    }

    const initializeTestSetup = () => {
        getInstance.mockResolvedValue(Address.ADDRESS_RECORD_TYPES());
        StandardRTId=Address.getStandardRecordTypeId();
        let AddressList=[];
        let add1=Address.createStandardAddress();
        add1.Id='a012C00000368FNQAY';
        let add2=Address.createNonStandardAddress();
        add2.Id='a012C00000368EAQAY';
        AddressList.push(add1,add2);
        getSavedAddresses.mockResolvedValue(AddressList);
    }
    it('Load client address add form', () => {
        // Assign mock value for resolved Apex promise
        performSave.mockResolvedValue(scenarioMockData.SaveData);
        let ADDRESS_OBJECT=Address.createStandardAddress();
        let CLIENT_ADDRESS_OBJECT =ClientAddress.createClientAddressWithIds(ADDRESS_OBJECT.Id,'0012C00000RAevsQAD','Residential');
        CLIENT_ADDRESS_OBJECT.Start_Date__c='2012-10-04';
        const element = createElement('c-client-address-form-lwc', {
            is: ClientAddressFormLwc
        });
        element.clientRecordId = '0012C00000RAevsQAD';
        element.clientAddressObject=CLIENT_ADDRESS_OBJECT;
        element.addressObject=ADDRESS_OBJECT;
        element.newAddressFlag=true;
        document.body.appendChild(element);
        
        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const addressTypeElemt = element.shadowRoot.querySelector('c-picklist-lwc[data-id="addressType"]');
            expect(addressTypeElemt).not.toBeNull();
            addressTypeElemt.selectedValue="Previous";
            dispatchCustomEvent('picklistvaluechangeuser',addressTypeElemt);
            const addressForm = element.shadowRoot.querySelector('c-address-form-lwc');
            const addressTypeElement = addressForm.shadowRoot.querySelector('c-picklist-lwc[data-id="addressType"]');
            addressTypeElement.selectedValue=StandardRTId;
            dispatchCustomEvent('picklistvaluechangeuser',addressTypeElement);
            element.save();
        }).then(() => {
            expect(element.newAddressFlag).toBe(false); 
        });
    });

    it('Load client address edit form', () => {
        // Assign mock value for resolved Apex promise
        let RECDATA=ClientAddress.createClientAddressWithIds('a012C00000368EAQAY','0012C00000RAevsQAD','Previous');
        RECDATA.Id='a0D2C0000047kNGUAY';
        RECDATA.Name='Previous - indfn ind';
        RECDATA.Address_Status__c='Own Home';
        RECDATA.Start_Date__c='2017-10-17T00:00:00.000Z';
        getRecordData.mockResolvedValue(RECDATA);
        let ADDRESS_OBJECT=Address.createStandardAddress();
        ADDRESS_OBJECT.Id='a012C00000368EAQAY';
        let CLIENT_ADDRESS_OBJECT =ClientAddress.createClientAddressWithIds(ADDRESS_OBJECT.Id,'0012C00000RAevsQAD','Residential');
        CLIENT_ADDRESS_OBJECT.Id='a0D2C0000047kNGUAY';
        const element = createElement('c-client-address-form-lwc', {
            is: ClientAddressFormLwc
        });
        element.clientRecordId = '0012C00000RAevsQAD';
        element.recId='a0D2C0000047kNGUAY';
        element.clientAddressObject=CLIENT_ADDRESS_OBJECT;
        element.addressObject=ADDRESS_OBJECT;
        element.newAddressFlag=false;
        document.body.appendChild(element);
        
        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            // Select elements for validation
            const addressTypeElemt = element.shadowRoot.querySelector('c-picklist-lwc[data-id="addressType"]');
            expect(addressTypeElemt).not.toBeNull();
            addressTypeElemt.selectedValue="Mailing";
            dispatchCustomEvent('picklistvaluechangeuser',addressTypeElemt);
            const addressForm = element.shadowRoot.querySelector('c-address-form-lwc');
            const addressTypeElement = addressForm.shadowRoot.querySelector('c-picklist-lwc[data-id="addressType"]');
            dispatchCustomEvent('picklistvaluechangeuser',addressTypeElement);
            element.save();
        }).then(() => {
            expect(element.newAddressFlag).toBe(false); 
        });
    });

    it('Test client address form save and new,handleChange,picklist value change and cancel events', () => {
        // Assign mock value for resolved Apex promise
        performSave.mockResolvedValue(scenarioMockData.SaveData);
       let CLIENT_ADDRESS_OBJECT =ClientAddress.createClientAddressWithIds(null,'0012C00000RAevsQAD','Residential');
       CLIENT_ADDRESS_OBJECT.Start_Date__c='2012-10-04';
       CLIENT_ADDRESS_OBJECT.End_Date__c='2014-10-04';
       CLIENT_ADDRESS_OBJECT.Address_Status__c='Own Home';
       const element = createElement('c-client-address-form-lwc', {
            is: ClientAddressFormLwc
        });
        element.clientRecordId = '0012C00000RAevsQAD';
        element.clientAddressObject=CLIENT_ADDRESS_OBJECT;
        element.newAddressFlag=true;
        document.body.appendChild(element);

        // Mock handler for form cancel event
        const fromCancelHandler = jest.fn();
        // Add event listener to catch form change event
        element.addEventListener("formcancel", fromCancelHandler);
        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            // Select elements from Client Address Form to fire events
            const addressTypeElemt = element.shadowRoot.querySelector('c-picklist-lwc[data-id="addressType"]');
            expect(addressTypeElemt).not.toBeNull();
            addressTypeElemt.selectedValue="Previous";
            dispatchCustomEvent('picklistvaluechangeuser',addressTypeElemt);
            // Select elements from Client Address Form to fire events
            const endDateElemt = element.shadowRoot.querySelector('lightning-input[data-field-name="End_Date__c"]');
            expect(endDateElemt).not.toBeNull();
            dispatchCustomEvent('change',endDateElemt);
            const addressForm = element.shadowRoot.querySelector('c-address-form-lwc');
            const addressTypeElement = addressForm.shadowRoot.querySelector('c-picklist-lwc[data-id="addressType"]');
            addressTypeElement.selectedValue=StandardRTId;
            dispatchCustomEvent('picklistvaluechangeuser',addressTypeElement);
            element.saveAndNew();
        }).then(() => {
            expect(element.newAddressFlag).toBe(true); 
            element.cancel();
            expect(fromCancelHandler).toHaveBeenCalled();
        });
    });

});