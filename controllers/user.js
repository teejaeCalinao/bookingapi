//[SECTION] Dependencies and Modules
// The "User" variable is defined using a capitalized letter to indicate that what we are using is the "User" model for code readability
const bcrypt = require('bcrypt');
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const auth = require("../auth");

//[SECTION] Check if the email already exists
/*
	Steps: 
	1. Use mongoose "find" method to find duplicate emails
	2. Use the "then" method to send a response back to the client appliction based on the result of the "find" method
*/
module.exports.checkEmailExists = (req,res) => {

	if (req.body.email.includes("@")){
		return User.find({ email : req.body.email })
		.then(result => {

			// The "find" method returns a record if a match is found
			if (result.length > 0) {

				// If there is a duplicate email, send true with 409 http status back to the client
				return res.status(409).send({ error: "Duplicate Email Found" });

			// No duplicate email found
			// The user is not yet registered in the database
			} else {

	            // If there is no duplicate email, send false with 204 http status back to the client
				return res.status(404).send({ message: "Email not found" });

			};
		})
		.catch(err => {
			console.error("Error in find", err)
			return res.status(500).send({ error: "Error in find"});
		});
	} else {
	    res.status(400).send({ error: "Invalid Email"})
	};

};

//[SECTION] User registration
/*
	Steps:
	1. Create a new User object using the mongoose model and the information from the request body
	2. Make sure that the password is encrypted
	3. Save the new User to the database
*/
module.exports.registerUser = (req,res) => {

	// Checks if the email is in the right format
	if (!req.body.email.includes("@")){
	    return res.status(400).send({ error: "Email invalid" });
	}
	// Checks if the mobile number has the correct number of characters
	else if (req.body.mobileNo.length !== 11){
	    return res.status(400).send({ error: "Mobile number invalid" });
	}
	// Checks if the password has atleast 8 characters
	else if (req.body.password.length < 8) {
	    return res.status(400).send({ error: "Password must be atleast 8 characters" });
	// If all needed requirements are achieved
	} else {
		// Creates a variable "newUser" and instantiates a new "User" object using the mongoose model
		// Uses the information from the request body to provide all the necessary information
		let newUser = new User({
			firstName : req.body.firstName,
			lastName : req.body.lastName,
			email : req.body.email,
			mobileNo : req.body.mobileNo,
			password : bcrypt.hashSync(req.body.password, 10)
		})

		// Saves the created object to our database
		// Then, return result to the handler function. No return keyword used because we're using arrow function's implicit return feature
		// catch the error and return to the handler function. No return keyword used because we're using arrow function's implicit return feature
		return newUser.save()
		.then((user) => res.status(201).send({ message: "Registered Successfully" }))
		.catch(err => {
			console.error("Error in saving: ", err)
			return res.status(500).send({ error: "Error in save"})
		})
	}

};

//[SECTION] User authentication
/*
	Steps:
	1. Check the database if the user email exists
	2. Compare the password provided in the login form with the password stored in the database
	3. Generate/return a JSON web token if the user is successfully logged in and return false if not
*/
module.exports.loginUser = (req,res) => {
	// The "findOne" method returns the first record in the collection that matches the search criteria
	// We use the "findOne" method instead of the "find" method which returns all records that match the search criteria
	if(req.body.email.includes("@")){
		return User.findOne({ email : req.body.email })
		.then(result => {

			// User does not exist
			if(result == null){

				// Send the message to the user
				return res.status(404).send({ error: "No Email Found" });

			// User exists
			} else {

				// Creates the variable "isPasswordCorrect" to return the result of comparing the login form password and the database password
				// The "compareSync" method is used to compare a non encrypted password from the login form to the encrypted password retrieved from the database and returns "true" or "false" value depending on the result
				// A good coding practice for boolean variable/constants is to use the word "is" or "are" at the beginning in the form of is+Noun
					//example. isSingle, isDone, isAdmin, areDone, etc..
				const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);

				// If the passwords match/result of the above code is true
				if (isPasswordCorrect) {

					// Generate an access token
					// Uses the "createAccessToken" method defined in the "auth.js" file
					// Returning an object back to the client application is common practice to ensure information is properly labeled and real world examples normally return more complex information represented by objects
					return res.status(200).send({ access : auth.createAccessToken(result)})

				// Passwords do not match
				} else {

					return res.status(401).send({ message: "Email and password do not match" });

				}

			}

		})
		.catch(err => err);
	} else {
	    return res.status(400).send(false)
	}
};

//[SECTION] Retrieve user details
/*
	Steps:
	1. Retrieve the user document using it's id
	2. Change the password to an empty string to hide the password
	3. Return the updated user record
*/
// The "getProfile" method now has access to the "req" and "res" objects because of the "next" function in the "verify" method.
module.exports.getProfile = (req, res) => {

	// The "return" keyword ensures the end of the getProfile method.
	// Since getProfile is now used as a middleware it should have access to "req.user" if the "verify" method is used before it.
	// Order of middlewares is important. This is because the "getProfile" method is the "next" function to the "verify" method, it receives the updated request with the user id from it.
	return User.findById(req.user.id)
	.then(user => {
	    if (!user) {
	        return res.status(404).send({ error: 'User not found' });
	    }

	    // Exclude sensitive information like password
	    user.password = undefined;

	    return res.status(200).send({ user });
	})
	.catch(err => {
		console.error("Error in fetching user profile", err)
		return res.status(500).send({ error: 'Failed to fetch user profile' })
	});

};

//[SECTION] Enroll a user to a course
/*
	Steps:
	1. Retrieve the user's id
	2. Change the password to an empty string to hide the password
	3. Return the updated user record
*/
module.exports.enroll = (req, res) => {

	// The user's id from the decoded token after verify()
    console.log(req.user.id);
    // The course from our request body
    console.log(req.body.enrolledCourses) ;

    // Process stops here and sends response IF user is an admin
    if(req.user.isAdmin){
        // Admins should not be allowed to enroll to a course, so we need the "verify" to check the req.user.isAdmin
        return res.status(403).send({ error: "Admin is forbidden" });
    }

    let newEnrollment = new Enrollment ({
        // Adds the id of the logged in user from the decoded token
        userId : req.user.id,
        // Gets the courseIds from the request body
        enrolledCourses: req.body.enrolledCourses,
        totalPrice: req.body.totalPrice
    })

    return newEnrollment.save()
    .then(enrolled => {
        return res.status(201).send({ 
			message: "Successfully Enrolled",
			enrolled: enrolled
		 });
    })
    .catch(err => {
    	console.error("Error in enrolling: ", err)
    	return res.status(500).send({ error: "Error in enrolling" })
    })

}

//[SECTION] Get enrollments
/*
	Steps:
	1. Use the mongoose method "find" to retrieve all enrollments for the logged in user
	2. If no enrollments are found, return a 404 error. Else return a 200 status and the enrollment record
*/
module.exports.getEnrollments = (req, res) => {
	return Enrollment.find({userId : req.user.id})
	.then(enrollments => {
		console.log(enrollments)
		if (enrollment.length > 0) {
			return res.status(200).send({ enrollments });
		}
		return res.status(404).send({ error: 'No enrollments not found' });
	})
	.catch(err => {
		console.error("Error in fetching enrollments")
		return res.status(500).send({ error: 'Failed to fetch enrollments' })
	});
};

//[SECTION] Reset password
module.exports.resetPassword = async (req, res) => {

	try {

		// Add a console.log() to check if you can pass data properly from postman
		// console.log(req.body);

		// Add a console.log() to show req.user, our decoded token, does not contain userId property but instead id
		// console.log(req.user);

		const { newPassword } = req.body;

		// update userId to id because our version of req.user does not have userId property but id property instead.
		const { id } = req.user; // Extracting user ID from the authorization header

		// Hashing the new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		
		// Update userId update to id
		// Updating the user's password in the database
		await User.findByIdAndUpdate(id, { password: hashedPassword });

		// Sending a success response
		res.status(200).json({ message: 'Password reset successfully' });

	} catch (error) {

		console.error(error);
		res.status(500).json({ message: 'Internal server error' });

	}

};

//[SECTION] Update profile
// Update the function to arrow to unify our code formats
// Modify how we export our controllers
module.exports.updateProfile = async (req, res) => {
	try {

		// Add a console.log() to check if you can pass data properly from postman
		// console.log(req.body);

		// Add a console.log() to show req.user, our decoded token, does have id property
		// console.log(req.user);
			
		// Get the user ID from the authenticated token
		const userId = req.user.id;

		// Retrieve the updated profile information from the request body
		// Update the req.body to use mobileNo instead of mobileNumber to match our schema
		const { firstName, lastName, mobileNo } = req.body;

		// Update the user's profile in the database
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ firstName, lastName, mobileNo },
			{ new: true }
		);

		res.send(updatedUser);
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: 'Failed to update profile' });
	}
}