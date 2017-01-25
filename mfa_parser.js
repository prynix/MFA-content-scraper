const request = require('request')
    , cheerio = require('cheerio')
    , schedule = require('node-schedule')
    , logger = require('./logger')('cheerio-MFA-parser')
    , exec = require('child_process').exec;
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

function generateNewUserAgent() {
    var version1 = (Math.random() * 1000).toFixed(2).toString();
    var version2 = (Math.random() * 10000).toFixed(3).toString();
    return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/' + version1 + ' (KHTML, like Gecko) Chrome/51.0.' + version2 + ' Safari/' + version1;
}



function takeKeywordsForMFA(MFA_URI) {
    request({
        url: MFA_URI,
        method: 'GET',
        timeout: 10000,
        headers: custom_headers
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(body);
            let keywords = [];
            $('header nav a').each(function () {
                keywords.push($(this).text())
            });
            logger.info('proceed to recovery keywords: ', keywords);
            return keywords;
        } else {
            logger.log("Fail enter to my MFA - .....is magic!");
            return false;
        }
    });
}

let testArray = {
    "insurance": [
        "http://www.nasdaq.com/"
    ]
}


function takeContentForMFA(urlAdressStorage = JSON.parse(urlAdressStorage)) {
    const P_length = 16, H1_length = 6, H2_length = 12, IMGsrc_length = 4;
    var forReturnContentObject = {}, _H1 = {}, _H2 = {}, _P = {}, IMGsrc = {};

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
                    console.log(" ! proceed to scrape content");


                    forReturnContentObject[word] = {

                    };
                    //continue op;
                } else {
                    logger.log("Can't load site to scraping ;( ");
                    //continue op;
                }
            });


        }
    }

    logger.info("I'm successful scrape all content :-) ");
    return forReturnContentObject;
}





//takeKeywordsForMFA("http://web-dreamteam.com");
takeContentForMFA(testArray);