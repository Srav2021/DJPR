import {
    api
} from 'lwc';
import {
    BasePageNavigationLwc
} from 'c/basePageNavigationLwc';
import {
    toast
} from 'c/utility';
import getFilesByApplication from '@salesforce/apex/ApplicationFileRLController.getFilesByApplication';
import BID_ICONS from '@salesforce/resourceUrl/bid_icons';

export default class ApplicationFileRelatedListLwc extends BasePageNavigationLwc {
    @api applicationRecordId; //application record id
    @api contentVersionRecords = []; //content version records
    recordId; //Content Version id
    contentVersionCategories = []; // content version categories
    clientIdList; //Borrower client id list for application
    environmentURL; //Salesforce base url
    maxNumberOfRows = 6; // Maximum number of rows to display
    loadFileUploadForm = false; //flag to switch between form and related list
    isLoading = false; // Flag to indicate that User interaction is blocked due to page content refresh
    isViewingAll = false; //Indicates that the user is in the View All page
    filesIcon = BID_ICONS + '/bid_icons/relatedList/cna_add_files.svg'; //files svg
    showData = false; //Flag to show/hide the table data in related list
    renderRelatedList = false; //flag to render the related list based on response from controller
    isSnapshot = false; // flag to determine whether application is snapshot or not

    //header level action for related list
    headerLevelActions = [{
        'label': 'Add Files',
        'type': 'fileadd'
    }];

    // columns for data table
    columns = [{
            "label": "Client Name",
            "fieldName": "Client.Name",
            "type": "url",
            "typeAttributes": {
                label: {
                    fieldName: "Client.Name_LABEL"
                },
                target: "_self"
            },
            sortable: true
        },
        {
            "label": "Title",
            "fieldName": "Title",
            "type": "text",
            sortable: true
        },
        {
            "label": "Owner",
            "fieldName": "Owner.Name",
            "type": "text",
            sortable: true
        },
        {
            "label": "Categories",
            "fieldName": "Categories",
            "type": "text",
            sortable: true
        },
        {
            "label": "Last Modified",
            "fieldName": "LastModifiedDate",
            "type": "date",
            "cellAttributes": {
                alignment: "left"
            },
            sortable: true
        },
        {
            "label": '',
            "name": 'fileview',
            "type": 'button-icon',
            "initialWidth": 75,
            typeAttributes: {
                label: {
                    fieldName: 'fileview'
                },
                title: 'View',
                name: 'fileview',
                iconName: 'action:preview'
            }
        },
        {
            "label": '',
            "name": 'filedownload',
            "type": 'button-icon',
            "initialWidth": 75,
            typeAttributes: {
                label: {
                    fieldName: 'filedownload'
                },
                title: 'Download',
                name: 'filedownload',
                iconName: 'action:download'
            }
        },
        {
            "label": '',
            "name": 'filedelete',
            "type": 'button-icon',
            "initialWidth": 75,
            typeAttributes: {
                label: {
                    fieldName: 'filedelete'
                },
                title: 'Delete',
                name: 'filedelete',
                iconName: 'action:delete'
            }
        }
    ];

    // Columns for snapshot data table
    snapshotColumns = [{
        "label": "Client Name",
        "fieldName": "Client.Name",
        "type": "url",
        "typeAttributes": {
            label: {
                fieldName: "Client.Name_LABEL"
            },
            target: "_self"
        },
        sortable: true
    },
    {
        "label": "Title",
        "fieldName": "Title",
        "type": "text",
        sortable: true
    },
    {
        "label": "Owner",
        "fieldName": "Owner.Name",
        "type": "text",
        sortable: true
    },
    {
        "label": "Categories",
        "fieldName": "Categories",
        "type": "text",
        sortable: true
    },
    {
        "label": "Last Modified",
        "fieldName": "LastModifiedDate",
        "type": "date",
        "cellAttributes": {
            alignment: "left"
        },
        sortable: true
    }
    ];

    // initialize component
    connectedCallback() {
        // get content verion category types
        let categoryTypes = CommonPicklistHelper.getBIDContentVersionCategories();
        categoryTypes.forEach(element => {
            this.contentVersionCategories.push(element.value);
        });
        this.loadRelatedListData();
    }

    // get the data for related list
    loadRelatedListData() {
        this.isLoading = true;

        getFilesByApplication({
                opptyId: this.applicationRecordId,
                categories: this.contentVersionCategories
            })
            .then(response => {
                this.isSnapshot = false;
                this.isLoading = false;
                this.renderRelatedList = true;
                this.contentVersionRecords = response.contentVersionList;
                this.clientIdList = response.accountIdList;
                this.environmentURL = response.salesforceURL;
                this.template.querySelector(this.isSnapshot ? '[data-id="appSnapshotFilesRelatedList"]' : '[data-id="fileRelatedList"]').reloadData(this.contentVersionRecords);
                if(response.contentVersionList.length > 0) this.showData = true;
            })
            .catch(error => {
                this.isLoading = false;
                console.log('getFilesByApplication call failed: ' + error);
            })
    }

    // handler to refresh the related list
    handleRelatedListRefresh(event) {
        this.loadRelatedListData();
    }

    // handler for add file event
    handleFileAdd(event) {
        this.recordId = null;
        this.loadFileUploadForm = true;
    }

    // handler on file view click
    handleFileView(event) {
        let payload = event.detail.payLoad;
        if (payload.recordId) { 
            let urlString = window.location.href;
            let baseURL = urlString.substring(0, urlString.indexOf("/s/")) + "/s/filepreview?recordId=" + payload.recordId;
            window.open(baseURL,'_blank');
        } else {
            toast().error(undefined, 'Error in selecting the record for viewing', 3000, this);
        }
    }

    // handler on file download click
    handleFileDownload(event) {
        let payload = event.detail.payLoad;
        if (payload.recordId) {
            let urlString = window.location.href;
            let baseURL = urlString.substring(0, urlString.indexOf("/s/"));
            super.goToExternalURL(baseURL + "/sfc/servlet.shepherd/document/download/" + payload.recordId + "?operationContext=S1");
        } else {
            toast().error(undefined, 'Error in selecting the record for downloading', 3000, this);
        }
    }

    // handler on file delete click
    handleFileDelete(event) {
        let payload = event.detail.payLoad;
        if (payload.rowData)
            this.deleteRecord(payload);
        else
            toast().error(undefined, 'Error in selecting the record for deleting', 3000, this);
    }

    // call to related list delete method to delete the record
    deleteRecord(payload) {
        let relatedListCmp = this.template.querySelector('[data-id="fileRelatedList"]');
        let title = 'Delete File';
        let messageBody = 'Are you sure you want to delete this File?';
        let toastMessage = 'File \'' + payload["rowData"]["Title"] + '\' was deleted';
        relatedListCmp.launchDeleteModal(title, messageBody, toastMessage, payload.rowData.ContentDocumentId);
    }

    //handler on related list render event
    handleRelatedListRender(event) {
        this.loadFileUploadForm = false;
    }

    //handler on show click from related list
    handleShowClick(event) {
        this.showData = true;
    }

    //handler on hide click from related list
    handleHideClick(event) {
        this.showData = false;
    }

    // handler on view less click
    handleViewLessClick(event) {
        this.isViewingAll = false;
    }

    // handler on view all click
    handleViewAllClick(event) {
        this.isViewingAll = true;
        this.loadRelatedListData();
    }
}