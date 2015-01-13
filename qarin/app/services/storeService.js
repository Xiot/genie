angular.module('qarin')
    .factory('storeService', StoreService);


/* @ngInject */
function StoreService(geoLocation, httpClient, $rootScope) {

    var _current = null;
    var availableEvents = ['storeChanged'];

    var service = {        
        getCurrentStore: _getCurrentStore,
        on: _registerListener
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

                            $rootScope.$emit('storeChanged', {store: _current});
                        }
                        return _current;
                    });
            });
    }

    function _registerListener(name, handler){

        if(availableEvents.indexOf(name) === -1)
            throw new Error('The event \'' + name +'\' is not available on storeService.');

        $rootScope.$on(name, handler);
    }
}