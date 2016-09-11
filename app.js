request = require("request"),
    cheerio = require("cheerio"),
    log = require("./libs/logs")(module),
    url = "https://www.livelib.ru/book/1000223426";

request(url, function (error, response, body) {
    if (!error) {
        var $ = cheerio.load(body);
        //collect information about book
        var bookname = $('span[itemprop="name"]').text();
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
                    element = element.replace(/:\s/g, '')
                })
                return arr;
            }
            for (i=0; i < key.length; i++) {
                edition[key[i]] = value(data)[i];
            }
            return edition;
        };
        // create object with all information about book
        var book = {
              bookname: bookname,
              author: author,
              genre: genre,
              data: editionObject(editionData),
              description: description
        }
        console.log(book);
    } else {
        console.log("Произошла ошибка: " + error);
    }
});
