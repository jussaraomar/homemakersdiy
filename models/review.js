const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: {
        type: String,
    },
    filename: {
        type: String,
    }
})


ImageSchema.virtual('preview').get(function () {
    return this.url.replace('/upload', '/upload/w_200')
})

const ReviewSchema = new Schema({

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
    image: ImageSchema,
    rating: Number,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },


}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);

