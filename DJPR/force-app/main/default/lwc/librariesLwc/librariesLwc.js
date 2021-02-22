import { api} from 'lwc';
import { BaseComponentLwc } from 'c/baseComponentLwc';
import { isUndefinedOrNull, isEmpty, isNotEmpty , getURLParameterValue,toast} from 'c/utility';
import getResults from '@salesforce/apex/LibrariesSearchController.getResults';
import getallLibraries from '@salesforce/apex/LibrariesSearchController.getallLibraries';
import getcontentLibraryIdfromLenderId from '@salesforce/apex/LibrariesSearchController.getcontentLibraryIdfromLenderId';

import LIB_ICONS from '@salesforce/resourceUrl/Librariesicons';

export default class librariesLwc extends BaseComponentLwc {
    
    @api searchId="";// description="ContentFolderId whose results to be displayed";
    @api notdisplayalllibs=false;// description="Display all libraries flag";    
    viewdetailslist=false;// description="Display in detail list view flag";
    lstLibraries=[];// description="List of libraries";
    // Library Document Attributes for displaying all contentfolderdocs 
    selectedDocumentId="";// description="Id of document that is selected";
    lstContentDoc=[];// description="List of content documents";
    hasModalOpen=false;// description="toggle flag to close file view";
    // Library Document Attributes for displaying all contentfolders 
    lstContentFolder=[];// description="List of content folders";
    // Library Document Attributes for displaying current and parent contentfolders 
    currentFolder;//" type="Map" description="Data of current content folder";
    currentid="";// description="Id of current content folder";
    currentFolderName="";// description="Name of current content folder";
    parentFolder;//" type="Map" description="Data of parent content folder";
    parentid="";// description="Id of parent content folder";
    parentidexist=false;
    parentFolderName="";// description="Name of parent content folder";        
    foldericon= LIB_ICONS + '/foldericonDesktop.svg#folder-copy';
    tabledata=[];// description="Data being displayed in tables";
    isLoading=false;// description="Flag for spinner";
    sortedBy="";// description="Sorted by this field/column";
    sortedDirection="";// description="Indicates the direction of sorting";
    defaultSortDirection ="desc";// description="Default sort direction of rows";
    sortDirection ="asc";// description="Default sort direction of rows";
    @api testurl=false;  //for testing jest functionality 
    columns=[   {label: 'Title', fieldName: 'contdocTitleTruncated', type: 'button',sortable: 'true',
                 		cellAttributes:{ iconName: {fieldName:'contdocFileType'}, iconPosition: 'left' },
                 		typeAttributes:{ label: { fieldName: 'contdocTitleTruncated'}, name:'view_details',
                 		title: {fieldName:'contdocTitle'},variant:'base'},hideDefaultActions: 'true'},
                {label: 'Description', fieldName: 'contdocDescription', type: 'text',sortable: 'true',hideDefaultActions: 'true'},
                {label: 'LastModifiedDate', fieldName: 'contdocLastModified', type: 'Date',sortable: 'true',fixedWidth:200,hideDefaultActions: 'true'}
            ];
    librarycolumns=[    {label: 'Title', fieldName: 'Name', type: 'button',sortable: 'true',
                 		    cellAttributes:{ iconName: 'standard:folder', iconPosition: 'left' },
                 		    typeAttributes:{ label: { fieldName: 'Name'}, name:'view_details',title: {fieldName:'Name'},variant:'base'},hideDefaultActions: 'true'},
                        {label: 'Description', fieldName: 'Description', type: 'text',sortable: 'true',hideDefaultActions: 'true'}
                    ];

      
    
    connectedCallback(){
        this.loadInitData();
    };

    loadInitData(){        
        let searchId= this.searchId;
        if(isUndefinedOrNull(searchId) || isEmpty(searchId))
        {
            var lenderId= getURLParameterValue().lenderid;
            if(isUndefinedOrNull(lenderId) || isEmpty(lenderId))
            {
                if(this.testurl)
                {
                    this.getsearchIdfromLenderIdHlp(lenderId); 
                } 
                else
                {  
                    this.getAllLibrariesHlp();
                }
            } 
            else  
            {                
                this.getsearchIdfromLenderIdHlp(lenderId);  
            }                     
        }
        else{
            this.getContentfolderItemsHlp(searchId);
        } 
    };
    getAllLibrariesHlp(){
        this.notdisplayalllibs=false;
        this.isLoading=true;
        //execute server call.
        getallLibraries()
        .then(retVal => {  
            this.lstLibraries=retVal.listLibraries;           
            this.tabledata=retVal.listLibraries; 
            this.isLoading=false;
        })
        .catch(error => {
            this.isLoading=false;
            toast().error(undefined, error.body.message, 3000, this);
            console.log('getallLibraries() call failed: ' + error);            
        });
    };
    getContentfolderItemsHlp(searchId){
        this.notdisplayalllibs=true;
        this.isLoading=true;
        if(isUndefinedOrNull(searchId)|| isEmpty(searchId))
            return;
        //execute server call.
        getResults({'searchId': searchId}).then(retVal => {  
            this.lstContentDoc= retVal.listContDocs; 
            this.lstContentFolder=retVal.listContFolders;
            this.tabledata= retVal.listAllContents; 
            var  currentFolder= retVal.currentFolder;
            this.currentFolder= currentFolder;
            var mapKey =[];
            for(var key in currentFolder)
            { 
                mapKey.push(key);
            }
            this.currentid= mapKey;   
            this.currentFolderName=currentFolder[mapKey];                 
            var parentFolder=  retVal.parentFolder; 
            this.parentFolder= parentFolder;
            var mapKey2 =[];
            for(var key in parentFolder)
            {
                mapKey2.push(key);
            }
            this.parentid=mapKey2;  
            this.parentFolderName= parentFolder[mapKey2];  
            if(isNotEmpty(this.parentid))
                this.parentidexist=true;
            else
            this.parentidexist=false;
            //stop spinner.
            this.isLoading=false;
        })
        .catch(error => {
        //stop spinner.
        this.isLoading=false;
        toast().error(undefined, error.body.message, 3000, this);
        console.log('getResults() call failed: ' + error);    
        }); 
    };
    getAllLibrariesCtr (){  
        this.getAllLibrariesHlp();         
    };
    toggelViewCtr() {
        var toggleView = this.viewdetailslist;
        if(toggleView)
        {
            toggleView=false;
        }
        else
        {
            toggleView=true;
            this.tabledata=this.lstLibraries;
        }
        this.viewdetailslist=toggleView;
    };
    getContentCtr (event){ 
        var searchId=event.target.dataset.targetId;
        if(!isUndefinedOrNull(searchId) && isNotEmpty(searchId))
        {
            this.searchId=searchId;          
            this.getContentfolderItemsHlp(searchId );  
        }  
    };
    getParentCtr(event){
        var searchId = event.currentTarget.dataset.targetId;
        if(!isUndefinedOrNull(searchId) && isNotEmpty(searchId))
        {
            this.searchId=searchId;          
            this.getContentfolderItemsHlp(searchId );  
        }
        
    };
    updateColumnSortingCtr(event) {
        this.isLoading= true;        
        // process of the sorting data, so that user will see the
        // spinner loading when the data is being sorted.        
            var fieldName = event.detail.fieldName;
            var sortDirection = this.sortDirection ;
            if(sortDirection === 'asc')
                 sortDirection='desc';
            else sortDirection= 'asc';
            if(fieldName !='contdocTitleTruncated')
            {            	
                this.sortedBy= fieldName;
            	this.sortedDirection= sortDirection;
            	var data =this.sortDataHlp(fieldName, sortDirection,this.tabledata);
                this.tabledata= data;
            }
            else
            {
                fieldName = 'contdocTitleIndexed';
                this.sortedBy='contdocTitleTruncated';
            	this.sortedDirection= sortDirection;
            	var data1 =this.sortDataHlp( fieldName, sortDirection, this.lstContentFolder);
                var data2 =this.sortDataHlp( fieldName, sortDirection, this.lstContentDoc);
                this.tabledata = data1.concat(data2);
            }
            this.sortDirection=sortDirection; 
             //stop spinner.
             this.isLoading=false;
                
        
    };
    sortDataHlp( fieldName, sortDirection, data) {        
            var reverse = sortDirection !== 'asc';
            data = Object.assign([], data.slice().sort(this.sortByHlp(fieldName, reverse ? -1 : 1)));
        
        return data;        
    };
    sortByHlp(field, reverse, primer) {
        var key = primer 
            ?   function(x) {return primer(x.hasOwnProperty(field) ? (typeof x[field] === 'string' ? x[field].toLowerCase() : x[field]) : x[field])} 
            :   function(x) {return x.hasOwnProperty(field) ? (typeof x[field] === 'string' ? x[field].toLowerCase() : x[field]) : x[field]};
            

        return function (a, b) {
            var A = key(a);
            var B = key(b);
            return reverse * ((A > B) - (B > A));
        };
    };
    handleLibRowActionCtr( event) {
        var row = event.detail.row;        
        let recordId = row['Id'];
        this.getContentfolderItemsHlp(recordId ); 
    };
    handleRowActionCtr( event) {
        var row = event.detail.row;        
        let recordId = row['contdocId'];
        if(recordId.substring(0,3)==='069')
        {
            var urlString = window.location.href;
            var baseURL = urlString.substring(0, urlString.indexOf("/s/"));
            window.open(baseURL + "/s/contentdocument/" + recordId);
        }
        else
        {
            this.searchId=recordId;
            this.getContentfolderItemsHlp(recordId ); 
        }
        
    };
    @api
    selectfolder(searchId){        
        this.getContentfolderItemsHlp(searchId);
    };

    getsearchIdfromLenderIdHlp(lenderId){
        //execute server call.
        getcontentLibraryIdfromLenderId({'lenderId': lenderId}).then(retVal => {  
            if(retVal)
            {    
                this.searchId= retVal;  
                this.getContentfolderItemsHlp(this.searchId);
            }
            else{
                toast().error(undefined, 'Invalid lenderid: '+lenderId, 3000, this);
                this.getAllLibrariesHlp();
            }
        })
        .catch(error => { 
            toast().error(undefined, error.body.message, 3000, this);
            console.log('getsearchIdfromLenderIdHlp() call failed: ' + error); 
        });
    };

}