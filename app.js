const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

main().catch(err => console.log(err))
async function main() {
    await mongoose.connect('mongodb://localhost:27017/userDB');
};

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const User = mongoose.model('User', userSchema);

app.route('/')
    .get((req,res) => {
        res.render('home');
    });

app.route('/login')
    .get((req,res) => {
        res.render('login');
    })
    .post((req,res) => {
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username}, (err, foundUser) => {
            if(err) {
                console.log(err);
            } else {
                if(foundUser) {
                    bcrypt.compare(password, foundUser.password, function(err, result) {
                        if(result === true){
                            res.render('secrets')
                        }
                    });
                }
            }
        })
    });

app.route('/register')
    .get((req,res) => {
        res.render('register')
    })
    .post((req,res) => {
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            // Store hash in your password DB
            const newUser = new User({
                email: req.body.username,
                password: hash
            })
    
            newUser.save((err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('secrets');
                }
            });
        });
        
    })


app.listen(PORT, () => {
    console.log(PORT + ' port is listening');
})