const express = require('express');
const router = express.Router({ mergeParams: true });

const { validateReply, isLoggedIn, isReplyAuthor } = require('../middleware.js')
const replies = require('../controllers/replies.js')

const Thread = require('../models/thread.js')
const Reply = require('../models/reply.js')

const catchAsync = require('../utilities/catchAsync');




router.post('/', isLoggedIn, validateReply, catchAsync(replies.createReply))

router.post('/:replyId/vote', isLoggedIn, catchAsync(replies.voteReply));

router.delete('/:replyId', isLoggedIn, isReplyAuthor, catchAsync(replies.deleteReply))

module.exports = router;