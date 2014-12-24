angular.module('genie.common')
.factory('storageService', StorageService);

/* @ngInject */
function StorageService($window) {

    var _local = $window.localStorage;
    var _session = $window.sessionStorage;

    return {
        get: _get,
        set: _set,
        has: _has,
        remove: _remove
    };


    function _get(key) {

        var sessionValue = _session[key];
        if (_isSet(sessionValue))
            return _safeParse(sessionValue);

        var localValue = _local[key];
        if (_isSet(localValue))
            return _safeParse(localValue);

        return undefined;
    }

    function _set(key, value, persist) {

        if (_isUnset(value))
            return _remove(key);

        var store = !!persist ? _local : _session;
        var json = JSON.stringify(value);
        store.setItem(key, value);
    }

    function _remove(key) {
        delete _local[key];
        delete _session[key];
    }

    function _has(key) {
        return _isSet(_session[key]) || _isSet(_local[key]);
    }


    function _safeParse(jsonText) {
        if (jsonText === undefined || jsonText === null)
            return jsonText;

        if (typeof jsonText !== "string")
            return jsonText;

        if (jsonText.length === 0)
            return jsonText;

        try {
            return JSON.parse(jsonText);
        } catch (e) {
            return jsonText;
        }
    }

    function _isUnset(value) {
        return value === undefined || value === null;
    }

    function _isSet(value) {
        return value !== undefined && value != null;
    }
}
