#! /usr/bin/env node

var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var csv = require('csv-streamify');
var unzip = require('unzip2');
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
var download_dir = './downloads/';
var extract_dir = './raw/';

String.prototype.formatId = function() { //Removes the cco and other sources indications
  return this.replace(/^.+_(.+_id)\b/,"$1"); // Returns [source]_id
};

var zipPattern = new RegExp(/(.zip)$/);

function recursiveUnzip(filesArray, i,callback) {
  var f = filesArray[i];
  if(i!=filesArray.length && f.match(zipPattern)){
    console.log("Unzipping "+f);
    var unzipStream = fs.createReadStream(download_dir+f).pipe(unzip.Extract({path: extract_dir}));
    unzipStream.on('close',function () { //NOT finish, else the subsequent function won't launch
        i++;
        recursiveUnzip(filesArray,i,callback);
    })
  }
  else {
    callback();
  }
}

fs.readdir(download_dir, function(err, files){
  if(err) {
    console.log(err);
  }
  recursiveUnzip(files,0,function () {
    console.log("Unzipping done");
    filesEvent.emit('files_unzipped');
  });
});

filesEvent.on('files_unzipped', function () {
  console.log("On va dans le dossier ./raw/");
  fs.readdir('./raw', function(err, files) {
    if(err) {
      console.err(err);
    }
    files.forEach(function(file) {
      filesList.push(file);
      console.log(file)
    });
    filesEvent.emit('files_ready');
  });
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
