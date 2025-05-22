const { postSchema, reviewSchema, threadSchema, replySchema } = require('./schemas')

const Post = require('./models/post')
const Review = require('./models/review.js')
const Thread = require('./models/thread.js')
const Reply = require('./models/reply.js')

const ExpressError = require('./utilities/ExpressError')


//Checks if the user is logged in before continuing 
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {

        if (req.method === 'GET') {
            req.session.returnTo = req.originalUrl;
        } else if (req.get('referer')) {
            req.session.returnTo = req.get('referer');
        } else {
            req.session.returnTo = '/posts';
        }


        req.flash('error', 'You must be signed in.')
        return res.redirect('/login')
    }
    next();
}


module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}


//Validates the Post against the Joi Schema
module.exports.validatePost = (req, res, next) => {

    const { error } = postSchema.validate(req.body);

    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }

}

//Checks if user is the author of the post
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/posts/${id}`);
    }
    next();
}


//Checks if user is the author of the review
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/posts/${id}`);
    }
    next();
}

//Function that validates the Review against the Joi Schema
module.exports.validateReview = (req, res, next) => {

    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }

}

//Function that validates the Thread/Question against the Joi Schema
module.exports.validateThread = (req, res, next) => {

    const { error } = threadSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }

}

//Checks if user is the author of the thread
module.exports.isThreadAuthor = async (req, res, next) => {
    const { id } = req.params;
    const thread = await Thread.findById(id);

    if (!thread.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/forum/${id}`);
    }
    next();
}

//Function that validates the Reply against the Joi Schema
module.exports.validateReply = (req, res, next) => {

    const { error } = replySchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }

}

//Checks if user is the author of the reply
module.exports.isReplyAuthor = async (req, res, next) => {
    const { id, replyId } = req.params;
    const reply = await Reply.findById(replyId);

    if (!reply.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/forum/${id}`);
    }
    next();
}
