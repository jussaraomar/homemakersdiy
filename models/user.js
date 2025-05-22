const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')


const ProfilePictureSchema = new Schema({
    url: {
        type: String,
    },
    filename: String
})

// Option to have the Profile Picture with the width of 200px by using .pfp instead of .url
ProfilePictureSchema.virtual('pfp').get(function () {
    return this.url.replace('/upload', '/upload/w_200')
})



const UserSchema = new Schema({

    email: {
        type: String,
        required: true,
        unique: true
    },
    profilePicture: ProfilePictureSchema,
    bio: {
        type: String,
        default: 'Hi There!👋',
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).filter(Boolean).length <= 40;
            },
            message: 'Title must not exceed 40 words.'
        }
    },
    bookmarks: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
}, { timestamps: true });



// Sets rules on password
UserSchema.plugin(passportLocalMongoose, {
    passwordValidator: function (password, cb) {
        if (password.length < 6) {
            return cb('Password must be at least 6 characters');
        }
        if (!/\d/.test(password)) {
            return cb('Password must contain at least one number');
        }
        cb();
    }
});


module.exports = mongoose.model('User', UserSchema);

