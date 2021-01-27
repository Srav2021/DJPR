({
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