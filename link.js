var fs = require('fs');
var csv = require('csv-streamify');
var N3 = require('n3');
var sourceFrom;
var sourceTo;

var fstream = fs.createReadStream('./raw/cco_cco_c_id_cco_pharmgkb_id.txt');

var options = {
  delimiter: '\t',
  empty: '',
  columns: false
}

var parser = csv(options, getData);

var writer = N3.Writer({
  prefixes: { 'biodb': 'http://biodb.jp/mappings/' }
});

String.prototype.formatId = function() { //Remove the cco and other sources indications
  return this.replace(/^.+_(.+_id)\b/,"$1"); // Returns [source]_id
};

function writeToFile(data, fileName) {
  fs.writeFile("./"+fileName, data, function(err) {
    if(err) {
      console.log(err);
    }
    console.log("Fichier créé : "+fileName);
  });
}

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

fstream.pipe(parser);
