var express = require('express');
var app = express();
var morgan = require('morgan');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var FCM = require('fcm-node');


var User = require('./models/User');
var Note = require('./models/Note');
var config = require('./config');

mongoose.connect(config.database);
var secret = config.secret;
var serverKey = config.serverKey;
var fcm = new FCM(serverKey);

var port = process.env.PORT || 3000;
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Entry gateway
app.get('/', (req, res) => {
	res.send('Nothing to see here!');
});

var router = express.Router();

mongoose.set('debug', true);

Note.on('index', function(err) {
	if (err) {
		console.error('User index error: %s', err);
	} else {
		console.info('User indexing complete');
	}
});

// ****************
// API ROUTES
// ****************


// API ROUTE ENTRY
router.get('/', (req, res) => {
	res.send('Entry point for API');
});

// Create new user
// Checks if username already exists and informs if it does and creates a new user if username is unique 
// Reroutes to authentication route to authenticate new user and provide token
router.post('/users/new', (req, res) => {
	User.findOne({username: req.body.username}, (err, user) => {
		if (user) {
			res.status(409).json({ success: false, message: 'Username already exists, please choose another.'});
		} else {
			User.create(req.body, (err, user) => {
				if (err)
					res.status(400).json({ success: false, message: err });
				else
					res.status(200).json({ success: true, message: 'User created!' });
			});
		}
	});
});

// Finds username from database, returns error if username is invalid
// If username is valid, checks for similarity of password
// If password is valid, creates new token and sends it back in the response
router.post('/users/authenticate', (req, res) => {
	User.findOne({ username: req.body.username }, (err, user) => {
		if (err) {
			res.json({ success: false, message: err });
			return;
		}
		if (!user) {
			res.status(400).json({ success: false, message: 'User not found!'});
		}
		else {
			if (user.password != req.body.password)
				res.status(400).json({ success: false, message: 'Incorrect password!'});
			else {
				jwt.sign(user, secret, {expiresIn: "2 days"}, (err, token) => {
					if (err) 
						res.status(400).json({ success: false, message: err });
					else {
						res.status(200).json({
							success: true,
							message: 'Signed in!',
							token: token
						});
					}
				});
			}
		}
	});
});


// ****************************************
// MIDDLEWARE
// ****************************************
// 
// -- Routes henceforth authenticated


// Extracts token from header and verifies
// If verified, assigns userID to request to be used in further routes
router.use('/', (req, res, next) => {
	var token = req.headers['x-token'];
	if (!token)
		res.status(401).json({ success: false, message: 'Please sign in!' });
	else {	
		jwt.verify(token, secret, (err, decoded) => {
			if (err)
				res.status(400).json({ success: false, message: err});
			else {
				req.userId = decoded._doc._id;
				req.username = decoded._doc.username;
				console.log(req.username);
				next();
			}
		});
	}
});

// Sets FCM token
router.use('/users/refreshtoken', (req, res) => {
	var fcmToken = req.headers['x-fcm-token'];
	console.log(fcmToken);
	User.findOne({'_id': req.userId}, (err, user) => {
		if (err)
			res.json({ success: false, message: err });
		else {
			user.fcmToken = fcmToken;
			user.save((err) => {
				if (err)
					res.status(400).json({ success: false, message: err });
				else 
					res.status(200).json({ success: true, message: 'Token refreshed successfully'});
			})
		}
	});
});



// Searches for all notes by user using userID
router.get('/notes/all', (req, res) => {
	Note.find({'userId': req.userId}, (err, notes) => {
		if (err) 
			res.json({ success: false, message: err});
		else 
			res.status(200).json(notes);
	});
});


// Saves a new note to the database, using userID as a reference
router.post('/notes/new', (req, res) => {
	var title = req.body.title;
	var	content = req.body.content;
	var	userId;
	var fcmToken;
	if (req.headers['x-user']){
		User.findOne({ username: req.headers['x-user'] }, (err, user) => {
			if (err)
				res.json({ success: false, message: err})
			else {
				fcmToken = user.fcmToken;
				console.log(fcmToken);
				userId = user._id;
				createNote();
			}
		});
	}
	else {
		userId = req.userId;
		createNote();
	}
	function createNote() {
		Note.create({
			title, content, userId
		}, (err, note) => {
			if (err) 
				res.json({ success: false, message: err });
			else {
				res.status(201).json({ success: true, message: 'Note saved!'});
				if (fcmToken) {
					var message = {
						to: fcmToken,
						data: {
							sender: req.username
						}
					}
					fcm.send(message, (err, messageId) => {
						if (err)
							console.log(err);
						else
							console.log(messageId);
					});
				}
			}
		});
	}
});

// Finds an existing post in the database using its objectID, and updates the fields
router.post('/notes/update', (req, res) => {
	Note.findById(req.body._id, (err, note) => {
		note.title = req.body.title;
		note.content = req.body.content;
		note.save((err) => {
			if (err) 
				res.json({ success: false, message: err });
			else 
				res.status(200).json({ success: true, message: 'Note updated!' });
		});
	});
});

router.get('/notes/delete', (req, res) => {
	Note.findByIdAndRemove(req.headers['x-id'], (err) => {
		if (err)
			res.json({ success: false, message: err});
		else
			res.status(200).json({ success: true, message: 'Note deleted!' });
	});
});

router.get('/notes/find', (req, res) => {
	Note.find({ userId: req.userId, $text: { $search: req.headers['x-search']} }).sort('title').exec((err, notes) => {
		if (err)
			res.json({ success: false, message: err });
		else
			res.status(200).json(notes);
	});
});

// Configure router to use /api path
app.use('/api', router);

// Start server
app.listen(port, () => {
	console.log("Server running on port " + port + " ...");
});


// DEPRECATED ROUTES

/*
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



//app.get('/setup', (req, res) => {
    var user = new User({
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
    });
//});
//
*/
