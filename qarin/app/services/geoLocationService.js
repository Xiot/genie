angular.module('qarin')
.factory('geoLocation', GeoLocationService);

// @ngInject
function GeoLocationService($q, $window, $rootScope) {

    var watcherCount = 0;

    return {
        getGps: _currentPosition,
    };

    function _currentPosition() {

        if (!$window.navigator.geolocation)
            return $q.reject('GPS is not available on your device.');

        var defer = $q.defer();
        $window.navigator.geolocation.getCurrentPosition(function (pos) {
            $rootScope.$apply(function () { defer.resolve(pos); });
        }, function (ex) {

            $rootScope.$apply(function () {

                switch (ex.code) {
                    case 1: return defer.reject('Permission Denied');
                    case 2: return defer.reject('Position Unavailable');
                    case 3: return defer.reject('Timeout');
                    default: return defer.reject('Unkown');
                }

            });
        });
        return defer.promise;
    }

}
