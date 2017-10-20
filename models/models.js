const mongoose = require('mongoose');
const async = require('async');

const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const User = new Schema({
    deviceId           : String,
    registered         : Number,
    lastLogin          : Number,
    posts              : [ObjectId]          
});
mongoose.model('user', User);

const Post = new Schema({
    content: String,
    author: ObjectId,
    comments: [ObjectId],
    loc: { type: { type: String }, coordinates: [Number] },

    bearings: Number,
    posted: Number,
    lastComment: Number,
    lastVote: Number
})
mongoose.model('post', Post);

const Comment = new Schema({
    content: String,
    author: ObjectId,
    post: ObjectId,
    loc: { type: { type: String }, coordinates: [Number] },

    bearings: Number,
    posted: Number,
    lastVote: Number
})
