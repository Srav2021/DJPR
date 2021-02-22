import { createElement } from 'lwc';
import LibrariesLwc from 'c/librariesLwc';
import getResults from '@salesforce/apex/LibrariesSearchController.getResults';
import getallLibraries from '@salesforce/apex/LibrariesSearchController.getallLibraries';
import getcontentLibraryIdfromLenderId from '@salesforce/apex/LibrariesSearchController.getcontentLibraryIdfromLenderId';

// Realistic data loaded from json
const scenarioMockData = require('./data/scenarioMockData.json');

// Mocking imperative Apex method call
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
    '@salesforce/apex/LibrariesSearchController.getcontentLibraryIdfromLenderId',
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

describe('c-libraries-lwc', () => {
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

    it('test getAllLibraries init load and toggle view button click and getcontentctr method', () => {
        getallLibraries.mockResolvedValue(scenarioMockData.ALL_LIBRARIES);
        getResults.mockResolvedValue(scenarioMockData.FOLDER_CONTENTS);
        const element = createElement('c-libraries-lwc', {
            is: LibrariesLwc
        });
        element.searchId='';
        document.body.appendChild(element);
        return flushPromises().then(() => {
            const tileElement = element.shadowRoot.querySelector('lightning-tile');
            expect(tileElement).not.toBeNull();
            expect(tileElement.textContent).toContain("NAB");    
            const toggleview = element.shadowRoot.querySelector('lightning-button[class="toggle_button"]');  
            expect(toggleview).not.toBeNull();
            toggleview.click();
            return flushPromises().then(() => {
                const datatableElement2 = element.shadowRoot.querySelector('lightning-datatable[class="librariestable"]');
                expect(datatableElement2).not.toBeNull();
                expect(datatableElement2.data[0].Name).toContain("NAB");  
                toggleview.click();
                return flushPromises().then(() => {
                    const viewlibrarycontents = element.shadowRoot.querySelector('[class="viewlibrarycontents"]');
                    expect(viewlibrarycontents).not.toBeNull();
                    viewlibrarycontents.click(); 
                    return flushPromises().then(() => {
                        const datatableElement = element.shadowRoot.querySelector('lightning-datatable[class="contentfolderstable"]');
                        expect(datatableElement).not.toBeNull();
                        expect(datatableElement.data.length).toBe(3); 
                    });

                }); 
            });
        }); 
    });
    it('test getResults and getalllibrariesctr click', () => {
        getallLibraries.mockResolvedValue(scenarioMockData.ALL_LIBRARIES);
        getResults.mockResolvedValue(scenarioMockData.FOLDER_CONTENTS_NULL_PARENT);
        const element = createElement('c-libraries-lwc', {
            is: LibrariesLwc
        });        
        element.searchId='a0V6C000000r6IBUAY4';
        document.body.appendChild(element);
        return flushPromises().then(() => {
            const datatableElement = element.shadowRoot.querySelector('lightning-datatable[class="contentfolderstable"]');
            expect(datatableElement).not.toBeNull();
            expect(datatableElement.data.length).toBe(3); 
            return flushPromises().then(() => {
                const ViewAllLibs = element.shadowRoot.querySelector('[class="viewalllibraries"]');  
                expect(ViewAllLibs).not.toBeNull();
                ViewAllLibs.click();
                return flushPromises().then(() => {
                    const tileElement = element.shadowRoot.querySelector('lightning-tile');
                    expect(tileElement).not.toBeNull();
                    expect(tileElement.textContent).toContain("NAB"); 
                });
            });
        }); 
    });
    it('test getsearchIdfromLenderIdHlp and selectfolder method and getparentCtr method', () => {
        getallLibraries.mockResolvedValue(scenarioMockData.ALL_LIBRARIES);
        getResults.mockResolvedValue(scenarioMockData.FOLDER_CONTENTS);
        getcontentLibraryIdfromLenderId.mockResolvedValue('07H2C0000008PvdUAF');
        const element = createElement('c-libraries-lwc', {
            is: LibrariesLwc
        });              
        element.testurl=true;  
        document.body.appendChild(element);
        return flushPromises().then(() => {
            const datatableElement = element.shadowRoot.querySelector('lightning-datatable[class="contentfolderstable"]');
            expect(datatableElement).not.toBeNull();
            expect(datatableElement.data.length).toBe(3);   
            element.selectfolder('07H2C0000008PvdUAF'); 
            return flushPromises().then(() => {
                const datatableElement2 = element.shadowRoot.querySelector('lightning-datatable[class="contentfolderstable"]');
                expect(datatableElement2).not.toBeNull();
                expect(datatableElement2.data.length).toBe(3); 
                return flushPromises().then(() => {
                    const viewparentfolder = element.shadowRoot.querySelector('[class="viewparentfolder"]');  
                    expect(viewparentfolder).not.toBeNull();
                    viewparentfolder.click();
                    return flushPromises().then(() => {
                        const datatableElement3 = element.shadowRoot.querySelector('lightning-datatable[class="contentfolderstable"]');
                        expect(datatableElement3).not.toBeNull();
                        expect(datatableElement3.data.length).toBe(3); 
                    });
                });
            });
        }); 
    });

    it('test getsearchIdfromLenderIdHlp and with invalid lenderid and library table and contentfolder table row actions', () => {
        getallLibraries.mockResolvedValue(scenarioMockData.ALL_LIBRARIES);
        getResults.mockResolvedValue(scenarioMockData.FOLDER_CONTENTS);
        getcontentLibraryIdfromLenderId.mockResolvedValue('');
        const element = createElement('c-libraries-lwc', {
            is: LibrariesLwc
        });              
        element.testurl=true;  
        document.body.appendChild(element);        
        return flushPromises().then(() => {
            const tileElement = element.shadowRoot.querySelector('lightning-tile');
            expect(tileElement).not.toBeNull();
            expect(tileElement.textContent).toContain("NAB"); 
            const toggleview = element.shadowRoot.querySelector('lightning-button[class="toggle_button"]');  
            expect(toggleview).not.toBeNull();
            toggleview.click();
            return flushPromises().then(() => {
                const datatableElement1 = element.shadowRoot.querySelector('lightning-datatable[class="librariestable"]');
                expect(datatableElement1).not.toBeNull();
                expect(datatableElement1.data[0].Name).toContain("NAB"); 
                datatableElement1.dispatchEvent(new CustomEvent('rowaction',scenarioMockData.SELECTED_LIB_ROW)); 
                return flushPromises().then(() => {
                    const datatableElement2 = element.shadowRoot.querySelector('lightning-datatable[class="contentfolderstable"]');
                    expect(datatableElement2).not.toBeNull();
                    var evt=new CustomEvent('rowaction',{detail: { row: { contdocId : "a0V6C000000r6IBUAY3"}}});
                    datatableElement2.dispatchEvent(evt); 
                    return flushPromises().then(() => {
                        const datatableElement3 = element.shadowRoot.querySelector('lightning-datatable[class="contentfolderstable"]');
                        expect(datatableElement3).not.toBeNull(); 
                        const windowOpenSpy = spyOn(window, 'open');
                        var evt2 = new CustomEvent('rowaction',{detail: { row: { contdocId : "0696C000000r6IBUAY3"}}});
                        datatableElement3.dispatchEvent(evt2);
                        return flushPromises().then(() => {
                            expect(windowOpenSpy).toHaveBeenCalled();                             
                        });
                    });
                });
            });    
        }); 
    });
    it('test sort data', () => {
        getallLibraries.mockResolvedValue(scenarioMockData.ALL_LIBRARIES);
        getResults.mockResolvedValue(scenarioMockData.FOLDER_CONTENTS_NULL_PARENT);
        const element = createElement('c-libraries-lwc', {
            is: LibrariesLwc
        });        
        //element.notdisplayalllibs=true;
        element.searchId='a0V6C000000r6IBUAY4';
        document.body.appendChild(element);
        return flushPromises().then(() => {
            const dataTable = element.shadowRoot.querySelector('lightning-datatable[class="contentfolderstable"]');
            expect(dataTable).not.toBeNull();
            dataTable.dispatchEvent(new CustomEvent("sort", scenarioMockData.SORT_DATA));
            return flushPromises().then(() => {
               // Validate if sorted field assigned to data table
                expect(dataTable.sortedBy).toBe(scenarioMockData.SORT_DATA.detail.fieldName);
                dataTable.dispatchEvent(new CustomEvent("sort", scenarioMockData.SORT_DATA_NONTITLE));
                return flushPromises().then(() => {
                    // Validate if sorted field assigned to data table
                    expect(dataTable.sortedBy).toBe(scenarioMockData.SORT_DATA_NONTITLE.detail.fieldName);
                    
                });
                
            });
        }); 
    });
});