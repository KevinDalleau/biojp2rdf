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
    else {
      var idFrom = row[0];
      var idTo = row[1];
      console.log(sourceFrom+sourceTo);
    }

     })
}
fstream.pipe(parser);
