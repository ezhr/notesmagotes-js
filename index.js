var express = require('express');
var app = express();
var morgan = require('morgan');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');


var User = require('./models/User');
var Note = require('./models/Note');

var port = process.env.PORT || 3000;
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect("mongodb://localhost/notesmagotes/");

// Entry gateway
app.get('/', (req, res) => {
    res.send('Nothing to see here!');
});

var router = express.Router();

router.get('/', (req, res) => {
    res.send('Entry point for API');
});

// Search for notes by user ID
// TO-DO: Authentication
router.get('/notes/id/:userId', (req, res) => {
	Note.find({'userId': req.params.userId}, (err, notes) => {
		if (err) res.send(err);
 		res.json(notes);
	});
});

// Search for notes by username
// TO-DO: Authentication
router.get('/notes/username/:username', (req, res) => {
	User.findOne({'username': req.params.username}, (err, user) => {
		var id = user._id;
		Note.find({'userId': id}, (err, notes) => {
			if (err) throw(err);
			res.json(notes);
		});
	});
});

// Make a new note
// TO-DO: Must have authentication
router.post('/notes/new', (req, res) => {
	var id = req.body.userId;
	var username;
	User.findOne({'_id': id}, (err, user) => {
		if (err) {
			console.log(err);
			res.status(400).json({status: "FAIL"});
			return;
		} else {
			username = user.username;
			Note.create({
			title: req.body.title,
			note: req.body.note,
			userId: id,
			username: username
			}, (err, note) => {
				if (err) console.log(err);
				res.status(201).json({status: 'SUCCESS'});
			});
		}
	});
});

// Shows all users
// TO-DO: Must have authentication
router.get('/users/all', (req, res) => {
	User.find({}, (err, users) => {
		if(err) console.log(err);
		res.json(users);
	});
});

// Search for user by Id
// TO-DO: Must have authentication
router.get('/users/id/:id', (req, res) => {
	User.findOne({'_id': req.params.id}, (err, user) => {
		if(err) console.log(err);
		res.json(user);
	});
});

// Search for user by username
// TO-DO: Authentication
router.get('/users/username/:username', (req, res) => {
	User.findOne({'username': req.params.username}, (err, user) => {
		if(err) console.log(err);
		res.json(user);
	});
});

// Make a new user
// TO-DO: Must have authentication
router.post('/users/new', (req, res) => {
	User.create(req.body, (err, user) => {
		if (err) console.log(err);
		res.status(201).json({status: 'SUCCESS'});
	});
});


//app.get('/setup', (req, res) => {
    /*var user = new User({
        username: 'ollie',
        email: 'enrichingly@twinebush.com',
        password: 'NpkbeBLHkvcRRelZUmhX'
    });
    user.save((err) => {
        if (err) res.send(err);
        res.json(user);
    });*/

    /*var title = 'sennight';
    var note = 'proper evader eloquence respue endogamous predominate nonascertainable preofficial Iphis avertedly oxbane stratification enphytotic lovelessly fluosilicate outquibble Samhain troublousness Bulgarophil staphyloedema hydrofoil unextenuating blizzardous hemidrachm';
    var userId = '5851d19454f51c08380e3403';
    User.findOne({'_id': userId}, (err, user) => {
    	var username = user.username;
    	Note.create({
    	title: title,
    	note: note,
    	userId: userId,
    	username: username
    }, (err, note) => {
    	if (err) console.log(err);
    	res.json(note);
    });
    });*/
//});

app.use('/api', router);

app.listen(port, () => {
    console.log("Server running on port " + port + " ...");
});