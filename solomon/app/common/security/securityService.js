angular.module('app.security', [])
    .factory('securityService', securityService);

/* @ngInject */
function securityService(storageService, $state, httpClient, $q) {

    var _currentUser = null;

    var service = {
        requestCurrentUser: _requestCurrentUser,

        login: _login,
        logout: _logout
    }

    return service;


    function _requestCurrentUser() {

        if (_currentUser)
            return $q.when(_currentUser);



        return httpClient.get('/tokens/current')
        .then(function (response) {

        })
    }

    function _login(username, password, persist) {
    };

    function _logout() {
        storageService.remove('token');
        $state.go('login');
    }
}