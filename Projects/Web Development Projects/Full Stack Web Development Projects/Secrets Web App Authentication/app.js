require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { log } = require("console");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// const md5 = require("md5");
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (error, user) {
    done(error, user);
  });
});
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (error, user) {
        return cb(error, user);
      });
    }
  )
);

//Routes
app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (error) {
    if (error) {
      console.log(error);
    } else {
      passport.authenticate("local", {
        failureRedirect: "/login",
      })(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, function (error, foundUser) {
    if (error) {
      console.log(error);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save();
        res.redirect("/secrets");
      }
    }
  });
});

// bcrypt method
// app.post("/login", function (req, res) {
//   const username = req.body.username;
//   const password = req.body.password;

//   User.findOne({ email: username }, function (error, foundUser) {
//     if (error) {
//       console.log(error);
//     } else {
//       if (foundUser) {
//         bcrypt.compare(password, foundUser.password, function (error, result) {
//           if (result === true) {
//             res.render("secrets");
//           }
//         });
//       }
//     }
//   });
// });

app.get("/secrets", function (req, res) {
  User.find({ secret: { $ne: null } }, function (error, foundUsers) {
    if (error) {
      console.log(error);
    } else {
      if (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      }
    }
  });
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (error, user) {
      if (error) {
        console.log(error);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

// bcrypt method
// app.post("/register", function (req, res) {
//   bcrypt.hash(req.body.password, saltRounds, function (error, hash) {
//     const newUser = new User({
//       email: req.body.username,
//       password: hash,
//     });
//     newUser.save(function (error) {
//       if (error) {
//         console.log(error);
//       } else {
//         res.render("secrets");
//       }
//     });
//   });
// });

//Server
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
