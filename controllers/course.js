//[SECTION] Dependencies and Modules
const Course = require("../models/Course");
const User = require("../models/User");

//[SECTION] Create a course
/*
	Steps: 
	1. Instantiate a new object using the Course model and the request body data
	2. Save the record in the database using the mongoose method "save"
	3. Use the "then" method to send a response back to the client appliction based on the result of the "save" method
*/
module.exports.addCourse = (req, res) => {

	// Creates a variable "newCourse" and instantiates a new "Course" object using the mongoose model
	// Uses the information from the request body to provide all the necessary information
	let newCourse = new Course({
		name : req.body.name,
		description : req.body.description,
		price : req.body.price
	});

	Course.findOne({ name: req.body.name })
	.then(existingCourse => {
	    if (existingCourse) {
	    	// Notice that we didn't response directly in string, instead we added an object with a value of a string. This is a proper response from API to Client. Direct string will only cause an error when connecting it to your frontend.
	    	// using res.send({ key: value }) is a common and appropriate way to structure a response from an API to the client. This approach allows you to send structured data back to the client in the form of a JSON object, where "key" represents a specific piece of data or a property, and "value" is the corresponding value associated with that key.
	        return res.status(409).send({ error: 'Course already exists' });
	    }

	    // Saves the created object to our database
	    // Return is used here to end the controller function
	    return newCourse.save()
	    //The syntax ({ savedCourse }) in JavaScript is known as object destructuring assignment. In this context, it's used to create a new object with a property named savedCourse that holds the value of the savedCourse variable.
	    // Used more descriptive variable names like saveErr and findErr for better understanding of the error context.
	    .then(savedCourse => res.status(201).send({ savedCourse }))
	    // Error handling is done using .catch() to capture any errors that occur during the course save operation.
	    // .catch(err => err) captures the error but does not take any action, it's only capturing the error to pass it on to the next .then() or .catch() method in the chain. Postman is waiting for a response to be sent back to it but is not receiving anything.
	    // .catch.catch(err => res.send(err)) captures the error and takes action by sending it back to the client/Postman with the use of "res.send"
	    .catch(saveErr => {
	        // This will only be displayed in terminal
	        console.error("Error in saving the course: ", saveErr)

	        // This will be the response to the client
	        // Sent more meaningful error messages like 'Failed to save the course' and 'Error finding the course' to provide clearer feedback.
	        return res.status(500).send({ error: 'Failed to save the course' });
	    });
	    
	})
	.catch(findErr => {
	    // This will only be displayed in terminal
	    console.error("Error in finding the course: ", findErr)

	    // This will be the response to the client
	    return res.status(500).send({ message:'Error finding the course' });
	});

}; 


//[SECTION] Retrieve all courses
/*
	Steps: 
	1. Retrieve all courses using the mongoose "find" method
	2. Use the "then" method to send a response back to the client appliction based on the result of the "find" method
*/
module.exports.getAllCourses = (req, res) => {

	// In asynchronous operations like the one using promises, you typically don't need to use a try block. Instead, you can handle errors using the .catch() method after the promise (.then()). In this case, if any error occurs during the promise execution, it will be caught and handled by the .catch() block, sending the error response back.
	return Course.find({})
	.then(courses => {
	    if(courses.length > 0){
	    	// Provided a more structured response format using an object with a key allCourses containing the courses.
	    	res.status(200).send({ courses });
	    }
	    else{
	        // 200 is a result of a successful request, even if the response returned no record/content
	        return res.status(200).send({ message: 'No courses found.' });
	    }
	})

};

//[SECTION] Retrieve all active courses
/*
	Steps: 
	1. Retrieve all courses using the mongoose "find" method with the "isActive" field values equal to "true"
	2. Use the "then" method to send a response back to the client appliction based on the result of the "find" method
*/
module.exports.getAllActive = (req, res) => {

	Course.find({ isActive : true })
	.then(courses => {
	    // if the result is not null
	    if (courses.length > 0){
	        // send the result as a response
	        return res.status(200).send({ courses });
	    }
	    // if there are no results found
	    else {
	        // send the message as the response
	        return res.status(200).send({ message: 'No active courses found.' })
	    }
	}).catch(err => res.status(500).send({ error: 'Error finding active courses.' }));

};

//[SECTION] Retrieve a specific course
/*
	Steps: 
	1. Retrieve a course using the mongoose "findById" method
	2. Use the "then" method to send a response back to the client appliction based on the result of the "find" method
*/
module.exports.getCourse = (req, res) => {
	const courseId = req.params.courseId;

	Course.findById(req.params.courseId)
	.then(course => {
		if (!course) {
			return res.status(404).send({ error: 'Course not found' });
		}
		return res.status(200).send({ course });
	})
	.catch(err => {
		console.error("Error in fetching the course: ", err)
		return res.status(500).send({ error: 'Failed to fetch course' });
	});
	
};

//[SECTION] Update a course
/*
	Steps: 
	1. Create an object containing the data from the request body
	2. Retrieve and update a course using the mongoose "findByIdAndUpdate" method, passing the ID of the record to be updated as the first argument and an object containing the updates to the course
	3. Use the "then" method to send a response back to the client appliction based on the result of the "findByIdAndUpdate" method
*/
module.exports.updateCourse = (req, res) => {

	let updatedCourse = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price
    }

    // findByIdandUpdate() finds the the document in the db and updates it automatically
    // req.body is used to retrieve data from the request body, commonly through form submission
    // req.params is used to retrieve data from the request parameters or the url
    // req.params.courseId - the id used as the reference to find the document in the db retrieved from the url
    // updatedCourse - the updates to be made in the document
    return Course.findByIdAndUpdate(req.params.courseId, updatedCourse)
    .then(updatedCourse => {
        if (!updatedCourse) {

            //Added specific error handling for cases where the course is not found (404 Not Found) and for other potential errors (500 Internal Server Error).
            return res.status(404).send({ error: 'Course not found' });

        }

        // Modified the response to include the updated course when the operation is successful.
        return res.status(200).send({ 
        	message: 'Course updated successfully', 
        	updatedCourse: updatedCourse 
        });

    })
    .catch(err => {
		console.error("Error in updating a course: ", err)
		return res.status(500).send({ error: 'Error in updating a course.' });
	});
};

//[SECTION] Archive a course
/*
	Steps: 
	1. Create an object and with the keys to be updated in the record
	2. Retrieve and update a course using the mongoose "findByIdAndUpdate" method, passing the ID of the record to be updated as the first argument and an object containing the updates to the course
	3. If the user is an admin, update a course else send a response of "false"
	4. If a course is updated send a response of "true" else send "false"
	5. Use the "then" method to send a response back to the client appliction based on the result of the "findByIdAndUpdate" method
*/
module.exports.archiveCourse = (req, res) => {

    let updateActiveField = {
        isActive: false
    }
    if (req.user.isAdmin == true){
        return Course.findByIdAndUpdate(req.params.courseId, updateActiveField)
        .then(archiveCourse => {
            if (!archiveCourse) {
            	return res.status(404).send({ error: 'Course not found' });
            }
            return res.status(200).send({ 
            	message: 'Course archived successfully', 
            	archiveCourse: archiveCourse 
            });
        })
        .catch(err => {
        	console.error("Error in archiving a course: ", err)
        	return res.status(500).send({ error: 'Failed to archive course' })
        });
    }
    else{
        return res.status(403).send(false);
    }
};

//[SECTION] Activate a course
/*
	Steps: 
	1. Create an object and with the keys to be updated in the record
	2. Retrieve and update a course using the mongoose "findByIdAndUpdate" method, passing the ID of the record to be updated as the first argument and an object containing the updates to the course
	3. If the user is an admin, update a course else send a response of "false"
	4. If a course is updated send a response of "true" else send "false"
	5. Use the "then" method to send a response back to the client appliction based on the result of the "findByIdAndUpdate" method
*/
module.exports.activateCourse = (req, res) => {

    let updateActiveField = {
        isActive: true
    }
    if (req.user.isAdmin == true){
        return Course.findByIdAndUpdate(req.params.courseId, updateActiveField)
        .then(activateCourse => {
            if (!activateCourse) {
            	return res.status(404).send({ error: 'Course not found' });
            }
            return res.status(200).send({ 
            	message: 'Course activated successfully', 
            	activateCourse: activateCourse
            });
        })
        .catch(err => {
        	console.error("Error in activating a course: ", err)
        	return res.status(500).send({ error: 'Failed to activating a course' })
        });
    }
    else{
        return res.status(403).send(false);
    }
};

//[SECTION] Search course by name
// Update the function to arrow to unify our code formats
// Modify how we export our controllers
module.exports.searchCoursesByName = async (req, res) => {
	try {
	  const { courseName } = req.body;
  
	  // Use a regular expression to perform a case-insensitive search
	  const courses = await Course.find({
		name: { $regex: courseName, $options: 'i' }
	  });
  
	  res.json(courses);
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ error: 'Internal Server Error' });
	}
};

//[SECTION] Get enrolled users via course ID
// Contextualize it to use our module export approach.
module.exports.getEmailsOfEnrolledUsers = async (req, res) => {
	const courseId = req.params.courseId; // Use req.params instead of req.body

	try {
		// Find the course by courseId
		const course = await Course.findById(courseId);
	
		if (!course) {
			return res.status(404).json({ message: 'Course not found' });
		}
	
		// Get the userIds of enrolled users from the course
		const userIds = course.enrollees.map(enrollee => enrollee.userId);
	
		// Find the users with matching userIds
		const enrolledUsers = await User.find({ _id: { $in: userIds } }); // Use userIds variable instead of undefined "users"
	
		// Extract the emails from the enrolled users
		const emails = enrolledUsers.map(user => user.email); // Use map instead of forEach
	
		res.status(200).json({ userEmails: emails }); // Use the correct variable name userEmails instead of emails
	} catch (error) {
		res.status(500).json({ message: 'An error occurred while retrieving enrolled users' });
	}
};