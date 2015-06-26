var fs = require('fs');
var csv = require('csv-streamify');
var N3 = require('n3');

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
var sourceFrom;
var sourceTo;
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
      console.log("On est à la fin du fichier !");
      writer.end(function (error, result) {
        console.log(result);
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
