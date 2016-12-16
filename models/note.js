var mongoose = require('mongoose');

// Note Schema
// Fields: Title (required), content, userId (required)
var Schema = new mongoose.Schema({
	title: {type: String, required: true},
	content: String,
	userId: {type: String, required: true}
});

module.exports = mongoose.model('Note', Schema);