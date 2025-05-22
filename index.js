if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


// ====================
// Third-Party Packages
// ====================
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash')
const passport = require('passport');
const LocalStrategy = require('passport-local')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');


// ====================
// Models
// ====================
const User = require('./models/user.js')


// ====================
// Utilities
// ====================
const ExpressError = require('./utilities/ExpressError')


// ====================
// Routes
// ====================
const userRoutes = require('./routes/users.js')
const postRoutes = require('./routes/posts.js')
const reviewRoutes = require('./routes/reviews.js')
const forumRoutes = require('./routes/threads.js')
const replyRoutes = require('./routes/replies.js')


// ====================
// Config
// ====================
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/home-makers-diy";
//const dbUrl = 'mongodb://127.0.0.1:27017/home-makers-diy';



// Database Connect
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection eror:'));
db.once('open', () => {
    console.log("Database connected");
});

// Express App
const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({
    replaceWith: '_'
}))
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});


// Session
const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash())
app.use(express.json());
app.use(bodyParser.json());
app.use(helmet());

// Helmet
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.skypack.dev",
    "*.tinymce.com",
    "*.tiny.cloud",
    "*.cloudinary.com"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",

];
const connectSrcUrls = [
    "https://api.cloudinary.com",
    "https://cdn.jsdelivr.net",
    "https://fonts.googleapis.com/",
    "https://cdn.skypack.dev"
];
const fontSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://fonts.gstatic.com"
];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dyyeqgu18/",
                "https://images.unsplash.com/",
                "https://unsplash.com/",
                "https://api.cloudinary.com/",
                "*.cloudinary.com"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


//session used before passport.session
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// !!before route handlers yk
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


//Routes
app.use('/', userRoutes)
app.use('/posts', postRoutes)
app.use('/posts/:id/reviews', reviewRoutes)
app.use('/forum', forumRoutes)
app.use('/forum/:id/replies', replyRoutes)


// Renders Homepage
app.get('/', (req, res) => {
    res.render('home')
})


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

// Handles image upload error
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        req.flash('error', 'File too large. Max size is 3MB.');
        return res.redirect('back');
    }

    if (err.message === 'Only image files are allowed!') {
        req.flash('error', err.message);
        return res.redirect('back');
    }

    // Pass to default error handler if not handled above
    next(err);
});


app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong.';
    res.status(statusCode).render('error', { err });
})


app.listen(3000, () => {
    console.log('Serving on port 3000')
})


// node cron cleanup job of the temporary images in cloudinary
require('./jobs/cleanupTempImages.js');