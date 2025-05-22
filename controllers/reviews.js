const Post = require('../models/post.js')
const Review = require('../models/review.js')
const { cloudinary } = require('../cloudinary/index')

// Creates Review
module.exports.createReview = async (req, res) => {
    const post = await Post.findById(req.params.id)

    //how its structured in the form all under review
    const review = new Review(req.body.review)
    review.author = req.user._id;

    if (req.file) {
        review.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    post.reviews.push(review);
    await review.save();
    await post.save();

    req.flash('success', 'Successfully created new review!')
    res.redirect(`/posts/${post._id}`)
}

// Deletes review
module.exports.deleteReview = async (req, res) => {

    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    await Post.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    if (review.image && review.image.filename) {
        await cloudinary.uploader.destroy(review.image.filename);
    }

    await Review.findByIdAndDelete(reviewId)

    req.flash('success', 'Successfully deleted review!')
    res.redirect(`/posts/${id}`)

}