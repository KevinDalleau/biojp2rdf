var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var csv = require('csv-streamify');
var N3 = require('n3');
var sourceFrom;
var sourceTo;
var filesEvent = new EventEmitter();
var filesList = new Array();
var options = { //Options for the csv parser
  delimiter: '\t',
  empty: '',
  columns: false
}


String.prototype.formatId = function() { //Removes the cco and other sources indications
  return this.replace(/^.+_(.+_id)\b/,"$1"); // Returns [source]_id
};

fs.readdir('./raw', function(err, files) {
  if(err) {
    console.err(err);
  }
  files.forEach(function(file) {
    filesList.push(file);
  });
  filesEvent.emit('files_ready');
});

filesEvent.on('files_ready',function() {
  filesList.forEach(function(filePath) {
  rdfize(filePath);
  });
});

function rdfize(path) {
  var fstream = fs.createReadStream('./raw/'+path);
  var parser = csv(options, getData);
  fstream.pipe(parser);
  var writer = N3.Writer({
    prefixes: { 'biodb': 'http://biodb.jp/mappings/' }
  });

  
  function getData(err, doc) {
    if (err) {
      console.log("Erreur lors du parcours du fichier");
    }
    doc.forEach(function(row, index) {

      if(index == 0) { //First line : we get the headers
        sourceFrom = row[0].formatId();
        sourceTo = row[1].formatId();
      }

      else if(index == doc.length-1) { // Last line
        writer.end(function (error, result) {
          writeToFile(result, sourceFrom+"_"+sourceTo+".ttl");
        });
      }

      else {
        var idFrom = row[0];
        var idTo = row[1];
        writer.addTriple({
          subject:   'http://biodb.jp/mappings/'+sourceFrom+'/'+idFrom,
          predicate: 'http://biodb.jp/mappings/to_'+sourceTo,
          object:    'http://biodb.jp/mappings/'+sourceTo+'/'+idTo
        });

        writer.addTriple({
          subject:   'http://biodb.jp/mappings/'+sourceTo+'/'+idTo,
          predicate: 'http://biodb.jp/mappings/to_'+sourceFrom,
          object:    'http://biodb.jp/mappings/'+sourceFrom+'/'+idFrom
        });

      }
    })
  }
}

function writeToFile(data, fileName) {
  fs.writeFile("./"+fileName, data, function(err) {
    if(err) {
      console.log(err);
    }
    console.log("Fichier créé : "+fileName);
  });
}
