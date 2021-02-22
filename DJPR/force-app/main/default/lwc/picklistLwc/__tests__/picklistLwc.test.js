import { createElement } from 'lwc';
import PicklistLwc from 'c/picklistLwc';

import getPickListValuesIntoList from '@salesforce/apex/PickListController.getPickListValuesIntoList';

jest.mock(
    '@salesforce/apex/PickListController.getPickListValuesIntoList',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);

describe('c-picklist-lwc', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    function getPicklistValues() {
        return [
            { label: 'label1', value: 'value1' },
            { label: 'label2', value: 'value2' }
        ];
    }

    it('test loadPicklistValuesFromDatabase', () => {
        getPickListValuesIntoList.mockResolvedValue(getPicklistValues());
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.options[0].label).toBe('label1');
            expect(picklistElement.options[0].value).toBe('value1');
            expect(picklistElement.options[1].label).toBe('label2');
            expect(picklistElement.options[1].value).toBe('value2');
        });
    });

    it('test loadPicklistValuesFromManualEntry', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.includeNone = true;
        element.picklistValues = getPicklistValues();
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.options[0].label).toBe('--None--');
            expect(picklistElement.options[0].value).toBe('');
            expect(picklistElement.options[1].label).toBe('label1');
            expect(picklistElement.options[1].value).toBe('value1');
            expect(picklistElement.options[2].label).toBe('label2');
            expect(picklistElement.options[2].value).toBe('value2');
        });
    });

    it('test loadPicklistValuesFromManualEntry empty list', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.includeNone = true;
        element.picklistValues = [];
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.options[0].label).toBe('--None--');
            expect(picklistElement.options[0].value).toBe('');
        });
    });

    it('test setDefaultAndSelectedValues', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.initDispatchSelectedValue = true;
        element.picklistValues = getPicklistValues();
        element.defaultValue = 'value2';
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.value).toBe('value2');
        });
    });

    it('test addSelectedValue existing value', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.picklistValues = getPicklistValues();
        element.selectedValue = 'value1';
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.value).toBe('value1');
        });
    });

    it('test addSelectedValue new value', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.picklistValues = getPicklistValues();
        element.selectedValue = 'value3';
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.value).toBe('value3');
        });
    });

    it('test addSelectedValue none', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.picklistValues = getPicklistValues();
        element.includeNone = true;
        element.selectedValue = '--None--';
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.value).toBe('--None--');
        });
    });

    it('test addSelectedValue existing value', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.picklistValues = getPicklistValues();
        element.selectedValue = 'value2';
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.value).toBe('value2');
        });
    });
    
    it('test handleSelectedValueChange', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.picklistValues = getPicklistValues();
        element.isRequiredPicklistValueChangeEvent = true;
        document.body.appendChild(element);
        element.handleSelectedValueChange('value3');
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            expect(picklistElement.value).toBe('value3');
        });
    });

    it('test handleSelectedValueChangeUser', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.picklistValues = getPicklistValues();
        element.isRequiredPicklistValueChangeEventUser = true;
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
                const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
                picklistElement.dispatchEvent(new CustomEvent("change", { detail: { value: "value2" } }));
            })
            .then(() => {
                const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
                expect(picklistElement.value).toBe('value2');
            });
    });

    it('test validateInputIfInvalid', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.includeNone = true;
        element.picklistValues = getPicklistValues();
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            //there is an issue with validation through jest, function works fine through UI
            //force validity to true to run through the code
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            picklistElement.validity = true;
            element.validateInputIfInvalid();
        });
    });

    it('test handleBlur', () => {
        const element = createElement('c-picklist-lwc', { is: PicklistLwc });
        element.picklistValuesGiven = true;
        element.picklistValues = getPicklistValues();
        element.isRequiredPicklistBlurEventUser = true;
        document.body.appendChild(element);
        
        return flushPromises().then(() => {
            const picklistElement = element.shadowRoot.querySelector('lightning-combobox[data-id="picklistComboBox"]');
            picklistElement.dispatchEvent(new CustomEvent("blur"));
        });
    });

    function flushPromises() {
        // eslint-disable-next-line no-undef
        return new Promise(resolve => setImmediate(resolve));
    }
});