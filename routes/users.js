const mongoose = require("mongoose");
const async = require('async');
const redisScan = require('redisscan');
const bcrypt = require('bcrypt-nodejs');
const uuidv4 = require('uuid/v4');

const User = mongoose.model('user');
const Server = mongoose.model('server');

module.exports = function(app, redisClient, common) {

    let module = {};

    module.generateNewUserSession = function(user, callback) {
        //redis key
        let token = uuidv4();

        //user info stored in redis
        let data = {
            _id: user._id,
            token: token
        }

        redisClient.setex("user-session-" + token, 60 * 100000, JSON.stringify(data), function (err, response) {
            if (err) console.log(err);
            console.log('generated new session id: ' + token);

            callback(data);
        });
    };

    app.post('/users/login', function(req, res, next) {
        User.findOne({device_id: req.body.deviceId}, function(err, user) {
            if(!user) {
                user = new User({
                    deviceId: req.body.device_id,
                    registered: new Date().getTime(),
                    lastLogin: new Date().getTime()
                });
                user.save(function(err) {
                    if(err) console.log(err);
                    servers.createServerWithRandomName(user, function(server) {
                        //this needs to match the session serialized server object
                        //for now we can just assign like this since we just need _id and name.
                        user.server = server;

                        module.generateNewUserSession(user, function(data) {
                            res.json(data);
                        });
                    });
                })
            } else {
                module.generateNewUserSession(user, function(data) {
                    res.json(data);
                })
            }
        });
    });

    return module;

};
