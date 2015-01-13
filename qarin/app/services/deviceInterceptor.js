
angular.module('qarin.interceptors', [])
	.factory('deviceInterceptor', DeviceInterceptor);

function DeviceInterceptor($q, storageService){
	return {
        request: function(config){

            if(!config || !config.headers)
                return config;

            config.headers['x-device'] = storageService.get('device');
            return config;
        }
    };
}

function addInterceptors($httpProvider){
	$httpProvider.interceptors.push('deviceInterceptor');
}