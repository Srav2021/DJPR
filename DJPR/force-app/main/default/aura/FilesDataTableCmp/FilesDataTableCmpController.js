({
    handleUploadFinishedCtr : function(component, event, helper) {
        var selectedCategory = component.get("v.selectedCategory");
        var uploadedFiles = event.getParam("files");
        var documentIdsUploaded = [];
        for(var key in uploadedFiles){
            var obj = uploadedFiles[key];
            documentIdsUploaded.push(obj.documentId);
        }
        component.set("v.dataLoaded", false);
        var action = component.get("c.updateContentVersionCategory");
        action.setParams({ 
			documentIdsUploaded : documentIdsUploaded,
            category: selectedCategory,
            clientId: component.get("v.clientId")		
        });
        //execute server call.
        action.setCallback(this, function(response){ 
            let retVal=response.getReturnValue();            
            let allDocsList = retVal.listDocdata;
            allDocsList.forEach(function(data){
              data.ContentSize = helper.getreadableFileSizeHlp(data.ContentSize);
          });
            component.set('v.recordDataList', allDocsList);
            component.set("v.dataLoaded", true);
        });
            $A.enqueueAction(action);
    },
    handleRowActionCtr : function(component, event, helper) {
        let rowLevelActions = event.getParam('action');
        let row = event.getParam('row');
        let actionType = rowLevelActions.name;
        let recordId = row[component.get('v.keyField')];
        if(actionType==='filedownload')
        {
            let urlString = window.location.href;
            let baseURL = urlString.substring(0, urlString.indexOf("/s/"));
            window.open(baseURL + "/sfc/servlet.shepherd/document/download/" + recordId + "?operationContext=S1");
        }
        else if(actionType==='filedelete'){
            var action = component.get("c.performDelete");
            action.setParams({clientId: component.get("v.clientId"), 'deleteRecId' : recordId,category: component.get("v.selectedCategory")}); 
            //execute server call.
            action.setCallback(this, function(response){ 
                let retVal=response.getReturnValue();           
                let allDocsList = retVal.listDocdata;
                allDocsList.forEach(function(data){
                  data.ContentSize = helper.getreadableFileSizeHlp(data.ContentSize);
              });
                component.set('v.recordDataList', allDocsList);
                alert('File is deleted');
                component.set("v.dataLoaded", true);
            });
                $A.enqueueAction(action);
        }
        

    },
     onSaveCtr : function(component, event, helper) {
        var updateData=component.find("dataTableId").get("v.draftValues");
        var action = component.get("c.performUpdate");
        action.setParams({clientId: component.get("v.clientId"), 'updateData' : updateData,category: component.get("v.selectedCategory")}); 
        //execute server call.
        action.setCallback(this, function(response){ 
            let retVal=response.getReturnValue();           
            let allDocsList = retVal.listDocdata;
            allDocsList.forEach(function(data){
              data.ContentSize = helper.getreadableFileSizeHlp(data.ContentSize);
          });
            component.set('v.recordDataList', allDocsList);
            component.set("v.dataLoaded", true);
        });
            $A.enqueueAction(action);
        component.find("dataTableId").set("v.draftValues", null);  
    }

 })