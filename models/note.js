var mongoose = require('mongoose');

// Note Schema
// Fields: Title (required), content, userId (required)
var schema = new mongoose.Schema({
	title: {type: String, required: true},
	content: String,
	userId: {type: String, required: true},
	date: {type: Date, required: true, default: Date.now()}
});

// Creates index for title & content searching
schema.index({
	title: 'text',
	content: 'text'
});

module.exports = mongoose.model('Note', schema);