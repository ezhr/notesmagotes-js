var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
	title: {type: String, required: true},
	note: String,
	userId: {type: String, required: true},
	username: {type: String, required: true}
});

module.exports = mongoose.model('Note', Schema);