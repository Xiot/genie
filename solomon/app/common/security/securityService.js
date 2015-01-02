angular.module('app.security', [])
    .factory('securityService', securityService);

/* @ngInject */
function securityService(storageService, $state, httpClient, $q) {

    var _currentUser = null;

    var service = {
        currentUser: function(){return _currentUser;},
        requestCurrentUser: _requestCurrentUser,

        login: _login,
        logout: _logout
    };

    return service;


    function _requestCurrentUser(token) {

        if (_currentUser)
            return $q.when(_currentUser);


        var options = {
            cache: false
        };
        if (token)
            options.auth = {
                'Bearer': token
            };

        var defer = $q.defer();

        httpClient.get('/tokens/current', options)
            .then(function(response) {

                _currentUser = response.data;

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
        var token = null;

        return httpClient.post('/tokens', null, {
                auth: {
                    'Basic': text
                }
            })
            .then(function(res) {
                token = res.data.auth_token;

                return _requestCurrentUser(token);
            }).then(function(user) {
                storageService.set("auth-token", token, true);
                return user;
            });
    }

    function _logout() {
        storageService.remove('token');
        $state.go('login');
    }
}
