const mongoose = require('mongoose');

const Reply = require('./reply')
const Schema = mongoose.Schema;


const ThreadSchema = new Schema({

    title: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).filter(Boolean).length <= 20;
            },
            message: 'Title must not exceed 20 words.'
        }
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    body: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).filter(Boolean).length <= 300;
            },
            message: 'Title must not exceed 300 words.'
        }
    },

    replies: [{
        type: Schema.Types.ObjectId,
        ref: 'Reply'
    }]

}, { timestamps: true });

ThreadSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Reply.deleteMany({
            _id: {
                $in: doc.replies
            }
        })
    }
})

module.exports = mongoose.model('Thread', ThreadSchema);

