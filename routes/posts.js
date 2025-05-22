const express = require('express');
const router = express.Router();
const multer = require('multer');
const { upload } = require('../cloudinary/index.js');

//const upload = multer({ storage });

const posts = require('../controllers/posts.js')
const { isLoggedIn, isAuthor, validatePost } = require('../middleware.js')
const Post = require('../models/post')

const catchAsync = require('../utilities/catchAsync');


router.get('/search', catchAsync(posts.searchPosts))

router.post('/:id/bookmark', isLoggedIn, catchAsync(posts.bookmarkPost))

router.post('/:id/unmark', isLoggedIn, catchAsync(posts.unmarkPost))



router.route('/')
    .get(catchAsync(posts.index))
    .post(isLoggedIn, upload.single('thumbnail'), validatePost, catchAsync(posts.createPost))



//this has to be before show page
router.get('/new', isLoggedIn, posts.renderNewPostForm)


router.route('/:id')
    .get(catchAsync(posts.showPost))
    .put(isLoggedIn, isAuthor, upload.single('thumbnail'), validatePost, catchAsync(posts.updatePost))
    .delete(isLoggedIn, isAuthor, catchAsync(posts.deletePost))



router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(posts.renderEditPostForm))

router.post('/:id/like', isLoggedIn, catchAsync(posts.likePost))
router.post('/:id/unlike', isLoggedIn, catchAsync(posts.unlikePost))


router.post('/cloudinary/delete-image', catchAsync(posts.deleteImages))


module.exports = router;