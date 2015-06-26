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

    if(index == 0) {
      sourceFrom = row[0];
      sourceTo = row[1];
    }

    else if(index == doc.length-1) {
      writer.end(function (error, result) {
        writeToFile(result, sourceFrom+"_"+sourceTo+".ttl");
      });
    }

    else {
      var idFrom = row[0];
      var idTo = row[1];
      writer.addTriple({
        subject:   'http://biodb.jp/mappings/'+sourceFrom+'/'+idFrom,
        predicate: 'http://biodb.jp/mappings/to'+sourceTo,
        object:    'http://biodb.jp/mappings/'+sourceTo+'/'+idTo
      });

    }
  })
}

fstream.pipe(parser);
