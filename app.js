require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET;

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err))
async function main() {
    await mongoose.connect('mongodb://localhost:27017/userDB');
};

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.route('/')
    .get((req,res) => {
        res.render('home');
    });

app.route('/login')
    .get((req,res) => {
        res.render('login');
    })
    .post(passport.authenticate('local', {failureRedirect:'/'}), (req,res) => {
        res.redirect('/secrets');
    });

app.route('/register')
    .get((req,res) => {
        res.render('register')
    })
    .post((req,res) => {
        User.register(
            {username: req.body.username},
            req.body.password,
            (err, user) => {
                if(err) {
                    console.log(err);
                    res.redirect("/register");
                } else {
                    passport.authenticate('local')(req,res,function() {
                        res.redirect("/secrets")
                    })
                }
            }
        )
    });

app.route('/secrets')
.get((req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/')
    }
});

app.route('/logout')
    .get((req,res) => {
        req.logout();
        res.redirect('/');
    });

app.listen(PORT, () => {
    console.log(PORT + ' port is listening');
})