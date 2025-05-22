const leoProfanity = require('leo-profanity');
leoProfanity.loadDictionary();

const User = require('../models/user');
const Post = require('../models/post');
const Thread = require('../models/thread');
const Reply = require('../models/reply');
const Review = require('../models/review');


const { cloudinary } = require('../cloudinary/index')


// Renders 'Register' page
module.exports.renderRegister = (req, res) => {
    res.render('users/register')
}

// Registers a user
module.exports.register = async (req, res, next) => {

    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);

        req.login(registeredUser, err => {
            if (err) return next(err)
            req.flash('success', 'Welcome to Home Makers DIY');
            res.redirect('/posts')
        })

    } catch (e) {
        req.flash('error', e.message)
        res.redirect('/register')
    }

}

// Renders 'Login' page
module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

// Logins user
module.exports.login = async (req, res) => {
    req.flash('success', 'Welcome Back!');

    const redirectUrl = res.locals.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

// Logs out user
module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
}


// Renders Profile page
module.exports.renderProfile = async (req, res) => {

    const user = await User.findById(req.params.id).populate('bookmarks');

    if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/');
    }


    const publishedPosts = await Post.find({
        author: req.params.id,
        status: 'published'
    });

    const threads = await Thread.find({ author: req.params.id }).populate('author');

    const drafts = req.user._id.equals(req.params.id)
        ? await Post.find({ author: req.params.id, status: 'draft' })
        : [];

    res.render('users/profile', { user, publishedPosts, drafts, threads });
}


// Change Username
module.exports.changeUsername = async (req, res) => {
    const { username } = req.body;

    try {
        const user = await User.findById(req.user._id);

        user.username = username;
        await user.save();
        req.flash('success', 'Username updated!');
        res.redirect(`/users/${user._id}`);
    } catch (err) {
        if (err.code === 11000) {
            req.flash('error', 'That username is already taken. Please choose another.');
        } else {
            console.error(err);
            req.flash('error', 'There was an error updating your username.');
        }
        res.redirect(`/users/${user._id}`);
    }
};


// Change Email
module.exports.changeEmail = async (req, res) => {
    const { email } = req.body;
    const user = await User.findById(req.user._id);
    user.email = email;
    await user.save();
    req.flash('success', 'Email updated!');
    res.redirect(`/users/${user._id}`);
};

// Change Bio
module.exports.changeBio = async (req, res) => {

    const { bio } = req.body;

    const user = await User.findById(req.user._id);

    const hasProfanity = leoProfanity.check(bio);

    if (hasProfanity) {
        req.flash('error', 'Bio must not contain inappropriate language.');
        const returnTo = req.get('referer') || `/users/${user._id}`;
        return res.redirect(returnTo);
    }

    user.bio = bio;
    await user.save();
    req.flash('success', 'Bio updated!');
    res.redirect(`/users/${user._id}`);
};

// Change Password
module.exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    try {
        await user.changePassword(currentPassword, newPassword);
        await user.save();
        req.flash('success', 'Password updated!');
        res.redirect(`/users/${user._id}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Incorrect current password or error updating.');
        res.redirect(`/users/${user._id}`);
    }
};

// Change Profile Picture
module.exports.changePfp = async (req, res) => {

    if (!req.file) {
        req.flash('error', 'No file uploaded.');
        res.redirect(`/users/${user._id}`);
    }


    const user = await User.findById(req.user._id);

    if (user.profilePicture && user.profilePicture.filename) {
        try {
            await cloudinary.uploader.destroy(user.profilePicture.filename);
        } catch (err) {
            console.error('Error deleting old profile picture:', err);
            req.flash('error', 'Something went wrong while removing the old picture.');
            return res.redirect(`/users/${user._id}`);
        }
    }

    user.profilePicture = {
        url: req.file.path,
        filename: req.file.filename
    };
    await user.save();
    req.flash('success', 'Profile picture updated!');
    res.redirect(`/users/${user._id}`);
};

module.exports.deleteAccount = async (req, res) => {

    const userId = req.user._id;

    try {

        const user = await User.findById(userId);
        // Find all posts (drafts and published)
        const posts = await Post.find({ author: userId });

        for (const post of posts) {
            // Delete thumbnail from Cloudinary
            if (post.thumbnail && post.thumbnail.filename) {
                await cloudinary.uploader.destroy(post.thumbnail.filename);
            }

            // Delete content images from Cloudinary
            if (post.imageUrls && post.imageUrls.length > 0) {
                for (const url of post.imageUrls) {
                    const match = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
                    if (match && match[1]) {
                        await cloudinary.uploader.destroy(match[1]);
                    }
                }
            }

            // Delete reviews on this post
            await Review.deleteMany({ post: post._id });

            // Delete post
            await Post.findByIdAndDelete(post._id);
        }

        // Delete forum threads and their replies
        const threads = await Thread.find({ author: userId });
        for (const thread of threads) {
            await Reply.deleteMany({ thread: thread._id });
            await Thread.findByIdAndDelete(thread._id);
        }

        // Delete replies user made to other threads
        await Reply.deleteMany({ author: userId });

        // Delete reviews user made on other posts
        const userReviews = await Review.find({ author: userId });
        for (const review of userReviews) {
            if (review.image && review.image.filename) {
                await cloudinary.uploader.destroy(review.image.filename);
            }
        }
        await Review.deleteMany({ author: userId });


        await Post.updateMany(
            { likes: userId },
            { $pull: { likes: userId } }
        );


        if (
            user.profilePicture &&
            user.profilePicture.filename &&
            !user.profilePicture.url.includes('/images/profile.svg')
        ) {
            await cloudinary.uploader.destroy(user.profilePicture.filename);
        }
        // Delete the user
        await User.findByIdAndDelete(userId);

        // Log them out
        req.logout(err => {
            if (err) {
                req.flash('error', 'There was a problem logging out.');
                return res.redirect('/');
            }
            req.flash('success', 'Your account and all related data were deleted.');
            res.redirect('/');
        });

    } catch (err) {
        console.error('Account deletion failed:', err);
        req.flash('error', 'Failed to delete account.');
        res.redirect(`/users/${userId}`);
    }
}