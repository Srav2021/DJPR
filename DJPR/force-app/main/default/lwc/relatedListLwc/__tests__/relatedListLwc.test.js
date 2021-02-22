import { createElement } from 'lwc';
import RelatedListLwc from 'c/relatedListLwc';
import { dispatchCustomEvent, dispatchCustomEventWithPayload } from 'c/utility';
import getProfileDetails from '@salesforce/apex/CustomRelatedListController.getProfileDetails';
import getRelatedRecordsAndSObjectMetadata from '@salesforce/apex/CustomRelatedListController.getRelatedRecordsAndSObjectMetadata';
import limitedProfile from '@salesforce/label/c.Limited_User';
import getRelatedRecords from '@salesforce/apex/CustomRelatedListController.getRelatedRecords';
import deleteRecord from '@salesforce/apex/CustomRelatedListController.deleteRecord';

// Realistic data loaded from json
const scenarioMockData = require('./data/scenarioMockData.json');

// Mocking imperative Apex method call
jest.mock(
    '@salesforce/apex/CustomRelatedListController.getProfileDetails',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);
jest.mock(
    '@salesforce/apex/CustomRelatedListController.getRelatedRecordsAndSObjectMetadata',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);
jest.mock(
    '@salesforce/apex/CustomRelatedListController.getRelatedRecords',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);
jest.mock(
    '@salesforce/apex/CustomRelatedListController.deleteRecord',
    () => {
        return {
            default: jest.fn(),
        };
    }, {
        virtual: true
    }
);
jest.mock('@salesforce/label/c.limitedProfile', () => {
    return { default: "Podium Partner Limited User" };
}, { virtual: true });

describe('c-related-list-lwc', () => {
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

    function flushPromises() {
        // eslint-disable-next-line no-undef
        return new Promise(resolve => setImmediate(resolve));
    }

    function initializeTestSetup() {}

    it('test fetch related list data', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);
        

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Liability__c";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        document.body.appendChild(element);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            expect(getProfileDetails.mock.calls.length).toBe(1);
            expect(getRelatedRecordsAndSObjectMetadata.mock.calls.length).toBe(1);
        });
    });

    it('test manual entry related list data', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':limitedProfile});

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.manualDataEntry = true;
        element.relatedSobjectName = "Liability__c";
        element.relatedObjectRecords = scenarioMockData.RELATED_LIST_DATA.relatedRecords;
        element.relatedSobjectPluralLabel = scenarioMockData.RELATED_LIST_DATA.relatedSObjectPluralLabel;
        element.environmentUrl = scenarioMockData.RELATED_LIST_DATA.salesforceURL;
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITHOUT_ACTIONS;
        document.body.appendChild(element);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            expect(getProfileDetails.mock.calls.length).toBe(1);
            expect(getRelatedRecordsAndSObjectMetadata.mock.calls.length).toBe(0);
        });
    });

    it('test reload related list data', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);
        getRelatedRecords.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA.relatedRecords);
        

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Liability__c";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        document.body.appendChild(element);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            expect(getProfileDetails.mock.calls.length).toBe(1);
            expect(getRelatedRecordsAndSObjectMetadata.mock.calls.length).toBe(1);
            element.reloadData(null);
        })
        .then(() => {
            expect(getRelatedRecords.mock.calls.length).toBe(1);
        });
    });

    it('test manual reload related list data', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':limitedProfile});
        
        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.manualDataEntry = true;
        element.relatedSobjectName = "Liability__c";
        element.relatedObjectRecords = scenarioMockData.RELATED_LIST_DATA.relatedRecords;
        element.relatedSobjectPluralLabel = scenarioMockData.RELATED_LIST_DATA.relatedSObjectPluralLabel;
        element.environmentUrl = scenarioMockData.RELATED_LIST_DATA.salesforceURL;
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITHOUT_ACTIONS;
        document.body.appendChild(element);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            expect(getProfileDetails.mock.calls.length).toBe(1);
            expect(getRelatedRecordsAndSObjectMetadata.mock.calls.length).toBe(0);
            element.reloadData(scenarioMockData.RELATED_LIST_DATA.relatedRecords);
        })
        .then(() => {
            expect(getRelatedRecords.mock.calls.length).toBe(0);
        });
    });

    it('test related list view all click', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        
        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Liability__c";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);
        let viewLessEl;

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener('viewallclick', handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            //select element for validation
            const viewAllEl = element.shadowRoot.querySelector('span.slds-float_right a');
            viewAllEl.click();
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        })
    });

    it('test related list view less click', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Liability__c";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        element.isViewingAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener('viewlessclick', handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            //click view less
            const viewLessEl = element.shadowRoot.querySelector('span.slds-float_right a');
            viewLessEl.click();
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });

    it('test handle row action event', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Liability__c";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener(scenarioMockData.ROW_ACTION.actionType, handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('c-data-table-lwc');
            // Dispatch event from child element to validate
            // behavior in current component.
            dispatchCustomEventWithPayload('rowaction', scenarioMockData.ROW_ACTION, dataTable);
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });

    it('test default edit handle row action event', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Liability__c";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITHOUT_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener(scenarioMockData.ROW_ACTION_DEFAULT_EDIT.actionType, handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('c-data-table-lwc');
            // Dispatch event from child element to validate
            // behavior in current component.
            dispatchCustomEventWithPayload('rowaction', scenarioMockData.ROW_ACTION_DEFAULT_EDIT, dataTable);
        })
        .then(() => {
            // Validate if event not got fired
            expect(handler).not.toHaveBeenCalled();
        });
    });

    it('test default delete handle row action event', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITHOUT_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('c-data-table-lwc');
            // Dispatch event from child element to validate
            // behavior in current component.
            dispatchCustomEventWithPayload('rowaction', scenarioMockData.ROW_ACTION_DEFAULT_DELETE, dataTable);
        })
        .then(() => {
            const formElement = element.shadowRoot.querySelector('c-message-modal-lwc');
            expect(formElement.title).toBe("Delete Expense");
        });
    });

    it('test delete event handler', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);
        deleteRecord.mockResolvedValue();

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITHOUT_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener('relatedlistrefresh', handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('c-data-table-lwc');
            // Dispatch event from child element to validate
            // behavior in current component.
            dispatchCustomEventWithPayload('rowaction', scenarioMockData.ROW_ACTION_DEFAULT_DELETE, dataTable);
        })
        .then(() => {
            const formElement = element.shadowRoot.querySelector('c-message-modal-lwc');
            dispatchCustomEvent('messageactionclick', formElement);
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });

    it('test delete event handler exception', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);
        deleteRecord.mockRejectedValue(scenarioMockData.APEX_ERROR);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITHOUT_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener('relatedlistrefresh', handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('c-data-table-lwc');
            // Dispatch event from child element to validate
            // behavior in current component.
            dispatchCustomEventWithPayload('rowaction', scenarioMockData.ROW_ACTION_DEFAULT_DELETE, dataTable);
        })
        .then(() => {
            const formElement = element.shadowRoot.querySelector('c-message-modal-lwc');
            dispatchCustomEvent('messageactionclick', formElement);
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).not.toHaveBeenCalled();
        });
    });

    it('test inline save event handler', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener('inlinetablesave', handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('c-data-table-lwc');
            // Dispatch event from child element to validate
            // behavior in current component.
            dispatchCustomEventWithPayload('inlinetablesave', scenarioMockData.DRAFT_VALUES, dataTable);
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });

    it('test cancel event handler', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener('inlinetablecancel', handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('c-data-table-lwc');
            // Dispatch event from child element to validate
            // behavior in current component.
            dispatchCustomEvent('inlinetablecancel', dataTable);
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });

    it('test cell change event handler', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener('cellchange', handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('c-data-table-lwc');
            // Dispatch event from child element to validate
            // behavior in current component.
            dispatchCustomEventWithPayload('cellchange', scenarioMockData.DRAFT_VALUES, dataTable);
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });

    it('test delete modal api method', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            element.launchDeleteModal('headerTitle', 'bodyMessage', 'toastMessage', element.recordId);
        })
        .then(() => {
            const formElement = element.shadowRoot.querySelector('c-message-modal-lwc');
            expect(formElement.title).toBe("headerTitle");
        });
    });

    it('test default add record', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITHOUT_ACTIONS;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener("expenseadd", handler);


        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const buttonEl = element.shadowRoot.querySelector('lightning-button[title="Add record"]');
            buttonEl.click();
        })
        .then(() => {
            // Validate if event not got fired
            expect(handler).not.toHaveBeenCalled();
        });
    });

    it('test add record handler', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.headerLevelActions = scenarioMockData.HEADER_ACTIONS.headerLevelActions;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener("expenseadd", handler);


        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const buttonEl = element.shadowRoot.querySelector('lightning-button[data-type="expenseadd"]');
            buttonEl.click();
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });

    it('test hide table click', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Expense";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        element.headerLevelActions = scenarioMockData.HEADER_ACTIONS.headerLevelActions;
        element.showData = true;
        element.overrideViewAll = true;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener("hideclick", handler);


        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            const divEl = element.shadowRoot.querySelector('.gt-relatedList-carosel').firstElementChild;
            divEl.click();
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });

    it('test show table click', () => {
        // Assign mock value for resolved Apex promise
        getProfileDetails.mockResolvedValue({'profileName':"Podium Partner Standard User"});
        getRelatedRecordsAndSObjectMetadata.mockResolvedValue(scenarioMockData.RELATED_LIST_DATA);
        

        const element = createElement('c-related-list-lwc', {
            is: RelatedListLwc
        });
        element.recordId = "0066C000006IGoxQAG";
        element.relatedSobjectName = "Liability__c";
        element.lookupFieldName = "Id";
        element.rowIdFieldName = "Id";
        element.columns = scenarioMockData.COLUMNS_WITH_ACTIONS;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        // Add event listener to catch child event
        element.addEventListener("showclick", handler);

        // Resolve a promise to wait for a rerender of the new content.
        return flushPromises().then(() => {
            //select element for validation
            const showEl = element.shadowRoot.querySelector('span.slds-align_absolute-center a');
            showEl.click();
        })
        .then(() => {
            // Validate if event got fired
            expect(handler).toHaveBeenCalled();
        });
    });
});