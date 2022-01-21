require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
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

var secret = process.env.SECRET;
//specify exactly which fields to encrypt with the encryptedFields option. This overrides the defaults which encrypts everything except id and __v
userSchema.plugin(encrypt, { secret: secret, encryptedFields:['password'] });


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
                    if(foundUser.password === password) {
                        res.render('secrets')
                    }
                }
            }
        })
    });

app.route('/register')
    .get((req,res) => {
        res.render('register')
    })
    .post((req,res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        })

        newUser.save((err) => {
            if (err) {
                console.log(err);
            } else {
                res.render('secrets');
            }
        });
    })


app.listen(PORT, () => {
    console.log(PORT + ' port is listening');
})