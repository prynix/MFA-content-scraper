/*
casperjs casper-SEO-hunter.js
*/

var casper = require('casper').create({
    waitTimeout: 15000,
    stepTimeout: 15000,
    pageSettings: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0",
        loadImages: false,        // The WebPage instance used by Casper will
        loadPlugins: false         // use these settings
    },
    logLevel: "debug",              // Only "info" level messages will be logged
    verbose: true                  // log messages will be printed out to the console
});

const keywords = [
    "Insurance",
    "Loans",
    "Mortgage",
    "Attorney",
    "Credit",
    "Lawyer",
    "Donate",
    "Degree",
    "Hosting",
    "Claim",
    "Startups"
];
var currency = 0;

var forReturnUrlAdressStorage = {};

function getLinks() {
    var links = document.querySelectorAll('h3.r a');
    return Array.prototype.map.call(links, function (e) {
        return e.getAttribute('href');
    });
}



casper.start('http://google.com', function () {
    this.waitForSelector('form[action="/search"]');
});

casper.then(function () {
    this.fill('form[action="/search"]', { q: keywords[currency] }, true);
});

casper.then(function () {
    links = this.evaluate(getLinks);
    this.echo('<cut>' + links + '<cut/>');
});

//casper.exit();

casper.run();
