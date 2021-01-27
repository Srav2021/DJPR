({  
  getClientIdAndDocsHlp : function(component, helper,searchText) {
        var action = component.get("c.getClientIdAndFiles");
        action.setParams({'searchText': searchText});
        //execute server call.
        action.setCallback(this, function(response){ 
            let retVal=response.getReturnValue();
            component.set('v.ClientId', retVal.clientid); 
            component.set('v.documentList', retVal.listDocdata);
            let allDocsList = retVal.listDocdata;
            allDocsList.forEach(function(data){
              data.ContentSize = helper.getreadableFileSizeHlp(data.ContentSize);
          });

            let Category1List=allDocsList.filter(docRec => (!$A.util.isUndefined(docRec) && docRec.Category__c === 'Category1'));
            component.set('v.Category1List', Category1List);
            let Category2List=allDocsList.filter(docRec => (!$A.util.isUndefined(docRec) && docRec.Category__c === 'Category2'));
            component.set('v.Category2List', Category2List);
            let Category3List=allDocsList.filter(docRec => (!$A.util.isUndefined(docRec) && docRec.Category__c === 'Category3'));
            component.set('v.Category3List', Category3List);
            let Category4List=allDocsList.filter(docRec => (!$A.util.isUndefined(docRec) && docRec.Category__c === 'Category4'));
            component.set('v.Category4List', Category4List);
            let Category5List=allDocsList.filter(docRec => (!$A.util.isUndefined(docRec) && docRec.Category__c === 'Category5'));
            component.set('v.Category5List', Category5List);
            if(retVal.listDocdata.length>0)
            {
            component.set('v.showFiles',true);
            }
          //stop spinner.
          component.set('v.issearching', false);
   });
   $A.enqueueAction(action);  
    } ,
    getreadableFileSizeHlp : function(fileSizeInBytes) {
      if(fileSizeInBytes <= 0 || fileSizeInBytes===undefined) return "0 B";
       var i = -1;
     var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
     do {
         fileSizeInBytes = fileSizeInBytes / 1024;
         i++;
     } while (fileSizeInBytes > 1024);
 
     return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
  }  
})