const mongoose = require("mongoose");
const async = require('async');
const redisScan = require('redisscan');
const bcrypt = require('bcrypt-nodejs');
const uuidv4 = require('uuid/v4');

const User = mongoose.model('user');
const Post = mongoose.model('post');
const Comment = mongoose.model('comment');

const USER_SESSION_LENGTH = 60 * 60 * 24 * 30; //30 days

module.exports = function(app, redisClient, common) {
    let module = {};
    let validate = require('./auth/validate')(redisClient);

    /**
     * Post Feed
     */
    app.get('/posts', validate.user, (req, res) => {
        if (!(req.query.lon && req.query.lat)) {
            res.status(500).json({ error: 'Missing required query strings' });
            return;
        }

        let longitude = parseFloat(req.query.lon);
        let latitude = parseFloat(req.query.lat);

        console.log([longitude, latitude]);

        Post.find(
            {
                loc: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: 99999999
                    }
                }
            }
        ).sort({ posted: -1 }).limit(20).exec((err, posts) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: 'Error retreiving latest posts.' });
                return;
            }

            res.json({ posts: posts });
        })
    })

    /**
     * New Post
     */
    app.post('/post', validate.user, (req, res) => {
        if (!req.body.content) {
            res.status(500).json({ error: 'Invalid post content' });
            return;
        }

        if (req.body.longitude == null || req.body.latitude == null) {
            res.status(500).json({ error: 'Invalid location.', invalidLocation: true });
            return;
        }

        if (req.body.content.length > 140) {
            res.status(500).json({ error: 'Post too long!', postTooLong: true });
            return;
        }

        console.log('post body: ' + JSON.stringify(req.body));

        let post = new Post({
            content: req.body.content,
            author: req.user._id,
            comments: [],
            loc: {
                type: "Point",
                coordinates: [req.body.longitude, req.body.latitude]
            },

            upvotes: [req.user._id],
            upvoteCount: 1,
            downvotes: [],
            downvoteCount: 0,

            posted: new Date().getTime(),
            lastComment: new Date().getTime(),
            lastVote: new Date().getTime()
        })
        post.save((err) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: 'Failed to save post' });
                return;
            }

            res.json({ post: post });
        })
    })

    /**
     * Upvote
     */
    app.post('/:type/:id/vote', validate.user, (req, res) => {
        let _id = new mongoose.Types.ObjectId(req.params.id);

        let collection;
        if(req.params.type == 'post') {
            collection = Post; 
        } else if (req.params.type == 'comment') {
            collection = Comment;
        } else {
            res.status(401).json({postTypeNotFound: true});
            return;
        }

        collection.findOne({ _id: _id }, (err, post) => {
            if (!post) {
                res.status(400).json({ postNotFound: true });
                return;
            }

            //user already upvoted post
            if (post.upvotes.indexOf(_id) > -1) {
                return res.json({})
                return;
            }

            //user previously downvoted
            if (post.downvotes.indexOf(_id) > -1) {
                collection.update({ _id: _id }, {
                    $addToSet: { upvotes: _id },
                    $inc: { upvoteCount: 1, downvoteCount: -1, bearingsCount: 2 },
                    $pull: { downvotes: _id }
                }, (err) => {
                    User.update({ _id: post.author }, { $inc: { bearings: 2 } }, (err) => {
                        res.json({});
                    })
                })
            } else {
                collection.update({ _id: _id }, {
                    $addToSet: { upvotes: _id },
                    $inc: { upvoteCount: 1, bearingsCount: 1 },
                    $pull: { downvotes: _id }
                }, (err) => {
                    User.update({ _id: post.author }, { $inc: { bearings: 1 } }, (err) => {
                        res.json({});
                    })
                })
            }
        })
    })

    return module;

};
