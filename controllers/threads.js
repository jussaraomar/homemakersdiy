const Thread = require('../models/thread')
const escapeRegex = require('../utilities/escapeRegex')

// Renders forum index page 
module.exports.index = async (req, res) => {

    const query = req.query.q || '';
    const sort = req.query.sort || 'newest';


    let sortOption = {};
    if (sort === 'newest') sortOption.createdAt = -1;
    else if (sort === 'oldest') sortOption.createdAt = 1;

    const threads = await Thread.find({}).sort(sortOption).populate('author');

    res.render('forum/index', { threads, sort, query })
}

// Search all threads
module.exports.searchThreads = async (req, res) => {

    const rawQuery = req.query.q || '';
    const query = escapeRegex(rawQuery);
    const sort = req.query.sort || '';

    const filter = {
        $or: [
            { title: new RegExp(query, 'i') },
            { body: new RegExp(query, 'i') }
        ]
    };


    // Sorting
    let sortOption = {};
    if (sort === 'newest') sortOption.createdAt = -1;
    else if (sort === 'oldest') sortOption.createdAt = 1;

    const threads = await Thread.find(filter).sort(sortOption).populate('author');

    res.render('forum/forumSearchResults', { threads, query, sort });
};



// Renders 'New Thread' page
module.exports.renderNewThreadForm = (req, res) => {
    res.render('forum/new');
}

// Creates a Thread
module.exports.createThread = async (req, res, next) => {


    const thread = new Thread(req.body.thread)
    thread.author = req.user._id;
    console.log(thread)

    await thread.save();

    //flash after successfully saving
    req.flash('success', 'Successfully made a new thread!')
    res.redirect(`/forum/${thread._id}`)

}

// Renders 'Show Thread' page
module.exports.showThread = async (req, res) => {

    const thread = await Thread.findById(req.params.id).populate({
        path: 'replies',
        populate: [
            { path: 'author' },
            { path: 'votedBy.userId' }
        ]
    }).populate('author');

    thread.replies.sort((a, b) => b.votes - a.votes);

    if (!thread) {
        req.flash('error', 'Thread does not exist!');
        return res.redirect('/forum')
    }

    res.render('forum/show', { thread });
}

// Deletes Thread
module.exports.deleteThread = async (req, res) => {
    const { id } = req.params;
    await Thread.findByIdAndDelete(id)
    const thread = await Thread.findById(req.params.id)
    req.flash('success', 'Successfully deletetd thread!')
    res.redirect(`/forum`)
}

