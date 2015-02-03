var mongoose = require('mongoose');
var crypto = require('crypto');

var oid = mongoose.Schema.Types.ObjectId;

// based on https://github.com/madhums/node-express-mongoose-demo/blob/master/app/models/user.js

var userSchema = new mongoose.Schema({
    firstName: { type: String, validate: [optionalOnDevice, 'First Name is required.'] },
    lastName: { type: String, validate: [optionalOnDevice, 'Last Name is required.'], required: true  },
    username: { type: String, required: [optionalOnDevice, '{PATH} is required.']  },
    email: { type: String, required: false },
    
    password_hash: { type: String, required: false },
    password_salt: { type: String },
    
    role: { 
        type: String, 
        enum: ['admin', 'org_admin', 'store_admin', 'employee', 'customer', 'device'], 
        required: true 
    },
    auth: {
        orgs: { type: [oid], ref: 'Organization' },
        stores: { type: [oid], ref: 'OrganizationLocation' }
    },

    store: {type: oid, ref: 'OrganizationLocation'},
    departments: [{type: oid, ref: 'Department'}],
    
    device: {type: String},
    position: String,
    active: {type: Boolean, default: true}
});

userSchema
    .virtual('password')
    .set(function (password) {
        this._password = password;
        this.password_salt = this.makeSalt();
        this.password_hash = this.encryptPassword(password);
    })
    .get(function () { return this._password });

userSchema
    .virtual('authType')
    .get(function(){
        return this._authtype;
    })
    .set(function(value){
        this._authtype = value;
    });

userSchema.path('device').validate(function(value){
    return this.role !== 'device' || value;
});

userSchema.options.toJSON = {
  transform: function(user) {
    
    var obj = user.toObject();
    delete obj.password_hash;
    delete obj.password_salt;
    delete obj.__v;
    return obj;
  }
};

userSchema.methods = {
    
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.password_hash;
    },
    
    makeSalt: function () {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    },
    
    encryptPassword: function (password) {
        if (!password)
            return '';

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


function optionalOnDevice(value){

    var isValid = (this.role === 'device') || value; 
    return isValid;
}

module.exports = mongoose.model('User', userSchema);