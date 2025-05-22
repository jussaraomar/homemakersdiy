const express = require('express');
const { upload } = require('../cloudinary/index.js');
const router = express.Router({ mergeParams: true });

const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware.js')
const reviews = require('../controllers/reviews.js')

const Post = require('../models/post')
const Review = require('../models/review.js')

const catchAsync = require('../utilities/catchAsync');




router.post('/', isLoggedIn, upload.single('image'), validateReview, catchAsync(reviews.createReview))

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview))

module.exports = router;