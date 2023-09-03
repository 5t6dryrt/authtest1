//jshint esversion:6
require('dotenv').config()
const express = require('express')
const bodyParser =require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')

const app =express()

console.log(process.env.API_KEY)

app.use(express.static("public"))
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}))


mongoose.connect('mongodb://127.0.0.1:27017/userDB', { 
   useUnifiedTopology: true
}).then(() => console.log("Database connected!"))
.catch(err => console.log(err));

const userSchema = new mongoose.Schema ({
  email: String,
   password: String
})


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})

const User = mongoose.model("User",userSchema)

app.listen(3000,()=>
{
   console.log('now in port 3000')
})

app.get('/',(req,res)=>{
   res.render('home')
})

app.get('/login',(req,res)=>{
   res.render('login')
})

app.get('/register',(req,res)=>{
   res.render('register')
})

app.post('/register', async (req,res)=>{
      const email = req.body.username
      const password =req.body.password
      
      const newUser = new User({
         email:email,
         password:password
      })
      console.log(newUser)
        

      
   
   
          newUser.save().then((result)=>{
          console.log(result)
          res.render('secrets')
       }).catch((err)=>{
          console.log(err)
       })
      
      
        
      })


app.post('/login',async(req,res)=>{
   const username = req.body.username
   const password = req.body.password

   User.findOne({email:username}).then((foundlist)=>{
      console.log(foundlist)
      if(foundlist){
         if(foundlist.password === password){
            res.render('secrets')
         }else{
            res.render('login')
         }

      }else{
         res.render('login')
      }
   }).catch((err)=>{
      console.log(err)
   })

         // User.findOne({email:username},(err,foundUser)=>{
         //    if(err){
         //       console.log(err)
         //    }else{
         //       if(foundUser){
         //          if(foundUser.password === password ){
         //             res.render('secrets')
         //          }
         //       }
         //    }

   })
      
   
