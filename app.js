
require('dotenv').config()
const express = require('express')
const bodyParser =require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')



const app =express()



app.use(express.static("public"))
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}))

app.use(session({
   secret: process.env.SECRET,
   resave: false,
   saveUninitialized: false,
  
 }))


 app.use(passport.initialize())
 app.use(passport.session())
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { 
   useUnifiedTopology: true
}).then(() => console.log("Database connected!"))
.catch(err => console.log(err));

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId:String,
  secret:String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = mongoose.model("User",userSchema)

passport.use(User.createStrategy());


passport.serializeUser(function(user, cb) {
   process.nextTick(function() {
     return cb(null, {
       id: user.id,
       username: user.username,
       picture: user.picture
     });
   });
 });
 
 passport.deserializeUser(function(user, cb) {
   process.nextTick(function() {
     return cb(null, user);
   });
 });
passport.use(new GoogleStrategy({
   clientID: process.env.CLIENT_ID,
   clientSecret: process.env.CLIENT_SECRET,
   callbackURL: "http://localhost:3000/auth/google/secrets"
  
 },
 function(accessToken, refreshToken, profile, cb) {
   console.log(profile)
   User.findOrCreate({ googleId: profile.id }, function (err, user) {
      
     return cb(err, user);
   });
 }
));

app.listen(3000,()=>
{
   console.log('now in port 3000')
})

app.get('/',(req,res)=>{
   res.render('home')
})

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/login',(req,res)=>{
   res.render('login')
})

app.get('/secrets',async(req,res)=>{
   User.find({"secret":{$ne:null}}).then((foundUser)=>{
      if(foundUser){
         res.render('secrets',{userWithSecrets:foundUser})
      }else{

      }
   }).catch((err)=>console.log(err))
})

app.get('/register',(req,res)=>{
   res.render('register')
})

app.post('/register', async (req,res)=>{
   User.register({username:req.body.username}, req.body.password, function(err, user) {
      console.log('dog')
      if (err) {
         console.log(err)
         res.redirect('/register')
       }else{
         console.log('cat')
         passport.authenticate('local')(req,res, function(){
            res.redirect('/secrets')
         })
         
      }
    });
})


app.post('/login',async(req,res)=>{
 

   const user = new User({
      username:req.body.username,
      password:req.body.password
   })

   req.login(user, function(err) {
      if (err) { return next(err); }
      else{
         passport.authenticate('local')(req,res, function(){
            res.redirect('/secrets')
         })
      }
      
    });
  

})

app.get("/submit",(req,res)=>{
   if(req.isAuthenticated){
      res.render('submit.ejs')
   }else{
      redirect('/login')
   }
})

app.post("/submit", async (req, res) => {
   let submitsecret = await req.body.secret;
   console.log(req.user);
   User.findById(req.user.id)
     .then((foundUser) => {
       if (foundUser) {
         foundUser.secret = submitsecret;
         foundUser.save().then(() => {
           res.redirect("/secrets");
         });
       }
     })
     .catch((err) => console.log(err));
 });
app.get("/logout",(req,res)=>{
   req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
}) 
