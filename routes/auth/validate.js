const mongoose = require('mongoose');
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

module.exports = function(redisClient) {
    let module = {};

    module.user = function(req, res, next) {
        let token = req.body.token || req.query.token || req.headers['x-access-token'];

        if(token) {
            redisClient.get('user-session-' + token, function(err, session) {
                if(err) console.log(err);
                session = JSON.parse(session);

                if(session) {
                    req.user = session;
                    req.user._id = new mongoose.Types.ObjectId(req.user._id);

                    next();
                } else {
                    return res.status(401).send({
                        message: "Session expired. Please login."
                    })
                }
            })
        } else {
            return res.status(401).send({
                message: "Session expired. Please login."
            })
        }
    };

    module.internal = function(req, res, next) {
        let token = req.body.token || req.query.token || req.headers['x-access-token'];

        if (token) {
            if(token === config.auth.internal) {
                next(); // good to go
            } else {
                return res.json({error: true}); //token was incorrect.
            }
        } else {
            // failed without token
            console.log("request didn't contain token")
            return res.status(403).send({
                error: true
            });
        }
    };

    return module;

};