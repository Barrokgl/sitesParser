var winston = require('winston');

function getLogger(module) {

    var path = module.filename.split('/').slice(-2).join('/');

    return new (winston.Logger)({
        levels: winston.config.syslog.levels,
        colors: winston.config.syslog.colors,
        transports: [
            new winston.transports.Console({
                colorize: true,
                label: path
            })
        ]
    })
}

module.exports = getLogger;
    // levels
    // emerg: 0
    // alert: 1
    // crit: 2
    // error: 3
    // warning: 4
    // notice: 5
    // info: 6
    // debug: 7
