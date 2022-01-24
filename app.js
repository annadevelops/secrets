require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET;

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

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
    username: String,
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose, {usernameUnique: false});
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, username: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

const secretSchema = new mongoose.Schema({
    content: String
});

const Secret = mongoose.model('Secret', secretSchema);

app.route('/')
    .get((req,res) => {
        res.render('home');
    });

app.route('/auth/google')
    .get(passport.authenticate('google', {scope: ['profile']}));

app.route('/auth/google/secrets')
    .get(passport.authenticate('google', {failureRedirect: '/login'}), (req, res) => {
        res.redirect('/secrets');
    })

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
        Secret.find((err, foundSecrets) => {
            res.render('secrets', {secrets: foundSecrets}) ;
        })
        
    } else {
        res.redirect('/')
    }
});

app.route('/logout')
    .get((req,res) => {
        req.logout();
        res.redirect('/');
    });

app.route('/submit')
    .get((req,res) => {
        res.render('submit');
    })
    .post((req,res) => {
        const secret = new Secret({
            content: req.body.secret
        })

        secret.save();
        res.redirect('/secrets')
    })

app.listen(PORT, () => {
    console.log(PORT + ' port is listening');
})