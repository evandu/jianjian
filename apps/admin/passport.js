
'use strict';

const co            = require('co');           // generator async control flow goodness
const passport      = require('koa-passport'); // authentication
const bcrypt        = require('co-bcrypt');    // bcrypt library
const LocalStrategy = require('passport-local').Strategy;

const User = require('../../models/user.js');


passport.serializeUser(function(user, done) {
    done(null, user.UserId);
});



passport.deserializeUser(function(id, done) {
    co(function*() {
        const user = yield User.get(id);
        return user || null;
    }).then(function(result) { done(null, result); }, done);
});


passport.use(new LocalStrategy(function(username, password, done) {
    co(function*() {
        const users = yield User.getBy('Email', username);
        if (users.length == 0) return false; // user not found
        const user = users[0];

        // verify password matches
        const match = yield bcrypt.compare(password, user.Password);
        if (!match) return false; // no password match

        // validated ok, record return user details
        return user;
    }).then(function(result) { done(null, result); }, done);
}));
