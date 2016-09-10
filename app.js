request = require("request"),
    cheerio = require("cheerio"),
    log = require("./libs/logs")(module),
    url = "http://books.imhonet.ru/element/171311/";

request(url, function (error, response, body) {
    if (!error) {
        var $ = cheerio.load(body);
        var textDescription = [];
        var description = $('div.m-elementdescription-info').text();
        console.log(description.split(" "));
    } else {
        console.log("Произошла ошибка: " + error);
    }
});
