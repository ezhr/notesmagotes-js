# notesmagotes

The purpose of this project is to serve as a proof-of-concept.  It aims to demonstrate the working of a RESTful API from both ends.  The back-end (this) serves up and attends to requests from the Android front-end.  This project is more of a functional one than a production one.

This code is written in node.js and leverages modules such as Express, MongoDB, Mongoose, Body-Parser, and Morgan logger.  The entry-point to starting up this app locally is through index.js.  The app listens on port 3000 as default.

You are free to use this project as-is, or to modify as you see fit after cloning.  This back-end code may be uploaded on your own server and will be functional enough for minor use.  Owing to the nature of this project, it will undergo changes before I am done.

###To-Do:

1. ~~Authentication through JSON tokens for users.~~ Look into Passport as authentication system.
2. Introduction of, deletion of, and changing of current routes as needs arise/change. **ON-GOING**
3. Push-notification support.
4. ~~Interfacing with an actual remote VPS to ensure compatibility.~~
5. ~~Enable regex querying of database to search for imperfect queries of usernames.~~ Note searching (including content) has been implemented, but lacks regex querying.  Will be implemented in a future update.
6. Bug-squashing, mostly error handling without crashing the app.