var fs = require("fs");
var tress = require('tress');
var log = require("./libs/logs")(module);
var request = require("request");
var Nightmare = require('nightmare');


var URL = 'https://www.livelib.ru/book/1000223426'
var results = [];

//wrtite results to file
function writeData(file, text) {
    var writeStream = fs.createWriteStream(file, {flags: 'w'});
    writeStream.write(JSON.stringify(text, null, 4));
    writeStream.on('error', function (err) {throw err;});
    writeStream.end();
    writeStream.on('finish', function () {
        log.info('complete adding new item to: '+file);
    });
};
// collect information from pagegit status
function collectInformation() {
    var bookname = $('h1#book-title').text();
    var author = $('.author-name[itemprop="author"]').text();
    var description = $('[itemprop="description"]').text();
    var genre = $('li.standart').text();
    var editionData = $('div.edition-data').text().replace(/\s{2,}/g, ' ')
      .replace(/\r\n+|\r+|\n+/g, '');
    //collect edition data headers and their values
    var editionObject = function(data){
        var edition = {};
        // define headers
        var key = data.match(/[\wа-я]+:/gi);
        //define values without ": "
        var value = function(data){
            var arr = data.match(/:\s[\wа-я-]+/gi);
            arr.forEach(function(element){
                element = element.slice(0, 2);
            })
            return arr;
        }
        if (key!=null && value!=null) {
            for (i=0; i < key.length; i++) {
                edition[key[i]] = value(data)[i].replace(/:\s/g, '');
            }
        }
        return edition;
    };
    //collect book cover
    var bookimage = $('#main-image-book').attr('src');
    // create object with all information about book
    var book = {
          bookname: bookname,
          author: author,
          genre: genre,
          year: editionObject(editionData)['издания:'],
          text: description,
          bookimage: bookimage
    }
    var urls = [];
    var url = $('div.title>a').each(function(){
        var url = 'https://'+location.host+$(this).attr('href');
        var link = url.match(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})(\/book\/\d+)*\/?$/)
        if (link!=null) {
            urls.push(link[0])
        }
    })
    var result = {
        book: book,
        urls: urls
    }
    return result;
}

function crawlSite(url, callback) {
    var nightmare = Nightmare(
        // use if you want to see process
        //{ show: true }
    );
    //call new nightmare object
    nightmare
        .viewport(800, 600)
        .useragent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36')
        .goto(url)
        .wait()
        .inject('js', 'jquery.slim.min.js')
        .evaluate(
            //insert our script on page
            collectInformation
        )
        .end()
        .then(function (result) {
            callback(result);
        })
        .catch(function (error) {
            log.error('Search failed:', error);
        });
}

function sendBook(book) {
    // get bookcover by src
    book.bookimage = request(book.bookimage);
    //send new book to Polka
    request.post({url:'http://localhost:8000/addbook', formData: book}, function(err, httpResponse, body) {
      if (err) {
        return log.error('upload failed:', err);
      }
      log.alert('Upload successful!  Server responded with:', body);
    });
}

var q = tress(function (url, callback) {
        crawlSite(url, function(result){
            sendBook(result.book);
            //results.push(result.book);
            log.notice('new book: '+result.book.bookname)
            // заглушка
            if (q.finished.length < 50) {
                q.push(result.urls, function (err) {
                    if (err) throw err;
                    log.info('urls: '+result.urls.join('\n'));
                });
            }
        });
        callback();
}, -5000);

//write to file when queue is empty
q.drain = function (){
    log.warning('done!')
    writeData('./data.json', results);
}

// errrrr
q.error = function (err){
    log.error(err);
};

//start func with first url
q.push(URL);
