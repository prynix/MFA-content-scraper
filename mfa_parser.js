// nvm install 7.3.0
const request = require('request')
    , cheerio = require('cheerio')
    , schedule = require('node-schedule')
    , exec = require('child_process').exec
    , fs = require('fs')
    , util = require('util');
/*
Задача:
0) У всех MFA сайтов будет одинаковый скелет
1) Передаётся единственным аргументом URL сайта для которого надо насосать контент
2) Cheerio/request идёт на него и берёт из тега "nav > a" слова для поиска.
3) Далее PhantomJS для каждого слова из массива:  забивает их в гугл и тырит их URL-адреса(leng >= 10).

4) Далее request/cheerio parser для каждого URL-адреса из массива:
     GET=> там он берёт 16 тегов "P"(length>=400), 6 тегов h1, 12 тегов H2, 4 атрибута [src] тега IMG.
     Как всё это наберёт - уйдёт и сохранит в JSON-объект, и по Inter Process Communication (IPC) 
     запустит ф-ю обновления контента MFA сайта(argument[0]).     

~P.S: по уму на бэкенде у каждого такого сайта должен быть фантом, который накручивает клики, трафик, сосёт контент     
*/

var custom_headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'deflate, gzip;q=1.0, *;q=0.5',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cache-Control': 'max-age=0, no-cache, no-store',
    'Connection': 'keep-alive',
    'Referer': 'http://web-dreamteam.com',
    'Cookie': '',
    'Host': '',
    'User-Agent': generateNewUserAgent()
};



function takeKeywordsForMFA(MFA_URI) {
    new Promise(function (resolve, reject) {
        request({
            url: MFA_URI,
            method: 'GET',
            timeout: 10000
            //headers: custom_headers
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                const $ = cheerio.load(body);
                let keywords = [];
                $('header nav a').each(function () {
                    keywords.push($(this).text())
                });
                return resolve(keywords);
            } else {
                return reject();
            }
        });
    }).then(function (success) {
        console.log('proceed to recovery keywords: ', success);
        fs.writeFileSync('./keywords.js', `module.exports = ${util.inspect(success, false, 2, false)}`);
        // RUN CASPER-SEO-HUNTER:
        //exec('casperjs casper-SEO-hunter.js');
    }, function (error) {
        console.log("Fail enter to my MFA - .....is magic!");
    });

}





var counter = {
    dynamic: 0
}
// Запускает для JSON'a, который вернул каспер:
function* serialManiacContentParser() {
    let parsMetadataStorage = require('./content/urls.js');
    counter.static = parsMetadataStorage.length * 10;
    for (let i = 0; i < parsMetadataStorage.length; i += 1) {
        yield* takeContentForMFA__byCasperReturnedJSON(parsMetadataStorage[i]);
    }
}
function* takeContentForMFA__byCasperReturnedJSON(parseObject) {
    for (let i = 0; i < parseObject.links.length; i += 1) {
        yield* takeContentForMFA__byURL(parseObject.links[i], parseObject.keyword);
    }
}



// Запускает для каждой URL массива, принадлежащего ключевому слову:
var forReturnContentObject = {};
const P_length = 16, H1_length = 6, H2_length = 12, _IMGsrc_length = 4;

function* takeContentForMFA__byURL(parseURL, keyword) {
    counter.dynamic++;
    console.log('====urlAdressStorage: ', parseURL);
    //new Promise(function (resolve, reject) {
    yield request({
        url: parseURL,
        method: 'GET',
        timeout: 20000,
        //headers: custom_headers
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(body);
            if (!$('body ').length) {
                //console.log('Wrong website encoding');
            }
            // console.log(" ! proceed to scrape content", util.inspect(forReturnContentObject, false, 4, false));
            forReturnContentObject[keyword] = getNeedfulHTMLements($);
        }
    });
    /*
    console.log(counter.dynamic, counter.static)
    if (counter.dynamic == counter.static - 2) {
        fs.writeFile('./content/crawl.js', util.inspect(forReturnContentObject, false, 4, false), (err) => {
            if (err) throw err;
            console.log('WoW! DB saved!');
        });
    }
*/
}


















//
// Utils:
//
function generateNewUserAgent() {
    var version1 = (Math.random() * 1000).toFixed(2).toString();
    var version2 = (Math.random() * 10000).toFixed(3).toString();
    return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/' + version1 + ' (KHTML, like Gecko) Chrome/51.0.' + version2 + ' Safari/' + version1;
}

function getNeedfulHTMLements($) {
    var scrapingOutputs = {
        _H1: [], _H2: [], _P: [], _IMGsrc: []
    };
    $('body h1').each(function () {
        scrapingOutputs._H1.push($(this).text())
    });
    $('body h2').each(function () {
        scrapingOutputs._H2.push($(this).text())
    });
    $('body p').each(function () {
        scrapingOutputs._P.push($(this).text())
    });
    $('body img').each(function () {
        scrapingOutputs._IMGsrc.push($(this).attr('src'))
    });
    return scrapingOutputs;
}





//takeKeywordsForMFA("http://web-dreamteam.com");

var runMFA_Crawler = serialManiacContentParser();
for (let value of runMFA_Crawler) {
    //console.log('value :: ', value);
}
setTimeout(function () {
    fs.writeFile('./content/crawl.js', util.inspect(forReturnContentObject, false, 4, false), (err) => {
        if (err) throw err;
        console.log('WoW! DB saved!');
    });
}, 120 * 1000);