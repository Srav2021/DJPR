import { createElement } from 'lwc';
import LibrariesSearchLwc from 'c/librariesSearchLwc';
import getContentVersionSearchResults from '@salesforce/apex/LibrariesSearchController.getContentVersionSearchResults';
import getallLibraries from '@salesforce/apex/LibrariesSearchController.getallLibraries';
import getResults from '@salesforce/apex/LibrariesSearchController.getResults';
import { ShowToastEventName } from 'lightning/platformShowToastEvent';

// Realistic data loaded from json
const scenarioMockData = require('./data/scenarioMockData.json');

// Mocking imperative Apex method call
jest.mock(
    '@salesforce/apex/LibrariesSearchController.getContentVersionSearchResults',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);
jest.mock(
    '@salesforce/apex/LibrariesSearchController.getallLibraries',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);
jest.mock(
    '@salesforce/apex/LibrariesSearchController.getResults',
    () => {
        return {
            default: jest.fn()
        };
    }, {
        virtual: true
    }
);

describe('c-libraries-search-lwc', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    function flushPromises() {
        // eslint-disable-next-line no-undef
        return new Promise(resolve => setImmediate(resolve));
    }

    it(' test handleKeyUpCtr/getContentVersionSearchResults', () => {
        getallLibraries.mockResolvedValue(scenarioMockData.ALL_LIBRARIES);
        getResults.mockResolvedValue(scenarioMockData.FOLDER_CONTENTS);
        getContentVersionSearchResults.mockResolvedValue(scenarioMockData.CONTENTDOCUMENTWRAP);
        const element = createElement('c-libraries-search-lwc', {
            is: LibrariesSearchLwc
        });
        document.body.appendChild(element);
         // Query lightning-input field element
         const inputFieldEl = element.shadowRoot.querySelector('lightning-input');
         //testing blank search string with handlekeyctr method
         inputFieldEl.value ='   ';
         var evt =new CustomEvent('change');
         inputFieldEl.dispatchEvent(evt);    
         //testing minimum search string length criteria with handlekeyctr method     
        inputFieldEl.value ='li';
        const handler = jest.fn();
        // Add event listener to catch toast event
        element.addEventListener(ShowToastEventName, handler);       
        evt.keyCode=13;
        inputFieldEl.dispatchEvent(evt);
        expect(handler).toHaveBeenCalled(); 
        //testing search results with handlekeyctr method
        inputFieldEl.value ='line';
        inputFieldEl.dispatchEvent(evt);
        return flushPromises().then(() => {
            const tree = element.shadowRoot.querySelector('lightning-tree');
            expect(tree).not.toBeNull();
            const tile = element.shadowRoot.querySelector('lightning-tile[class="header_font slds-box search_result_tile"]');
            expect(tile).not.toBeNull();
            //testing FILE CLICK EVENT getSelectedCtr method
            const viewfiledetails = element.shadowRoot.querySelector('[class="view_file_details"]');
            expect(viewfiledetails).not.toBeNull();
            const windowOpenSpy = spyOn(window, 'open'); 
            viewfiledetails.click(scenarioMockData.SELECTED_FILE); 
            expect(windowOpenSpy).toHaveBeenCalled(); 
            //testing View Parent Folder click EVENT getParentCtr method
            const viewparentfolder = element.shadowRoot.querySelector('[class="viewparentfolderinsearch"]');  
            expect(viewparentfolder).not.toBeNull();
            element.testjest=true;
            viewparentfolder.click(scenarioMockData.SELECTED_PARENT_FOLDER);
            expect(element.viewitems).toBe(true);
            //tree item select event getParentCtr method
            element.testjest=false;
            element.testjest=true;
            tree.dispatchEvent(new CustomEvent('select',scenarioMockData.SELECTED_TREE_ITEM));
            expect(element.viewitems).toBe(true);
        });    
    });
});