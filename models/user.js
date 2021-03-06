var mongoose = require('mongoose');

// User Schema
// Fields: username (required), password (required)
var Schema = mongoose.Schema({
	username: {type: String, required: true},
	password: {type: String, required: true},
	fcmToken: String
});

module.exports = mongoose.model('User', Schema);