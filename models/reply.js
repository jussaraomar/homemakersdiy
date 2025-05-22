const mongoose = require('mongoose');
const Schema = mongoose.Schema;




const ReplySchema = new mongoose.Schema({
    body: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).filter(Boolean).length <= 300;
            },
            message: 'Reply must not exceed 300 words.'
        }
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    votes: { type: Number, default: 0 },
    votedBy: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        vote: { type: Number, enum: [1, -1] }
    }]

}, { timestamps: true });

module.exports = mongoose.model('Reply', ReplySchema);
