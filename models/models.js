const mongoose = require('mongoose');
const async = require('async');

const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const User = new Schema({
    deviceId           : String,
    registered         : Number,
    lastLogin          : Number
});
mongoose.model('user', User);

const ServerPlugin = new Schema({
    name: String,
    platform: String,
    description: String,
    version: String,
    file_name: String,
    last_updated: Number,
    disabled: Boolean
});
mongoose.model('server_plugin', ServerPlugin);

const Server = new Schema({
    owner               : ObjectId,
    name                : String,
    name_lower          : String,
    creation            : Number,
    last_online         : Number,

    installed_plugins   : [ObjectId],

    perform_world_reset : String
});

Server.methods.toJSON = function() {
    let server = this.toObject();

    if(server.rank) {
        server.rank_full = servers.ranks[server.rank];
    } else {
        server.rank_full = servers.ranks.DEFAULT;
    }
    return server;
};

mongoose.model('server', Server);

const ServerUptime = new Schema({
    server          : ObjectId,
    date            : String,
    time            : Number
});
mongoose.model('server_uptime', ServerUptime);
