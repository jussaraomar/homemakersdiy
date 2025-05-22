const express = require('express');
const router = express.Router();

const threads = require('../controllers/threads.js')
const { isLoggedIn, isThreadAuthor, validateThread } = require('../middleware.js')
const Thread = require('../models/thread.js')

const catchAsync = require('../utilities/catchAsync');


router.route('/')
    .get(catchAsync(threads.index))
    .post(isLoggedIn, validateThread, catchAsync(threads.createThread))

router.get('/search', catchAsync(threads.searchThreads))

//this has to be before show page
router.get('/new', isLoggedIn, threads.renderNewThreadForm)


router.route('/:id')
    .get(catchAsync(threads.showThread))
    .delete(isLoggedIn, isThreadAuthor, catchAsync(threads.deleteThread))




module.exports = router;