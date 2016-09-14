var fs = require("fs"),
    resolve = require('url').resolve;
    request = require("request"),
    cheerio = require("cheerio"),
    tress = require('tress');
    log = require("./libs/logs")(module);

var URL = "https://www.livelib.ru/book/1000975611";
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
//parse site and add urls of new books
function parseSites(URL, callback) {
    request(URL, function (error, response, body) {
        if (!error) {
            var $ = cheerio.load(body);
            //collect information about book
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
            // here goes magic
            // create object with all information about book
            var book = {
                  bookname: bookname,
                  author: author,
                  genre: genre,
                  year: editionObject(editionData)['издания:'],
                  text: description
            }
            var urls = [];
            var url = $('div.title>a').each(function(){
                var url = resolve(URL, $(this).attr('href'));
                var link = url.match(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})(\/book\/\d+)*\/?$/)
                if (link!=null) {
                    urls.push(link[0])
                }
            })
            callback(book, urls);
        } else {
            log.error("Произошла ошибка: " + error);
        }
    });
}

// create handler for our urls
var q = tress( function(url, callback){
    parseSites(url, function(book, urls){
        results.push(book);
        //notification of new added book
        log.notice('new book: '+book.bookname)
        //заглушка
        if (q.finished.length < 30) {
            //add urls to queue
            q.push(urls, function (err) {
                if (err) throw err;
                log.info('urls: '+urls.join('\n'));
            });
        }
    });
    callback();
//concurency
}, -10000);

//write to file when queue is empty
q.drain = function (){
    writeData('./data.json', results);
}

// errrrr
q.error = function (err){
    log.error(err);
};

//start func with first url
q.push(URL);
