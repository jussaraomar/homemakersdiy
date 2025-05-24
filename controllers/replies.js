const Thread = require('../models/thread.js')
const Reply = require('../models/reply.js')

// Creates Reply on forum post
module.exports.createReply = async (req, res) => {
    const thread = await Thread.findById(req.params.id)


    const reply = new Reply(req.body.reply)

    reply.author = req.user._id;
    thread.replies.push(reply);
    await reply.save();
    await thread.save();

    req.flash('success', 'Successfully created new reply!')
    res.redirect(`/forum/${thread._id}`)
}


// Upvote or Downvote replies on the forum thread
// Replies with the most votes go to the top
module.exports.voteReply = async (req, res) => {

    const thread = await Thread.findById(req.params.id)

    const { replyId } = req.params;
    const userId = req.user._id;
    const voteType = req.body.voteType; //upvote or downvote

    const reply = await Reply.findById(replyId);

    const newVote = voteType === 'up' ? 1 : -1;
    const existingVote = reply.votedBy.find(v => v.userId.equals(userId));

    if (!existingVote) {
        reply.votedBy.push({ userId, vote: newVote });
        reply.votes += newVote;
    } else if (existingVote.vote === newVote) {
        reply.votedBy = reply.votedBy.filter(v => !v.userId.equals(userId));
        reply.votes -= newVote;
    } else {
        reply.votes += 2 * newVote;
        existingVote.vote = newVote;
    }

    await reply.save();
    res.redirect(`/forum/${thread._id}`);
};


// Deletes Reply
module.exports.deleteReply = async (req, res) => {

    const { id, replyId } = req.params;

    await Thread.findByIdAndUpdate(id, { $pull: { replies: replyId } });
    await Reply.findByIdAndDelete(replyId)

    req.flash('success', 'Successfully deleted reply!')
    res.redirect(`/forum/${id}`)

}