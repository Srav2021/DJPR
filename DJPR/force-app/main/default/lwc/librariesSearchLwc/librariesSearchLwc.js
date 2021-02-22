import { api} from 'lwc';
import { BaseComponentLwc } from 'c/baseComponentLwc';
import { isUndefinedOrNull, isEmpty, isNotEmpty ,toast } from 'c/utility';
import getContentVersionSearchResults from '@salesforce/apex/LibrariesSearchController.getContentVersionSearchResults';
 
export default class librariesSearchLwc extends BaseComponentLwc {
        // Common Attributes -->
    searchText="";// description="Search term"
    searchTextClone="";// description="Search term clone"
    isSearching=false;// description="spins while searching"    
        // Library Document Attributes -->
        //for displaying tree structure-->
    items;//type="Object" description="List of records in tree structure" 
        // Library Document Attributes for displaying initial search results-->
    docData=[];// description="displays initial search results" 
        //for toggling between displaying search results and folder contents -->
    @api viewitems=false;// description="toggles between search results and folder contents"
        // Attributes to display all libraries during inital load without search -->
    resultsreturned=false;// description="search result length" 
    searchperformed=false;// description="flag to confirm if the search has been performed"
        // Attributes for passing to customLibrariesCmp --> 
    searchId="";// description="ContentFolderId whose results to be displayed"   
    @api testjest=false;
    
    handleKeyUpCtr(event) {
        const isEnterKey = event.keyCode === 13;
        var searchText = event.target.value.trim();
        if (isEnterKey) {
            this.isSearching = true;            
            this.searchText= searchText;
            //Initially check the length of the keyWord
            if(this.searchText.length < 3){
                this.isSearching = false;
                toast().error(undefined, 'Enter at least 3 characters', 3000, this);
                this.searchText = "";
                this.template.querySelector("lightning-input[data-id='enter-search']").value= '';
                return;
            }
            this.getContentDocsHlp(this.searchText); 
            this.template.querySelector("lightning-input[data-id='enter-search']").value= this.searchText;           
        }
        else if(isEmpty(searchText) || isUndefinedOrNull(searchText))
        { 
            this.isSearching = false; 
            this.searchText=searchText;
            this.resultsreturned = false;
            this.searchperformed = false;
            this.searchTextClone = searchText;            
        }        
    };
     // Library Documents Search Helper      
     getContentDocsHlp (searchText) {
        this.viewitems= false;
        //execute server call.
        getContentVersionSearchResults({'searchText': searchText}).then(retVal1 => { 
            this.items= retVal1.listContentDocumentWrapper; 
            this.docData= retVal1.listDocdata;
            var vitems = retVal1.listContentDocumentWrapper;
            this.resultsreturned = vitems.length>0 ? true : false; 
            this.searchperformed = true;
            this.searchTextClone = searchText;
            this.isSearching = false;
            this.searchText = "";
        })
        .catch(error => {
            this.isSearching = false ;  
            console.log("getContentDocsHlp() server call failed"+error);
        });  
    };
    //tree item click event
    handleSelectCtr (event) {
        this.searchId=event.detail.name;
        this.viewitems= true;
        if(!this.testjest)
        this.template.querySelector('[data-id="customLibrariesCmpId"]').selectfolder(this.searchId);
    };
    //file parent click event
    getParentCtr(event){
        this.searchId = event.currentTarget.dataset.targetId;
        if(!isUndefinedOrNull(this.searchId) && isNotEmpty(this.searchId)){            
        this.viewitems= true;
        if(!this.testjest)
        this.template.querySelector('[data-id="customLibrariesCmpId"]').selectfolder(this.searchId);
        }
        
    };
    //FILE CLICK EVENT
    getSelectedCtr(event){
        let recordId = event.target.dataset.targetId;
        var urlString = window.location.href;
        var baseURL = urlString.substring(0, urlString.indexOf("/s/"));
        window.open(baseURL + "/s/contentdocument/" + recordId);
    };

}