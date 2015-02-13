var mongoose = require('mongoose');
var crypto = require('crypto');

var oid = mongoose.Schema.Types.ObjectId;

// based on https://github.com/madhums/node-express-mongoose-demo/blob/master/app/models/user.js

var userSchema = new mongoose.Schema({
    firstName: { type: String, validate: [oodv('firstName'), 'First Name is required.'], default: null },
    lastName: { type: String, validate: [oodv('lastName'), 'Last Name is required.'], default: null},
    //username: { type: String, required: [ood('username'), '"{PATH}" is required for non-device accounts.'], default: null  },
    username: { type: String, validate: [oodv('username'), '"{PATH}" is required for non-device accounts.'], default: null  },

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
    active: {type: Boolean, default: true},

    status: {type: String, enum: ['available', 'busy', 'offline', 'break'], default: 'offline'}
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

userSchema
    .virtual('isCustomer')
    .get(function(){
        return this.role === 'customer' || this.role === 'device';
    });

userSchema
    .virtual('isEmployee')
    .get(function(){
        return !this.isCustomer;
    });

userSchema.path('device').validate(function(value){
    return this.role !== 'device' || value;
});

userSchema.pre('save', function(next){
    if(this.role === 'device'){
        console.log('clearing');
        this.username = undefined;
        this.firstName = undefined;
        this.lastName = undefined;        
    }
    next();
})

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

function ood(name){
    
    return function isFieldRequired(value){    
        var required = this.role !== 'device';
        // var required = (this.role === 'device') || value; 
        //console.log('ood.' + name + ': role: ' + this.role + ' required: ' + required);
        // return isValid;
        return required;
    }
}
function oodv(name){
    return function optionalOnDevice(value){    
        var isValid = (this.role === 'device') || !!value; 
        //console.log('oodv.' + name + ': role: ' + this.role + ' valid: ' + isValid);
        return isValid;
    }
}

module.exports = mongoose.model('User', userSchema);