
if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) == str;
    };
}

if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str) {
        return this.slice(-str.length) == str;
    };
}

if (typeof String.prototype.snakeCase != 'function') {
    String.prototype.snakeCase = function (separator) {
        var SNAKE_CASE_REGEXP = /[A-Z]/g;

        separator = separator || '-';
        return this.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
            return (pos ? separator : '') + letter.toLowerCase();
        });
    }
}

if (typeof String.prototype.contains != 'function') {
    String.prototype.contains = function (substring) {
        return this.indexOf(substring) !== -1;
    }
}
