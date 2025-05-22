const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport')
const { upload } = require('../cloudinary/index.js');


const users = require('../controllers/users')
const User = require('../models/user');
const { storeReturnTo, isLoggedIn } = require('../middleware');

const catchAsync = require('../utilities/catchAsync');
const ExpressError = require('../utilities/ExpressError');


router.get('/register', users.renderRegister)
router.post('/register', catchAsync(users.register))


router.get('/login', users.renderLogin)
router.post('/login', storeReturnTo, passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), catchAsync(users.login))


router.get('/logout', users.logout);


router.get('/users/:id', isLoggedIn, catchAsync(users.renderProfile))



router.post('/users/:id/change-username', isLoggedIn, catchAsync(users.changeUsername));
router.post('/users/:id/change-email', isLoggedIn, catchAsync(users.changeEmail));
router.post('/users/:id/change-bio', isLoggedIn, catchAsync(users.changeBio));
router.post('/users/:id/change-password', isLoggedIn, catchAsync(users.changePassword));
router.post('/users/:id/change-pfp', isLoggedIn, upload.single('profilePicture'), catchAsync(users.changePfp));

router.delete('/account', isLoggedIn, catchAsync(users.deleteAccount));


module.exports = router;