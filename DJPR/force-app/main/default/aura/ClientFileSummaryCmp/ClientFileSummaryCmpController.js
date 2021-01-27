({
	handleKeyUpCtr: function (component,event,helper) {
        var isEnterKey = event.keyCode === 13;
        if (isEnterKey) {
            component.set('v.issearching', true);
            var searchText = component.find('enter-search').get('v.value');
            searchText=searchText.trim();
            component.set('v.searchText', searchText);
        //Initially check the length of the keyWord
          if(searchText.length < 3){
              component.set('v.issearching', false);
              alert('Enter at least 3 characters');
            return;
          }
           helper.getClientIdAndDocsHlp(component, helper,  searchText);
        }
    }
})