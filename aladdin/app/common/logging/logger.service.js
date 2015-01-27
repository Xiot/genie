
angular.module('aladdin.logging')
    .service('logger', loggerService);

// @ngInject
function loggerService($log) {

    var service = {
        info: info,
        warning: warning,
        error: error,
        log: $log
    };

    return service;


    function info(message, data) {
        $log.info('Info: ' + message, data);
    }

    function warning(message, data) {
        $log.info('WARNING: ' + message, data);
    }

    function error(message, data) {
        $log.error('ERROR: ' + message, data);
    }
}