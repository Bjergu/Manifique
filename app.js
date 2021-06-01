//Request modules
const express = require("express"),
      app = express(),
      MongoClient = require('mongodb').MongoClient,
      mongoose = require("mongoose"),
      server = require("http").createServer(app),
      io = require("socket.io")(server),
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      User = require("./models/user"),
      fetch = require("node-fetch"),
      nodemailer = require("nodemailer");

//Handlers requests
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

//setup routes
const productsRouter = require("./routes/products.js");
const contactRouter = require("./routes/contact.js");

app.use(productsRouter.router);
app.use(contactRouter.router);

//require file system
const fs = require("fs");
const { Console } = require("console");

const header = fs.readFileSync(__dirname + "/public/header/header.html", "utf-8");
const footer = fs.readFileSync(__dirname + "/public/footer/footer.html", "utf-8");

const about = fs.readFileSync(__dirname + "/public/about/about.html", "utf-8");
const contact = fs.readFileSync(__dirname + "/public/contact/contact.html", "utf-8");
const frontpage = fs.readFileSync(__dirname + "/public/frontpage/frontpage.html", "utf-8");
const products = fs.readFileSync(__dirname + "/public/products/products.html", "utf-8");

const login = fs.readFileSync(__dirname + "/public/authentication/login.html", "utf-8");
const register = fs.readFileSync(__dirname + "/public/authentication/register.html", "utf-8");
const userprofile = fs.readFileSync(__dirname + "/public/authentication/userprofile.html", "utf-8");

//methods
app.get("/", (req, res) => {
    res.send(header + frontpage + footer);
});

app.get("/about", (req, res) => {
    res.send(header + about + footer);
});


app.get("/contact", (req, res) => {
    res.send(header + contact + footer);
});

//Nodemailer
app.post('/sendemail', (req, res) => {
    console.log(req.body);

    const transporter = nodemailer.createTransport({
        host: 'smtp.live.com',
        port: 587,
        secure: false, 
        auth: {
            user: 'artutest@hotmail.com',
            pass: '20TesT20'
        }
    })
    const mailOptions = {
        from: req.body.email,
        to: 'artutest@hotmail.com',
        subject: `Message from ${req.body.email}: ${req.body.subject}`,
        text: req.body.message
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.log(error);
            res.send("Error: " + error);
        }else{
            console.log('Email sent: ' + info.response)
            res.send('success')
        }
    })
});

app.get("/about", (req, res) => {
    res.send(header + aboutpage + footer);
});


app.get("/currency", (req, res) => {
    fetch("https://valuta.exchange/da/eur-to-dkk?amount=1")
    .then(res => res.textConverted())
    .then(body => res.send(body));
});

//Connect to database
MongoClient.connect('mongodb+srv://admin:Myshop21@cluster0.jwgfx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', 
{
    useUnifiedTopology: true
}, (err, client) => {
    if (err) 
        return console.error(err);
    console.log('Connected to Database');

    const db = client.db("web_shop");
    const productsCollection = db.collection("products");
    const statsCollection = db.collection("stats");

    app.post("/create", (req, res) => {
        productsCollection.insertOne(req.body)
        .then(result => {
            res.redirect('/products')
        })
        .catch(error => console.error(error));
    })

    app.get("/productlist", (req, res) => {
        db.collection("products").find().toArray()
        .then(results => {
            console.log(results)           
                txt = JSON.stringify(results)
            
            res.send(txt);
        })
        .catch(error => console.error(error))
    });

    app.get("/productByName", (req, res) => {
        db.collection("products").findOne(req.body)
        .then(results => {
            console.log(results)
            res.send(JSON.stringify("Name:" + results.name + ", " + "Price: " + results.price));
        })
        .catch(error => console.error(error))
    });

    app.post("/productdel", (req, res) => {
        productsCollection.deleteOne(req.body)
        .then(results => {
            res.redirect('/products')
        })
        .catch(error => console.error(error))
    });
    
    io.on('connection', (socket) => {
        console.log('A user connected');
        statsCollection.updateOne(
            {   id: 1,    },
            {
                "$inc":
                { "counter": 1 }
            },
            {   "upsert": true  })
    
        socket.on("disconnect", () => {
            console.log("A user disconnected");
        });
    });

    app.get("/stats", (req, res) => {
        db.collection("stats").findOne({ id: 1 })
        .then(results => {
            console.log(results)
            res.send(JSON.stringify("Number of visitors: " + results.counter));
        })
        .catch(error => console.error(error))
    });
});

//Authentication
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb+srv://admin:Myshop21@cluster0.jwgfx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');

app.use(require('express-session') ({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false
}));

passport.serializeUser(User.serializeUser());       //session encoding
passport.deserializeUser(User.deserializeUser());   //session decoding
passport.use(new LocalStrategy(User.authenticate()));
app.use(passport.initialize());
app.use(passport.session());

//Auth
app.get("/userprofile", isLoggedIn, (req, res) => {
    res.send(header + userprofile + footer);
});

app.get("/products", isLoggedIn, (req, res) => {
    res.send(header + products + footer);
});

app.get("/login", (req, res) => {
    res.send(header + login + footer);
});

app.post("/login", passport.authenticate("local", {
    successRedirect:"/userprofile",
    failureRedirect:"/login"
}),function (req, res){

});

app.get("/register", (req, res) => {
    res.send(header + register + footer);
});

app.post("/register", (req, res) => {
    
    User.register(new User({username: req.body.username, email: req.body.email, phone: req.body.phone}), req.body.password, function(err, user){
        if(err){
            res.send("register");
        }
        passport.authenticate("local") (req, res, function(){
            res.redirect("/login");
        })
    })
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login")
};


server.listen(process.env.PORT || 8080, (error) => {
    if (error) {
        console.log(error);
    }
    console.log("The server is running on", server.address().port);
});