'use strict';
var fs = require('fs'), Request = require('request'), jQuery = require('cheerio'),
      _keywords = require('./devlibs/keywords.js'), _referers = require('./devlibs/referers.js'), q = 'http://www.bing.com/search?q=',
      _subquerys = [
            '&first=1&FORM=PERE',
            '&first=11&FORM=PERE',
            '&first=21&FORM=PERE1',
            '&first=31&FORM=PERE2',
            '&first=41&FORM=PERE3',
            '&first=51&FORM=PERE4',
            '&first=61&FORM=PERE4',
            '&first=71&FORM=PERE4',
            '&first=81&FORM=PERE4',
            '&first=91&FORM=PERE4'
      ],
      headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US;q=0.8,en;q=0.2',
            'Upgrade-Insecure-Requests': 1,
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
      },
      similarSearches = new Set(), referers = new Set(),
      keywords = new Set(), subquerys = new Set();
_referers.forEach((link) => referers.add(link));
//_keywords.forEach((word) => keywords.add(word));
//_subquerys.forEach((query) => subquerys.add(query));
/*
*
*           Scraper:
*
*/
// <<Похожие поисковые запросы>>
var similarSearchesCrawler = (uri) => {
      return new Promise((resolve, reject) => {
            Request({
                  url: uri,
                  method: 'GET',
                  timeout: 10000,
                  headers: headers
            }, (error, res, body) => {
                  if (!error && res.statusCode === 200) {
                        let $ = jQuery.load(body);
                        $('ul.b_vList li a').each(function () {
                              let uglyHref = $(this).attr('href'), href = uglyHref.substring(uglyHref.indexOf('=') + 1, uglyHref.lastIndexOf('&')).replace(/\+/g, ' ');
                              if (href.length > 3 && href.length < 70) similarSearches.add(href);
                        });
                        return resolve();
                  } else { return reject(error); }
            });
      }).then((success) => { }, (err) => { });
}
// Рефереры и урлы для последующего выдёргивания ключевых слов
var referersScraper = (uri) => {
      return new Promise((resolve, reject) => {
            Request({
                  url: uri,
                  method: 'GET',
                  timeout: 10000,
                  headers: headers
            }, (error, res, body) => {
                  if (!error && res.statusCode === 200) {
                        let $ = jQuery.load(body);
                        $('.b_algo a').each(function () {
                              referers.add($(this).attr('href'));
                        });
                        return resolve();
                  } else { return reject(error); }
            });
      }).then((success) => { }, (err) => { });
}
var getSearchEngineRequest = (uri) => {
      return new Promise((resolve, reject) => {
            request({
                  url: uri,
                  method: 'GET',
                  timeout: 10000
            }, (error, response, body) => {
                  if (!error && response.statusCode === 200) {
                        const $ = cheerio.load(body);
                        let parsedKeywords = [];
                        $('h1').each(function () {
                              let content = $(this).text();
                              if (content.length > 3) parsedKeywords.push(`"${content.replace(/\n/g, '').replace(/\t/g, '').replace('›', '')}"`);
                        });
                        $('h2').each(function () {
                              let content = $(this).text();
                              if (content.length > 3) parsedKeywords.push(`"${content.replace(/\n/g, '').replace(/\t/g, '').replace('›', '')}"`);
                        });
                        $('h3').each(function () {
                              let content = $(this).text();
                              if (content.length > 3) parsedKeywords.push(`"${content.replace(/\n/g, '').replace(/\t/g, '').replace('›', '')}"`);
                        });
                        $('a').each(function () {
                              let content = $(this).text();
                              if (content.length > 3) parsedKeywords.push(`"${content.replace(/\n/g, '').replace(/\t/g, '').replace('›', '')}"`);
                        });
                        $('strong').each(function () {
                              let content = $(this).text();
                              if (content.length > 3) parsedKeywords.push(`"${content.replace(/\n/g, '').replace(/\t/g, '').replace('›', '')}"`);
                        });
                        if (parsedKeywords.length) parsedKeywords.forEach((mean) => keywords.add(mean));
                        return resolve();
                  }
            });
      }).then((success) => { }, (err) => { });
}
/*
*
*/
async function breadwinnerReferers() {
      for (let word of keywords) {
            for (let query of subquerys) await referersScraper(q + word + query);
      }
}
async function breadwinnerKeywords() {
      for (let link of referers) await getSearchEngineRequest(link);
}
async function getSimilarSearches() {
      for (let word of keywords) {
            for (let query of subquerys) await similarSearchesCrawler(q + word + query);
      }
}
/*
*
*/
breadwinnerReferers();
/*
setTimeout(() => {
      fs.writeFile('dumps/newkeywords.js', 'module.exports=[' + require('util').inspect(similarSearches, false, 2, false) + ']', (err) => {
            if (err) {
                  console.error('| save-web-page |  (error)=>   ', err)
            } else {
                  console.log(`The file was saved!`);
            }
      });
}, 4 * 60 * 1000);
setTimeout(() => {
      fs.writeFile('dumps/referers.js', 'module.exports=[' + require('util').inspect(referers, false, 2, false) + ']', (err) => {
            if (err) {
                  console.error('| save-web-page |  (error)=>   ', err)
            } else {
                  console.log(`The file was saved!`);
            }
      });
}, 6 * 60 * 1000);
*/
setTimeout(() => {
      fs.writeFile('dumps/newkeywords.js', 'module.exports=[' + require('util').inspect(keywords, false, 2, false) + ']', (err) => {
            if (err) {
                  console.error('| save-web-page |  (error)=>   ', err)
            } else {
                  console.log(`The file was saved!`);
            }
      });
}, 6 * 60 * 1000);