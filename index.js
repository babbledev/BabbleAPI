const express = require('express');
config = require('./config.json');
const bodyParser = require('body-parser');
const logger = require('morgan');
const app = express();

const redis = require('redis');
const redisClient = redis.createClient({
    password: config.redis.password
});

const mongoose = require('mongoose');
mongoose.connect(config.mongo, {
    useMongoClient: true
});

// Mongoose Models
require('./models/models.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, x-access-token, Content-Type, Accept, Authorization");
    next();
});

// Routes
users = require('./routes/users')(app, redisClient);
posts = require('./routes/posts')(app, redisClient);

const port = config.port;

app.listen(process.env.PORT || port);

console.log('API server started on port ' + port);