const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');
const leoProfanity = require('leo-profanity');
const striptags = require('striptags');

leoProfanity.loadDictionary();


// EscapeHTML function that helps with sanitizing the inputs from the forms
const extension = (joi) => ({
    type: "string",
    base: joi.string(),
    messages: {
        "string.escapeHTML": "{{#label}} must not include HTML!",
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            },
        },
    },
});

// Function that sets a word limit for the inputs from the forms
const wordLimit = (maxWords) => (value, helpers) => {
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > maxWords) {
        return helpers.error('string.wordLimit', { maxWords });
    }
    return value;
};

//Function that checks inputs for profanity
const profanityValidator = (value, helpers) => {

    if (leoProfanity.check(striptags(value || ''))) {
        return helpers.message('Contains inappropriate language.');
    }
    return value;
};


const Joi = BaseJoi.extend(extension)

//Joi Schema for the post
module.exports.postSchema = Joi.object({
    post: Joi.object({
        title: Joi.string().required().escapeHTML().custom(profanityValidator).custom(wordLimit(20), 'Title word limit').messages({
            'string.wordLimit': 'Title must not exceed {#maxWords} words.',
        }),
        description: Joi.string().required().escapeHTML().custom(profanityValidator).custom(wordLimit(50), 'Description word limit').messages({
            'string.wordLimit': 'Description must not exceed {#maxWords} words.',
        }),
        content: Joi.string().custom(profanityValidator).required(),
        imageUrls: Joi.array(),
        status: Joi.string().valid('draft', 'published').required(),
        tags: Joi.array(),
        thumbnail: Joi.string()

    }).required()
})


//Joi Schema for the review
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().min(1).max(5),

        body: Joi.string().required().escapeHTML().custom(profanityValidator).custom(wordLimit(300), 'Review word limit').messages({
            'string.wordLimit': 'Review must not exceed {#maxWords} words.',
        }),
    }).required()
})

//Joi Schema for the threads/questions
module.exports.threadSchema = Joi.object({
    thread: Joi.object({
        title: Joi.string().required().escapeHTML().custom(wordLimit(20), 'Title word limit').messages({
            'string.wordLimit': 'Title must not exceed {#maxWords} words.',
        }),
        body: Joi.string().required().escapeHTML().custom(wordLimit(300), 'Body word limit').messages({
            'string.wordLimit': 'Body must not exceed {#maxWords} words.',
        }),

    }).required()
})


//Joi Schema for the replies
module.exports.replySchema = Joi.object({
    reply: Joi.object({
        body: Joi.string().required().escapeHTML().custom(wordLimit(300), 'Reply word limit').messages({
            'string.wordLimit': 'Reply must not exceed {#maxWords} words.',
        }),

    }).required()
})