const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;

const ThumbnailSchema = new Schema({
    url: {
        type: String,
        default: '/images/default-thumbnail-2.svg'
    },
    filename: {
        type: String,
        default: 'default-thumbnail-2.svg'
    }
})

ThumbnailSchema.virtual('preview').get(function () {
    return this.url.replace('/upload', '/upload/w_200')
})

const PostSchema = new Schema({
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
    description: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).filter(Boolean).length <= 50;
            },
            message: 'Description must not exceed 50 words.'
        }
    },
    thumbnail: ThumbnailSchema,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    content: {
        type: String,
        required: true
    },
    imageUrls: [
        {
            type: String,
        }
    ],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    tags: [String],
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]

}, { timestamps: true });

PostSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Post', PostSchema);

