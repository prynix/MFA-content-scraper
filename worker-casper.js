//const schedule = require('node-schedule')
const exec = require('child_process').exec;
var scheduleCounter = 0;

function runCrawlers() {
    var process1 = exec('casperjs Y-bot.js');
    var process2 = exec('casperjs Y-bot.js');

    process1.stdout.on('data', function (data) {
        scheduleCounter++;
        //console.log('[process-1]', data.trim());
    });
    process2.stdout.on('data', function (data) {
        scheduleCounter++;
        //console.log('[process-2]', data.trim());
    });
}

/*
schedule.scheduleJob('05 * * * * *', function () {
    console.log("Casper: " + scheduleCounter);
    runCrawlers();
});
*/
setInterval(function () {
    console.log("Casper: " + scheduleCounter);
    runCrawlers();
}, 10 * 1000)