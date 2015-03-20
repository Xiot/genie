
angular.module('qarin.interceptors', [])
	.factory('deviceInterceptor', DeviceInterceptor)
    .config(addInterceptors);

function DeviceInterceptor($q, storageService){
	return {
        request: function(config){

            if(!config || !config.headers)
                return config;

            config.headers['x-device'] = storageService.get('device-id');
            return config;
        }
    };
}

function addInterceptors($httpProvider){
	$httpProvider.interceptors.push('deviceInterceptor');
}
