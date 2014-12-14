var mongoose = require('mongoose');
var crypto = require('crypto');

// based on https://github.com/madhums/node-express-mongoose-demo/blob/master/app/models/user.js

var userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: false },
    
    password_hash: { type: String, required: true },
    password_salt: { type: String }
});

userSchema
.virtual('password')
.set(function (password) {
    this._password = password;
    this.password_salt = this.makeSalt();
    this.password_hash = this.encryptPassword(password);
})
.get(function () { return this._password });

userSchema.methods = {
    
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.password_hash;
    },
    
    makeSalt: function () {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    },
    
    encryptPassword: function (password) {
        if (!password) return '';
        try {
            return crypto
        .createHmac('sha1', this.password_salt)
        .update(password)
        .digest('hex');
        } catch (err) {
            return '';
        }
    }
};


module.exports = mongoose.model('User', userSchema);