const leoProfanity = require('leo-profanity');
leoProfanity.loadDictionary();
const striptags = require('striptags');


const Post = require('../models/post')
const User = require('../models/user')


const { cloudinary } = require('../cloudinary/index')
const escapeRegex = require('../utilities/escapeRegex')


//Extracts image urls from html content and returns them
function extractImageUrls(html) {
    const urls = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        urls.push(match[1]);
    }
    return urls;
}

//Extracts the public id from a cloudinary image url
function extractPublicIdFromUrl(url) {
    const path = new URL(url).pathname;
    const parts = path.split('/');

    // index of upload
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;


    const publicIdParts = parts.slice(uploadIndex + 2); // +1 for upload and +1 to skip version (add +1 for every extra /../ in the url like dimensions)

    const filename = publicIdParts.pop();
    const nameWithoutExt = filename.split('.')[0];

    const folderPath = publicIdParts.join('/');
    return folderPath ? `${folderPath}/${nameWithoutExt}` : nameWithoutExt;
}


//Search all posts
//Takes into account any filter options that were selected
module.exports.searchPosts = async (req, res) => {
    const rawQuery = req.query.q || '';
    const query = escapeRegex(rawQuery);
    const selectedTags = req.query.tags || [];
    const sort = req.query.sort || 'newest';

    // Searches the title and description of all published posts
    const textSearchFilter = {
        status: 'published',
        $or: [
            { title: new RegExp(query, 'i') },
            { description: new RegExp(query, 'i') },
        ]
    };

    if (selectedTags.length) {
        textSearchFilter.tags = {
            $in: Array.isArray(selectedTags) ? selectedTags : [selectedTags]
        };
    }

    let posts;

    if (sort === 'likes') {
        posts = await Post.aggregate([
            { $match: textSearchFilter },
            {
                $addFields: {
                    likesCount: { $size: "$likes" }
                }
            },
            { $sort: { likesCount: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: "$author"
            }
        ]);
    } else {
        const sortOption = {};
        if (sort === 'newest') sortOption.createdAt = -1;
        else if (sort === 'oldest') sortOption.createdAt = 1;

        posts = await Post.find(textSearchFilter)
            .sort(sortOption)
            .populate('author');
    }

    res.render('posts/postSearchResults', {
        posts,
        query: rawQuery,
        tags: selectedTags,
        sort
    });
};


//Renders the posts index page taking into account any filters selected
module.exports.index = async (req, res) => {
    const query = req.query.q || '';
    const selectedTags = req.query.tags || [];
    const sort = req.query.sort || 'newest';
    const filter = { status: 'published' };

    if (selectedTags.length) {
        filter.tags = { $in: Array.isArray(selectedTags) ? selectedTags : [selectedTags] };
    }


    let posts;

    if (sort === 'likes') {
        posts = await Post.aggregate([
            { $match: filter },
            {
                $addFields: {
                    likesCount: { $size: "$likes" }
                }
            },
            { $sort: { likesCount: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: "$author"
            }
        ]);
    } else {
        const sortOption = {};
        if (sort === 'newest') sortOption.createdAt = -1;
        else if (sort === 'oldest') sortOption.createdAt = 1;

        posts = await Post.find(filter)
            .sort(sortOption)
            .populate('author');
    }

    res.render('posts/index', { posts, tags: selectedTags, sort, query });
};



//Renders 'New Post' page
module.exports.renderNewPostForm = (req, res) => {
    res.render('posts/new');
}


//Creates Post (Published or Draft) 
module.exports.createPost = async (req, res, next) => {
    const post = new Post(req.body.post);
    const user = await User.findById(req.user._id);

    let { title, description, content, status } = req.body.post;

    // Profanity check
    const hasProfanity =
        leoProfanity.check(title) ||
        leoProfanity.check(description) ||
        leoProfanity.check(striptags(content || ''));

    if (hasProfanity) {
        req.flash('error', 'Please remove inappropriate language before submitting.');
        const returnTo = req.get('referer') || `/posts/new`;
        return res.redirect(returnTo);
    }

    const imageUrls = extractImageUrls(post.content);
    const movedUrls = [];

    //Renames the image public ids from TempImages to ContentImages when they are published/drafted
    //This permanently stores any uploaded images that are not in the TempImages folder since those will be deleted later
    for (const url of imageUrls) {
        if (url.includes('HomeMakersDIY/TempImages')) {
            const publicId = url.split('/').pop().split('.')[0];

            try {
                // Move image to permanent folder
                const result = await cloudinary.uploader.rename(
                    `HomeMakersDIY/TempImages/${publicId}`,
                    `HomeMakersDIY/ContentImages/${publicId}`
                );

                const newUrl = result.secure_url;
                movedUrls.push({ old: url, new: newUrl });
            } catch (err) {
                console.error('Cloudinary rename failed:', err);
            }
        }
    }

    // Replaces old URLs with new ones in post content
    let updatedContent = post.content;
    for (const { old, new: newUrl } of movedUrls) {
        updatedContent = updatedContent.replaceAll(old, newUrl);
    }

    post.content = updatedContent;
    post.imageUrls = extractImageUrls(updatedContent);


    post.thumbnail = req.file
        ? { url: req.file.path, filename: req.file.filename }
        : {
            url: '/images/default-thumbnail-2.svg',
            filename: 'default-thumbnail-2.svg'
        };
    post.author = req.user._id;
    post.status = req.body.post.status || 'draft';

    await post.save();

    req.flash('success', `Post ${post.status === 'draft' ? 'saved as draft' : 'published'}!`);

    if (post.status === 'draft') {
        return res.redirect(`/users/${user._id}`);
    }
    res.redirect(`/posts/${post._id}`);
};


//Renders the 'Show Post' page
module.exports.showPost = async (req, res) => {

    const post = await Post.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');


    if (!post) {
        req.flash('error', 'Post does not exist!');
        return res.redirect('/posts')
    }

    //prevents users form accessing drafted posts
    if (post.status === 'draft' && (!req.user || !post.author.equals(req.user._id))) {
        req.flash('error', 'You are not authorized to view this post.');
        return res.redirect('/posts');
    }

    res.render('posts/show', { post });
}

// Renders The 'Edit Post' page
module.exports.renderEditPostForm = async (req, res) => {

    const post = await Post.findById(req.params.id)

    if (!post) {
        req.flash('error', 'Post does not exist!');
        return res.redirect('/posts')
    }

    res.render('posts/edit', { post });
}

// Updates the post according to any changes made on 'Edit Post'
module.exports.updatePost = async (req, res) => {


    const { id } = req.params;
    const oldThumbnail = await Post.findById(id)
    const user = await User.findById(req.user._id);
    const post = await Post.findByIdAndUpdate(id, { ...req.body.post }, { new: true })



    const imageUrls = extractImageUrls(post.content);
    post.imageUrls = imageUrls;

    post.status = req.body.post.status || 'draft';


    if (req.file) {
        await cloudinary.uploader.destroy(oldThumbnail.thumbnail.filename)
        post.thumbnail = { url: req.file.path, filename: req.file.filename }
        await post.save();
    }


    req.flash('success', `Post ${post.status === 'draft' ? 'saved as draft' : 'published'}!`)

    if (post.status === 'draft') {
        return res.redirect(`/users/${user._id}`);
    }
    res.redirect(`/posts/${post._id}`)
}


// Like a post
module.exports.likePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        await post.save();
    }

    res.redirect(req.get('referer') || `/posts/${post._id}`);
};

// Unlike a post
module.exports.unlikePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    await post.save();


    res.redirect(req.get('referer') || `/posts/${post._id}`);
};


// Bookmark a post
module.exports.bookmarkPost = async (req, res) => {

    const rawQuery = req.query.q || '';
    const query = escapeRegex(rawQuery);
    const selectedTags = req.query.tags || [];
    const sort = req.query.sort || '';


    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!user.bookmarks.includes(post._id)) {
        user.bookmarks.push(post._id);
        await user.save();
    }


    //Returns the user according to the page they came from
    const from = req.query.from;
    if (from === 'posts') return res.redirect('/posts');
    if (from === 'profile') return res.redirect(`/users/${user._id}`);
    if (from === 'post-show') return res.redirect(`/posts/${post._id}`);
    if (from === 'posts-search') {
        const tagParams = Array.isArray(selectedTags)
            ? selectedTags.map(t => `&tags[]=${encodeURIComponent(t)}`).join('')
            : `&tags[]=${encodeURIComponent(selectedTags)}`;

        const sortParam = sort ? `&sort=${encodeURIComponent(sort)}` : '';
        return res.redirect(`/posts/search?q=${encodeURIComponent(query)}${tagParams}${sortParam}`);
    }

    res.redirect('/'); // fallback


};

// Remove from bookmarks
module.exports.unmarkPost = async (req, res) => {

    const rawQuery = req.query.q || '';
    const query = escapeRegex(rawQuery);
    const selectedTags = req.query.tags || [];
    const sort = req.query.sort || '';


    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.user._id);
    user.bookmarks = user.bookmarks.filter(
        fav => fav.toString() !== req.params.id
    );
    await user.save();

    //Returns the user according to the page they came from
    const from = req.query.from;
    if (from === 'posts') return res.redirect('/posts');
    if (from === 'profile') return res.redirect(`/users/${user._id}`);
    if (from === 'post-show') return res.redirect(`/posts/${post._id}`);
    if (from === 'posts-search') {
        const tagParams = Array.isArray(selectedTags)
            ? selectedTags.map(t => `&tags[]=${encodeURIComponent(t)}`).join('')
            : `&tags[]=${encodeURIComponent(selectedTags)}`;

        const sortParam = sort ? `&sort=${encodeURIComponent(sort)}` : '';
        return res.redirect(`/posts/search?q=${encodeURIComponent(query)}${tagParams}${sortParam}`);
    }


    res.redirect('/');


};




module.exports.deletePost = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    const post = await Post.findById(id);
    if (!post) {
        req.flash('error', 'Post not found.');
        return res.redirect('/posts');
    }


    // Deletes the images of the post from the cloudinary 
    if (post.imageUrls && post.imageUrls.length > 0) {
        for (const url of post.imageUrls) {
            const match = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
            if (match && match[1]) {
                const publicId = match[1];
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.error(`Failed to delete image: ${publicId}`, err);
                }
            }
        }
    }

    // Deletes the thumbnail of the post from the cloudinary 
    if (post.thumbnail?.filename && !post.thumbnail.url.includes('/images/default-thumbnail-2')) {
        try {
            await cloudinary.uploader.destroy(post.thumbnail.filename);
        } catch (err) {
            console.error(`Failed to delete thumbnail: ${post.thumbnail.filename}`, err);
        }
    }

    await Post.findByIdAndDelete(id)
    req.flash('success', 'Successfully deleted post!')


    const from = req.query.from;
    if (from === 'profile') {
        return res.redirect(`/users/${user._id}`);
    } else {
        res.redirect(`/posts`)
    }


}

// When a user uploads an image to the editor the image is directly stored in cloudinary
// If the user backspaces/removes images from the editor using the keyboard
// -this function deletes those images
// Since I implemented the TempImages logic in createPost this is not necessarily needed anymore
// But i will still keep this since it was the first solution i came up with

module.exports.deleteImages = async (req, res) => {
    const { removedImages } = req.body;
    console.log('images to be removed:', removedImages);

    try {
        const results = await Promise.all(
            removedImages.map(async (url) => {
                const publicId = extractPublicIdFromUrl(url);
                console.log('Deleting publicId:', publicId);
                return await cloudinary.uploader.destroy(publicId);
            })
        );
        res.json({ success: true, results });
    } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}