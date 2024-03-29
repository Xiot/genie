﻿angular.module('aladdin.security', [])
    .factory('securityService', securityService);

/* @ngInject */
function securityService(storageService, $state, httpClient, $q, util) {

    var _currentUser = null;
    var _listeners = {};

    var service = {
        currentUser: function() {
            return _currentUser;
        },
        requestCurrentUser: _requestCurrentUser,

        on: addListener,

        login: _login,
        logout: _logout
    };

    return service;

    function addListener(eventName, listener) {
        if (!_listeners[eventName])
            _listeners[eventName] = [];
        _listeners[eventName].push(listener);
    }

    function fireEvent(eventName, args) {
        var handler = _listeners[eventName];
        if (!handler)
            return;

        var eventArgs = [].splice.call(arguments, 1);
        handler.forEach(function(cb) {
            cb.apply(this, eventArgs);
        });
    }

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

                //_currentUser = response.data;
                _setUser(response.data);

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

                storageService.set('auth-token', token, false);

                return _requestCurrentUser(token);
            }).then(function(user) {
                storageService.set("auth-token", token, !!persist);
                return user;
            });
    }

    function _logout() {

        var token = storageService.get('auth-token');

        if(!token)
            return $state.go('login');

        storageService.remove('auth-token');
        var url = util.join('tokens', 'current');

        return httpClient.delete(url, {auth: {Bearer: token}})
            .finally(function() {
                $state.go('login');
            });
    }

    function _setUser(user) {
        _currentUser = user;
        fireEvent('userChanged', user);
    }
}