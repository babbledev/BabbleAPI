const mongoose = require("mongoose");
const async = require('async');
const redisScan = require('redisscan');
const bcrypt = require('bcrypt-nodejs');
const uuidv4 = require('uuid/v4');

const User = mongoose.model('user');
const Post = mongoose.model('post');

const USER_SESSION_LENGTH = 60 * 60 * 24 * 30; //30 days

module.exports = function(app, redisClient, common) {
    let module = {};
    let validate = require('./auth/validate')(redisClient);

    app.get('/posts', validate.user, (req, res) => {
        if (!(req.query.lat && req.query.lon)) {
            res.status(500).json({ error: 'Missing required query strings' });
            return;
        }

        let lattitude = parseFloat(req.query.lat);
        let longitude = parseFloat(req.query.lon);

        console.log([lattitude, longitude]);

        Post.find(
            { loc: { $near: [lattitude, longitude], $maxDistance: 10 } }
        ).sort({ posted: 1 }).limit(20).exec((err, posts) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: 'Error retreiving latest posts.' });
                return;
            }

            res.json({ posts: posts });
        })
    })

    return module;

};
