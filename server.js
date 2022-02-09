
const express = require('express');
const session = require('express-session');
const path = require('path');
const mongo = require("mongodb");
const mc = mongo.MongoClient;
const MongoDBStore = require('connect-mongodb-session')(session);
const app = express()
const PORT = process.env.PORT || 3000;

//Global variables
let store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/a4',
  collection: 'sessions'
});
store.on('error',(error) => {console.log(error)});
let db;

// Use the session middleware
app.use(exposeSession);
app.set(path.join(__dirname,'views'));
app.set('views');
app.set('view engine', 'pug');
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

//Creates a session
app.use(session({
  secret:'secret cookie goes here',
  name: 'a4-session',
  secret: 'the chicken is crossing the road',
  cookie:{
    maxAge: 1000*60*60*24*7
  },
  store: store,
  resave: true, //Update idle session to active, active session are not deleted
  saveUninitialized: true //Empty sessions are not stored
}));

//Log requests received
app.use(function(req, res, next){
  console.log(`${req.method} for ${req.url}`);
  next();
});

//Setting up server routers
app.get('/', gethomepage);
app.get('/orderform',getorderpage);
app.get('/logout',logout);
app.get('/users',getusers);
app.get('/register',getregister);
app.get('/login',getlogin);
app.get('/users/:userID',getuserprofile);
app.post('/login',login);
app.post('/register',register);
app.post('/users/:userID',updateprofile);
app.post('/orders',postorder);
function exposeSession(req,res,next){
  if(req.session) res.locals.session = req.session;
  next();
}

//Server route functions


//Renders the homepage, passing through necessary variables
function gethomepage(req, res){
  res.render('homepage',{username:req.session.username,session:req.session.loggedin, userID:req.session._id});
  res.statusCode = 200;
}
//Renders the login page, passing through necesary variables
function getlogin(req,res){
  res.render('loginpage',{username:req.session.username,session:req.session.loggedin,userID:req.session._id});
  res.statusCode = 200;
}
//Renders the order page, passing through necessary variables
function getorderpage(req, res){
  res.render('orderform',{username:req.session.username,session:req.session.loggedin, userID:req.session._id});
  res.statusCode = 200;
}

//Renders the register page, passing through necessary variables
function getregister(req,res){
  res.render('register',{username:req.session.username,session:req.session.loggedin});
  res.statusCode = 200;
}
//Renders the user profile based on the given request
function getuserprofile(req, res){
  let userID = mongo.ObjectId(req.params.userID);
  db.collection("users").findOne({"_id":userID},(err, result)=>{
      if(err)console.log(err);
      console.log(result);
      if(result){
          if(result.username === req.session.username){
            res.render("userprofile",{
              userID: req.session._id,
              username: result.username,
              session: req.session.loggedin,
              ownProfile: true,
            });
          }else{
            res.render("userprofile",{
              userID: req.session._id,
              username:result.username,
              session: req.session.loggedin,
              ownProfile: false,
            });
          }
      }
      else{
        res.send("No user found with this ID");
      }
  });
}
//Renders all public users aswell as handling query searches
function getusers(req,res){
  let query = req.query.name;
  if(query){
    let match = [];
    db.collection("users").find({privacy: false, username: {'$regex':query, '$options':'i'}}).toArray((err, result)=>{
      if(err)console.log(err);
      match = result;
      res.render('users',{username: req.session.username,session:req.session.loggedin, users:match});
    });
    match = [];
  }else{
    let users = [];
    db.collection("users").find({privacy:false}).toArray((err, result)=>{
      if(err) console.log(err);
      else{users = result;}
      res.render('users',{username: req.session.username,session: req.session.loggedin,users:users});
    });
    users = [];
  }
}
//Logs the user in by editing the session variables
function login(req, res, next){
	if(req.session.loggedin){
		res.status(200).send("Already logged in.");
		return;
	}
  // if(!users.hasOwnProperty(req.body.username)){
  //   res.status(401).send("Unauthorized");
  //   return;
  // }
  db.collection("users").find({username:req.body.username, password:req.body.password}).toArray((err, result)=>{
    if (err) console.log(err);
    if(result.length){
      req.session.loggedin = true;
      req.session.username = req.body.username;
      req.session._id = result[0]._id;
      console.log("Logging in with credentials:");
      console.log("Username: " + req.body.username);
      console.log("Password: " + req.body.password);
      console.log("User ID:" + req.session._id);
      res.status(200).redirect('/');
    }else{
      res.send("Invalid credentials");
    }
  });
}
//Updates the users privacy information and removes their name and link from the users page
function updateprofile(req, res){
  console.log("atleast it goes here")
  if(req.body.privacy === "private"){
    console.log("atleast it also goes here")
    db.collection("users").updateOne({username:req.session.username},{$set : {privacy:true}});
    res.render('userprofile',{
      userID: req.session._id,
      username:req.session.username,
      session: req.session.loggedin,
      ownProfile:true,
    });
  }else{  
    console.log("it didn't reacth xd");
  }
}
//Logs the user out of the session
function logout(req, res, next){
  console.log(req.session);
	if(req.session.loggedin){
    db.collection("sessions").insertOne({session:req.session});
		req.session.loggedin = false;
    req.session.username = undefined;
    req.session._id = null;
    res.status(200).redirect('/');
	}else{
		res.status(200).send("You cannot log out because you aren't logged in.");
	}
}
//Registers a new user and sends the data to the database
function register(req, res, next){
  db.collection("users").findOne({username:req.body.username},(err, result)=>{
    if(err) console.log(err);
    if(result){
      res.send("Username already taken, please enter a different one.");
    }
    else{
        let newUser = {};
        newUser.username = req.body.username;
        newUser.password = req.body.password;
        newUser.privacy = false;
        db.collection('users').insertOne(newUser, function(err, result){
          if(err) throw err;
          console.log("Sucessfully created profile:");
          console.log("Username: " + req.body.username);
          console.log("Password: " + req.body.password);
          console.log("Privacy: " + newUser.privacy);
          req.session.loggedin = true;
          console.log("ID: " + result.insertedId);
          res.redirect('/users/'+result.insertedId);
        });
    }
  });
  
}
//Posts the order onto the database
function postorder(req,res){
  console.log("Atleast it made it here");
  db.collection("orders").insertOne({username:req.session.username,order:req.body});
  res.status(200).send("Order successfully loaded onto the database");
}
//Connecting to database
mc.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;
  console.log("Connected to database.");
  db = client.db('a4');
  app.listen(PORT, ()=> console.log(`Server listening on http://127.0.0.1:${PORT}/`));
});