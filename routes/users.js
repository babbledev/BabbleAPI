const mongoose = require("mongoose");
const async = require('async');
const redisScan = require('redisscan');
const bcrypt = require('bcrypt-nodejs');
const uuidv4 = require('uuid/v4');

const User = mongoose.model('user');

const USER_SESSION_LENGTH = 60 * 60 * 24 * 30; //30 days

module.exports = function(app, redisClient, common) {
    let module = {};
    let validate = require('./auth/validate')(redisClient);

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

    app.post('/users/check_login', validate.user, (req, res, next) => {
        res.json({});
    })

    app.post('/users/login', (req, res, next) => {
        User.findOne({device_id: req.body.deviceId}, (err, user) => {
            if(user) {
                module.generateNewUserSession(user, (data) => {
                    res.json(data);
                })
            } else {
                res.status(401).json({ noAccount: true });
            }
        });
    });

    app.post('/users/register', (req, res, next) => {
        User.findOne({ device_id: req.body.deviceId }, (err, user) => {
            if (!user) {
                user = new User({
                    deviceId: req.body.deviceId,
                    registered: new Date().getTime(),
                    lastLogin: new Date().getTime()
                });
                user.save((err) => {
                    if (err) console.log(err);
                    res.json(data);
                })
            } else {
                module.generateNewUserSession(user, (data) => {
                    res.json(data);
                })
            }
        });
    })

    return module;

};
