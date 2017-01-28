// nvm install 7.3.0
const request = require('request')
    , cheerio = require('cheerio')
    , schedule = require('node-schedule')
    , logger = require('./logger')('cheerio-MFA-parser')
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
            logger.info('proceed to recovery keywords: ', keywords);

            return;
        } else {
            logger.log("Fail enter to my MFA - .....is magic!");
            return false;
        }
    });
}

//
// RUN CASPER-SEO-HUNTER:
//     
var fromCasper = '';
var casper = exec('casperjs casper-SEO-hunter.js');
casper.stdout.on('data', function (data) {
    fromCasper += data;
    console.log(data);
});
casper.stdout.on('close', () => {
    if (-1 === fromCasper.lastIndexOf('~~Emty links aray~~')) {
        // keyword
        let cutWordFrom = fromCasper.indexOf('<keyword>') + 9
            , cutWordTo = fromCasper.indexOf('<keyword/>')
            , keyword = fromCasper.substring(cutWordFrom, cutWordTo);
        // urls
        let cutFrom = fromCasper.indexOf('<cut>') + 5
            , cutTo = fromCasper.indexOf('<cut/>')
            , urlAdressStorage = fromCasper.substring(cutFrom, cutTo).split(',');
        logger.info('FROM CUSPER urlAdressStorage: ', { [keyword]: urlAdressStorage });
        takeContentForMFA({ [keyword]: urlAdressStorage });
        // urls
    } else {
        console.log('Casper failure.....');
        process.exit();
    }
});
//
//
//
function takeContentForMFA(urlAdressStorage) {
    const P_length = 16, H1_length = 6, H2_length = 12, _IMGsrc_length = 4;
    var forReturnContentObject = {};

    for (word in urlAdressStorage) {
        var currencyWordURLs = urlAdressStorage[word];

        for (let i = 0; i < currencyWordURLs.length; i += 1) {


            request({
                url: currencyWordURLs[i],
                method: 'GET',
                timeout: 20000,
                //headers: custom_headers
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    const $ = cheerio.load(body);
                    if (!$('body ').length) {
                        logger.log('Wrong website encoding');
                        return;
                    }
                    forReturnContentObject[word] = getNeedfulHTMLements($);
                    console.log(" ! proceed to scrape content", forReturnContentObject);
                } else {
                    logger.log("Can't load site to scraping ;( ");

                }
            });


        }
        console.log(`NEXT STEP ==>> ${word} !`);
    }

    logger.info("I'm successful scrape all content :-) ", forReturnContentObject);
    fs.writeFile('./content/scrappy__' + new Date() + '.js', util.inspect(forReturnContentObject, false, 4, false), (err) => {
        if (err) throw err;
        console.log('WoW! scraping content saved!');
    });
    /*fs.createWriteStream(`content/${word}.js`, {
        flags: 'w',
        defaultEncoding: 'utf8',
        fd: null,
        mode: 0o666,
        autoClose: true
    });*/
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





takeKeywordsForMFA("http://web-dreamteam.com");