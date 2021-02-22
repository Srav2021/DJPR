import {
    api
} from 'lwc';
import {
    BasePageNavigationLwc
} from 'c/basePageNavigationLwc';
import getProfileDetails from '@salesforce/apex/CustomRelatedListController.getProfileDetails';
import limitedProfile from '@salesforce/label/c.Limited_User';
import getRelatedRecordsAndSObjectMetadata from '@salesforce/apex/CustomRelatedListController.getRelatedRecordsAndSObjectMetadata';
import getRelatedRecords from '@salesforce/apex/CustomRelatedListController.getRelatedRecords';
import deleteRecord from '@salesforce/apex/CustomRelatedListController.deleteRecord';

import {
    isEmpty,
    dispatchCustomEvent,
    dispatchCustomEventWithPayload,
    toast,
    isDesktop,
    isUndefinedOrNull,
    isNotEmpty,
    isTablet
} from 'c/utility';

// declare events
const RELATED_LIST_EVENTS = {
    VIEWALL_CLICK: 'viewallclick',
    DEFAULT_EDIT: 'defaultedit',
    DEFAULT_DELETE: 'defaultdelete',
    RELATED_LIST_REFRESH: 'relatedlistrefresh',
    INLINE_TABLE_SAVE: 'inlinetablesave',
    INLINE_TABLE_CANCEL: 'inlinetablecancel',
    CELL_CHANGE: 'cellchange',
    SHOW_CLICK: 'showclick',
    HIDE_CLICK: 'hideclick',
    VIEWLESS_CLICK: 'viewlessclick'
};
Object.freeze(RELATED_LIST_EVENTS);

export default class RelatedListLwc extends BasePageNavigationLwc {
    @api recordId; // Bind the recordId from community page
    @api recordIdList = []; //The Ids to filter against when quering the rows to display
    @api relatedSobjectName; //The object from which the data will be queried
    @api lookupFieldName; //The filtering field used quering the data from the specified related sObject
    @api rowIdFieldName; //Unique row identifier, which is the Salesforce id that should be used to launch the row level actions
    @api columns; //Array of the object that's used to define the columns
    @api relatedSobjectPluralLabel; //Label to display on the relatedList
    @api sobjectIconName; //Icon to display on the relatedList section
    @api relatedObjectRecords = []; //List of data records from which data will be extracted to build the tableData attribute's value
    @api isViewingAll = false; //Indicates that the user is in the View All page
    @api isReadOnly = false; //Indicates to remove all header and row actions
    @api manualDataEntry = false; //Indicates whether the related display records needs to be queried from the DB or passed by the user
    @api environmentUrl; //Partial Salesforce URL used for navigating to detail view of records
    @api maxNumberOfRows = 6; //Maximum number of rows to display on desktop view
    @api overrideViewAll = false; //If true will fire back to the parent component to handle ViewAll
    @api defaultRowCount = 6; //Stores the row count before View All
    @api viewAllParams; //Parameters that are passed by the parent to support the view all functionality
    @api errors = []; //Object to store errors for inline data table
    @api resizeColumnDisabled; //Prevent user from resizing columns out of the containing div
    @api headerLevelActions = []; // Header level actions passed from parent
    @api isLoading = false //Flag to indicate that User interaction is blocked due to page content refresh
    @api showData = false; // Flag to show/hide the table data
    @api standardRelatedListStyle = false; //Flag to use standard related list style
    @api hideHeaderActionButtons = false; //Hide header action buttons 
    isListView = false; //Indicates whether list view is displayed
    maxNumberOfRowsReached = false; //Indicates whether the maximum number of rows that is supposed to be displayed initially on the relatedList has reached
    maxNumberOfRowsLimit = 50000; //Maximum number of row to display when viewing all records
    defaultDesktopRecordCount = 6; //The default number of records to display in a desktop view
    defaultMobileRecordCount = 3; //The default number of records to display in a device other than a desktop
    desktopView = false; //Indicates whether the user is viewing this component in a Desktop
    renderDefaultRowActions = true; //Indicates to display default row actions
    profile; //profile name of logged in user
    modalHeaderTitle // title to be displayed in the modal
    hasActionButton = false; // flag to indicate to diplay action button on modal
    modalBodyMessage; // message to be displayed on modal
    actionLabel; //button label on modal
    recordIdToDelete; // variable to store the record id for delete
    deleteToastMessage; // toast message to display on delete
    tableRelatedObjectRecords = []; // list of related records to send to data table
    allRecordDataList;

    // labels
    label = {
        limitedProfile
    };

    get iconStyle() {
        return this.tableRelatedObjectRecords.length > 0 ? 'cardStyle' : '';
    }

    get cardTitle() {
        return (this.isViewingAll ?
            this.relatedSobjectPluralLabel + ' (' + this.tableRelatedObjectRecords.length + ')' :
            (this.maxNumberOfRowsReached ?
                this.relatedSobjectPluralLabel + ' (' + this.maxNumberOfRows + '+)' :
                this.relatedSobjectPluralLabel + ' (' + this.tableRelatedObjectRecords.length + ')')
        )
    }

    get relatedRecordSize() {
        return this.tableRelatedObjectRecords.length > 0 ? true : false;
    }

    get showValidationTick() {
        return this.tableRelatedObjectRecords.length > 0 && !this.isReadOnly ? true : false;
    }

    get viewAll() {
        return !this.isViewingAll && this.maxNumberOfRowsReached;
    }

    get viewLess() {
        return this.isViewingAll && (this.tableRelatedObjectRecords.length > this.defaultRowCount);
    }

    get showFooter() {
        return this.relatedRecordSize && !this.showData;
    }

    get displayAddButton() {
        return this.desktopView && !this.isReadOnly && isNotEmpty(this.headerLevelActions);
    }

    get displayDefaultAddButton() {
        return this.desktopView && !this.isReadOnly && isEmpty(this.headerLevelActions);
    }

    get addButtonLabel() {
        return 'Add ' + this.relatedSobjectPluralLabel;
    }

    get hideDataAction() {
        return this.desktopView && !this.showData;
    }

    // initialize component
    connectedCallback() {
        this.loadData();
    }

    // call to data table during render
    renderedCallback() {
        //for partner style related list or BID style related list
        if((this.standardRelatedListStyle && this.relatedRecordSize) || (this.showData && !this.standardRelatedListStyle))
            this.template.querySelector('[data-id="dataTableCmpId"]').manuallyTransformData(this.tableRelatedObjectRecords, this.environmentUrl);
    }

    //Exposed method that let parent component to load the data
    @api
    loadData() {
        this.isLoading = true;
        let recordId = this.recordId;
        let recordIdList = isEmpty(this.recordIdList) ? (isEmpty(recordId) ? [] : [recordId]) : this.recordIdList;
        let fieldList = [];
        let relatedSobjectName = this.relatedSobjectName;
        let lookupFieldName = this.lookupFieldName;
        let rowIdFieldName = this.rowIdFieldName;
        let columns = JSON.parse(JSON.stringify(this.columns));
        let relatedRecords = [];
        this.desktopView = isDesktop() || isTablet(); //considering desktop and tablet

        // Check if on View All page
        let url = window.location.pathname;
        if (url.includes('related-list-view-all')) {
            this.isListView = true;
            this.isViewingAll = true;
        }

        //Set number of rows when viewing all records
        if (this.isViewingAll) {
            this.maxNumberOfRows = this.maxNumberOfRowsLimit;
        }
        if (!this.desktopView && this.maxNumberOfRows === this.defaultDesktopRecordCount) {
            this.maxNumberOfRows = this.defaultMobileRecordCount;
        }
        let maxNumberOfRows = this.maxNumberOfRows;

        //Findout if the row level actions are already defined
        let rowActionsDefined = false;
        columns.forEach(col => {
            //row actions can be button icon for BID or action for partner style UI
            if (col.type === 'button-icon' || col.type === 'action') {
                rowActionsDefined = true;
            }
            if (col.fieldName) {
                fieldList.push(col.fieldName);
            }
        });

        //If row level actions are not defined by user, defined default Edit and Delete actions  
        if (!rowActionsDefined && this.renderDefaultRowActions) {
            let defaultActions = [];
            if (this.standardRelatedListStyle) {
                //row actions for partner style
                let defaultRowActions = [{
                    label: "Edit",
                    name: RELATED_LIST_EVENTS.DEFAULT_EDIT
                }, {
                    label: "Delete",
                    name: RELATED_LIST_EVENTS.DEFAULT_DELETE
                }];
                defaultActions = [{
                    type: "action",
                    typeAttributes: {
                        rowActions: defaultRowActions
                    }
                }];
            } else {
                //row actions for BID style
                defaultActions = [{
                        label: '',
                        name: RELATED_LIST_EVENTS.DEFAULT_EDIT,
                        type: 'button-icon',
                        typeAttributes: {
                            label: {
                                fieldName: RELATED_LIST_EVENTS.DEFAULT_EDIT
                            },
                            title: 'Click to Edit',
                            name: RELATED_LIST_EVENTS.DEFAULT_EDIT,
                            iconName: 'action:edit'
                        }
                    },
                    {
                        label: '',
                        name: RELATED_LIST_EVENTS.DEFAULT_DELETE,
                        type: 'button-icon',
                        typeAttributes: {
                            label: {
                                fieldName: RELATED_LIST_EVENTS.DEFAULT_DELETE
                            },
                            title: 'Click to Delete',
                            name: RELATED_LIST_EVENTS.DEFAULT_DELETE,
                            iconName: 'action:delete'
                        }
                    }
                ];
            }
            defaultActions.forEach(col => {
                columns.push(col);
            });
            this.columns = columns;
        }

        // Hide the row level actions for read only profile
        getProfileDetails()
            .then(response => {
                this.profile = response.profileName;
                let isReadOnly = this.isReadOnly;
                if ((response.profileName === this.label.limitedProfile) && !response.modifyPermission) {
                    isReadOnly = true;
                    this.isReadOnly = isReadOnly;
                }
                if (isReadOnly) {
                    let columnList = columns.filter(col => (col.type !== 'button-icon' && col.type !== 'action'));
                    if(this.standardRelatedListStyle){
                        let defaultActions = [{
                            "label": "No actions available",
                            "name": "No_Actions_Available",
                            "disabled": true
                        }];
                        columnList.push({
                            "type": "action",
                            "typeAttributes": {
                                "rowActions": defaultActions
                            }
                        });
                    }
                    this.columns = columnList;
                }
            })
            .catch(error => {
                console.log('getProfileDetails call failed: ' + error);
            });

        // Set the icon
        this.sobjectIconName = this.sobjectIconName || this.relatedSobjectName.toLowerCase();

        if (this.manualDataEntry) {
            relatedRecords = this.relatedObjectRecords;
            this.setRelatedObjectRecords(relatedRecords, maxNumberOfRows);
            if (!isUndefinedOrNull(relatedRecords) && relatedRecords.length === 0) {
                this.showData = false;
            }
            this.isLoading = false;
        } else {
            columns.forEach(columnConfig => {
                if (columnConfig.fieldName) {
                    fieldList.push(columnConfig.fieldName);
                }
            });
             
            if (!isEmpty(recordIdList) && recordIdList.length > 0) {
                getRelatedRecordsAndSObjectMetadata({
                        recordIdList: recordIdList,
                        relatedSObjectName: relatedSobjectName,
                        fieldList: fieldList,
                        lookupFieldName: lookupFieldName,
                        rowIdFieldName: rowIdFieldName
                    })
                    .then(response => {
                        relatedRecords = response.relatedRecords;
                        this.environmentUrl = isEmpty(response.salesforceURL) ? '' : response.salesforceURL;
                        this.relatedSobjectPluralLabel = isEmpty(this.relatedSobjectPluralLabel) ? response.relatedSObjectPluralLabel : this.relatedSobjectPluralLabel;
                        this.setRelatedObjectRecords(relatedRecords, maxNumberOfRows);
                        if (!isUndefinedOrNull(relatedRecords) && relatedRecords.length === 0) {
                            this.showData = false;
                        }
                        this.isLoading = false;
                    })
                    .catch(error => {
                        console.log('getRelatedRecordsAndSObjectMetadata call failed: ' + error);
                    })
            } else {
                this.setRelatedObjectRecords(relatedRecords, maxNumberOfRows);
                if (!isUndefinedOrNull(relatedRecords) && relatedRecords.length === 0) {
                    this.showData = false;
                }
                this.isLoading = false;
            }
        }
    }

    // Call the data table module method to bind the data
    setRelatedObjectRecords(relatedRecords, maxNumberOfRows) {
        this.maxNumberOfRowsReached = relatedRecords.length > maxNumberOfRows;
        this.tableRelatedObjectRecords = relatedRecords.slice(0, maxNumberOfRows);
        this.allRecordDataList = relatedRecords;
    }

    //Exposed method that let parent component to refresh the related list
    @api
    reloadData(updatedRelatedObjectRecords) {
        let recordId = this.recordId;
        let recordIdList = isEmpty(this.recordIdList) ? (isEmpty(recordId) ? [] : [recordId]) : this.recordIdList;
        let fieldList = [];
        let relatedSobjectName = this.relatedSobjectName;
        let maxNumberOfRows = this.maxNumberOfRows;
        let lookupFieldName = this.lookupFieldName;
        let rowIdFieldName = this.rowIdFieldName;
        let columns = this.columns;

        //Set number of rows when viewing all records
        if (this.isViewingAll) {
            maxNumberOfRows = this.maxNumberOfRowsLimit;
        }

        if (this.manualDataEntry) {
            let updatedRecords = updatedRelatedObjectRecords;
            this.setRelatedObjectRecords(updatedRecords, maxNumberOfRows);
            if (!isUndefinedOrNull(updatedRecords) && updatedRecords.length === 0) {
                this.showData = false;
            }
        } else {
            columns.forEach(columnConfig => {
                if (columnConfig.fieldName) {
                    fieldList.push(columnConfig.fieldName);
                }
            });

            if (!isEmpty(recordIdList) && recordIdList.length > 0) {
                getRelatedRecords({
                        recordIdList: recordIdList,
                        relatedSObjectName: relatedSobjectName,
                        fieldList: fieldList,
                        lookupFieldName: lookupFieldName,
                        rowIdFieldName: rowIdFieldName
                    })
                    .then(relatedRecords => {
                        this.setRelatedObjectRecords(relatedRecords, maxNumberOfRows);
                    })
                    .catch(error => {
                        console.log('getRelatedRecords call failed: ' + error);
                    })
            }
        }
    }

    // navigate to related list with all data
    navigateToRelatedList(event) {
        if (this.overrideViewAll) {
            if (!this.isViewingAll) {
                this.defaultRowCount = this.maxNumberOfRows;
            }
            this.isLoading = true;
            this.isViewingAll = true;
            dispatchCustomEvent(RELATED_LIST_EVENTS.VIEWALL_CLICK, this);
        } else {
            // TODO:Navigate to related list view page 
        }
    }

    // action on view less button click
    hideRecordsAction(event) {
        this.isLoading = true;
        this.maxNumberOfRows = this.defaultRowCount;
        this.isViewingAll = false;
        dispatchCustomEvent(RELATED_LIST_EVENTS.VIEWLESS_CLICK, this);
        this.loadData();
    }

    // handler for row action
    handleRowAction(event) {
        let recordId = event.detail.payLoad.recordId;
        let actionType = event.detail.payLoad.actionType;
        let useDefaultAction = event.detail.payLoad.useDefault;
        let selectedRowData = event.detail.payLoad.rowData;

        if (useDefaultAction) {
            this.handleDefaultRowAction(actionType, recordId);
        } else {
            let payLoad = {
                "recordId": recordId,
                "rowData": selectedRowData
            };
            dispatchCustomEventWithPayload(actionType, payLoad, this);
        }
    }

    //handler for default row action
    handleDefaultRowAction(actionType, recordId) {
        if (actionType === RELATED_LIST_EVENTS.DEFAULT_EDIT) {
            super.goToRecordEditPage(recordId);
        } else if (actionType === RELATED_LIST_EVENTS.DEFAULT_DELETE) {
            this.modalBodyMessage = 'Are you sure you want to delete this ' + this.relatedSobjectName + '?';
            this.modalHeaderTitle = 'Delete ' + this.relatedSobjectName;
            this.hasActionButton = true;
            this.actionLabel = 'Delete';
            this.recordIdToDelete = recordId;
            this.deleteToastMessage = this.relatedSobjectName + ' record was deleted';
            this.template.querySelector('c-message-modal-lwc').show();
        }
    }

    //handler for modal action button click
    handleModalActionClick(event) {
        this.deleteRecord(this.recordIdToDelete, this.deleteToastMessage);
    }

    //delete record
    deleteRecord(recordId, toastMessage) {
        deleteRecord({
                recordId: recordId
            })
            .then(() => {
                let successMessage = toastMessage;
                dispatchCustomEvent(RELATED_LIST_EVENTS.RELATED_LIST_REFRESH, this);
                toast().success(undefined, successMessage, 3000, this);
                //TODO: refresh view 
            })
            .catch(error => {
                toast().error(undefined, error.body.message, 3000, this);
                console.log('deleteRecord call failed: ' + error);
            });
    }

    //handler for inline data table save
    handleInlineTableSave(event) {
        let draftValues = event.detail.payLoad.draftValues;
        let relatedObjectRecords = this.tableRelatedObjectRecords;
        let payLoad = {
            "draftValues": draftValues,
            "relatedObjectRecords": relatedObjectRecords
        };
        dispatchCustomEventWithPayload(RELATED_LIST_EVENTS.INLINE_TABLE_SAVE, payLoad, this);
    }

    //handler for inline data table cancel
    handleInlineTableCancel(event) {
        dispatchCustomEvent(RELATED_LIST_EVENTS.INLINE_TABLE_CANCEL, this);
    }

    // handler for cell change in data table
    handleCellChange(event) {
        let draftValues = event.detail.payLoad.draftValues;
        let payLoad = {
            "draftValues": draftValues
        };
        dispatchCustomEventWithPayload(RELATED_LIST_EVENTS.CELL_CHANGE, payLoad, this);
    }

    //Exposed method that let parent component to delete the record
    @api
    launchDeleteModal(headerTitle, bodyMessage, toastMessage, recordId) {
        this.modalBodyMessage = bodyMessage;
        this.modalHeaderTitle = headerTitle;
        this.hasActionButton = true;
        this.actionLabel = 'Delete';
        this.recordIdToDelete = recordId;
        this.deleteToastMessage = toastMessage;
        this.template.querySelector('c-message-modal-lwc').show();
    }

    // create new record for default header action
    handleAddNewRecord(event) {
        let recordId = this.recordId;
        let relatedSobjectName = this.relatedSobjectName;
        let lookupFieldName = this.lookupFieldName;
        let defaultFieldValues = {
            [lookupFieldName]: recordId
        };
        super.goToRecordCreatePageWithDefaults(relatedSobjectName, defaultFieldValues);
    }

    // Hide table data on click of chevron
    hideTableData(event) {
        this.showData = false;
        dispatchCustomEvent(RELATED_LIST_EVENTS.HIDE_CLICK, this);
    }

    // Show table data on click of show link from footer
    showTableData(event) {
        event.preventDefault();
        event.stopPropagation();
        this.showData = true;
        dispatchCustomEvent(RELATED_LIST_EVENTS.SHOW_CLICK, this);
    }

    // handler for header level action click
    handleHeaderLevelClick(event) {
        let actionType = event.target.dataset.type;
        dispatchCustomEvent(actionType, this);
    }

    // handle record sorting
    handleSortRecords(event){
        this.tableRelatedObjectRecords = !this.isViewingAll ? event.detail.payLoad.slice(0, this.maxNumberOfRows) : event.detail.payLoad;
    }
}