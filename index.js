// [SECTION] Dependencies and Modules
require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
// Google Login
// Imports the passport package
const passport = require('passport');
// Package for creating a middleware for sessions
const session = require('express-session');
// Imports the "passport.js file"
require('./passport');
// Allows our backend application to be available to our frontend application
// Allows us to control the app's Cross Origin Resource Sharing settings
const cors = require("cors");
// Allows access to routes defined within our application
const courseRoutes = require("./routes/course");
const userRoutes = require("./routes/user");

// [SECTION] Environment Setup
const port = 4000;

// [SECTION] Server Setup
// Creates an "app" variable that stores the result of the "express" function that initializes our express application and allows us access to different methods that will make backend creation easy
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
// Allows all resources to access our backend application
app.use(cors());

// [Section] Google Login
// Creates a session with the given data
// resave prevents the session from overwriting the secret while the session is active
// saveUninitialized prevents the data from storing data in the session while the data has not yet been initialized
app.use(session({
	secret: process.env.clientSecret,
	resave: false,
	saveUninitialized: false
}));
// Initializes the passport package when the application runs
app.use(passport.initialize());
// Creates a session using the passport package
app.use(passport.session());

//[SECTION] Database Connection 
// Connect to our MongoDB database
mongoose.connect("mongodb+srv://admin:admin123@cluster0.7iowx.mongodb.net/course-booking-API?retryWrites=true&w=majority", {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
// Prompts a message in the terminal once the connection is "open" and we are able to successfully connect to our database
mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'));

//[SECTION] Backend Routes 
//http://localhost:4000/users
// Defines the "/users" string to be included for all user routes defined in the "user" route file
// Groups all routes in userRoutes under "/users"
app.use("/courses", courseRoutes);
app.use("/users", userRoutes);

// [SECTION] Server Gateway Response
// if(require.main) would allow us to listen to the app directly if it is not imported to another module, it will run the app directly.
// else, if it is needed to be imported, it will not run the app and instead export it to be used in another file.
if(require.main === module){
	// "process.env.PORT || port" will use the environment variable if it is available OR will used port 4000 if none is defined
	// This syntax will allow flexibility when using the application locally or as a hosted application
	app.listen(process.env.PORT || port, () => {
	    console.log(`API is now online on port ${ process.env.PORT || port }`)
	});
}

// In creating APIs, exporting modules in the "index.js" file is ommited
// exports an object containing the values of app and mongoose variables only used for grading.
module.exports = {app,mongoose};