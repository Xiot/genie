angular.module('app.security', [])
    .factory('securityService', securityService);

/* @ngInject */
function securityService(storageService, $state, httpClient, $q) {

    var _currentUser = null;

    var service = {
        requestCurrentUser: _requestCurrentUser,

        login: _login,
        logout: _logout
    };

    return service;


    function _requestCurrentUser() {

        if (_currentUser)
            return $q.when(_currentUser);

        var defer = $q.defer();

        httpClient.get('/tokens/current')
            .then(function(response) {
                defer.resolve(response.data);
                return response.data;
            }).catch(function(res) {
                if (res.status === 401)
                    return defer.resolve(null);
                defer.reject(res);
            });

        return defer.promise;
    }

    function _login(username, password, persist) {

        var text = btoa(username + ":" + password);
        return httpClient.post('/tokens',null, {auth: {'Basic' : text}})


    }

    function _logout() {
        storageService.remove('token');
        $state.go('login');
    }
}
