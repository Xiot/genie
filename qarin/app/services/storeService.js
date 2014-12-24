angular.module('qarin')
    .factory('storeService', StoreService);


/* @ngInject */
function StoreService(geoLocation, httpClient) {

    var _current = null;

    var service = {        
        getCurrentStore: _getCurrentStore,        
    };

    Object.defineProperty(service, 'current', {
        get: function () { return _current; },
        enumerable: true
    });

    return service;

    function _getCurrentStore() {

        return geoLocation.getGps()
            .then(function (gps) {

                var params = {
                    lat: gps.coords.latitude,
                    lng: gps.coords.longitude
                };

                return httpClient.get('/locations', { params: params })
                    .then(function (response) {
                        if (response.data.length >= 1) {
                            _current = response.data[0];
                        }
                        return _current;
                    });
            });
    }

}