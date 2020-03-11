// server.js
//Import package
const express = require("express");
const body_parser = require("body-parser");
var crypto = require('crypto');

const port = 4000;

// << db setup >>
const db = require("./db");
const dbName = "data";
const collectionName = "user";

var server = express();
server.use(body_parser.urlencoded({
   extended: true
 }));
server.use(body_parser.json());

////////// CONNECTION SETUP ////////
server.use(function (req, res, next) {
  	
	res.setHeader('Access-Control-Allow-Origin', "http://localhost:4200");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
	res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  	next();
});

///////////////////// PASSWORD UTILS ///////////////////////////
//Create function to random salt
var genRandomString = function(length){
	return crypto.randomBytes(Math.ceil(length/2))
	.toString('hex') /*convert to hexa format*/
	.slice(0,length);
}

var sha512 = function(password,salt){
	var hash = crypto.createHmac('sha512',salt);
	hash.update(password);
	var value = hash.digest('hex');
	return{
		salt:salt,
		passwordHash:value
	};
}

function saltHashPassword(userPassword){
	var salt = genRandomString(16); //Generate 16 random characters 
	var passwordData = sha512(userPassword,salt);
	return passwordData;
}

function checkHashPassword(userPassword,salt){
	var passwordData = sha512(userPassword,salt);
	return passwordData;
}
////////////////////// END OF PASSWORD UTILS///////////////////

db.initialize(dbName, collectionName, function (dbCollection) { // successCallback
   // get all items
   dbCollection.find().toArray(function (err, result) {
      if (err) throw err;
      //console.log(result);

      // << return response to client >>
   });

//////////////////////// REGISTRATION ////////////////////////

   server.post("/register", (request, response) => {
      const user_data = request.body;
      console.log(user_data);
      var plaint_password = user_data.password;
		var hash_data = saltHashPassword(plaint_password);

		var password = hash_data.passwordHash;   //Save password hash
		var salt = hash_data.salt;    //Save salt

		var name = user_data.name;
		var email = user_data.email;

		var insertLoginJson = {
			'email':email,
			'password':password,
			'salt':salt,
			'name':name
      };

      dbCollection.find({'email':email}).count(function(err,number){
			if (number!=0)
			{
				response.json('Email already exists');
				console.log('Email already exists');
			}
			else
			{
				//Insert data
				dbCollection.insertOne(insertLoginJson,function(err,res){
               if (error) throw error;
					response.json('Registration success');
					console.log('Registration success');
				})
			}

		})
   });

///////////////////////////// END OF REGISTRATION ///////////////////

/////////////////////// LOGIN /////////////////////
server.post('/login',(request,response,next)=>{
   var post_data = request.body;

   var id= post_data._id;
   var email = post_data.email;
   var userPassword = post_data.password;

   //Check existing email
   dbCollection.find({'email':email}).count(function(err,number){
      if (number==0)
      {
         response.json('Email not exists');
         console.log('Email not exists');
      }
      else
      {
         //Insert data
         dbCollection.findOne({'email':email},function(err,user){
            var salt = user.salt;   //Get salt from user
            var hashed_password = checkHashPassword(userPassword,salt).passwordHash;     //Hash Password with salt
            var encrypted_password = user.password;    //Get password from user
            if(hashed_password==encrypted_password){
               response.json('Login success');
               console.log('Login success');
            }
            else{
               response.json('Wrong password');
               console.log('Wrong password');
            }
         })
      }

   })
});
///////////////////////END OF LOGIN /////////////////

}, function (err) { // failureCallback
   throw (err);
});

server.listen(port, () => {
   console.log(`Server listening at ${port}`);
});