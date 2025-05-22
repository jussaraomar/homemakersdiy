
const mongoose = require('mongoose');
const { diyProjects } = require('./seedHelpers')

const Post = require('../models/post')

mongoose.connect('mongodb://127.0.0.1:27017/home-makers-diy');


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection eror:'));
db.once('open', () => {
    console.log("Database connected");
});

const seedDB = async () => {
    await Post.deleteMany({});

    for (let i = 0; i < 15; i++) {
        const post = new Post({
            author: '68022131857418049d62938a',
            title: `${diyProjects[i].title}`,
            description: `${diyProjects[i].description}`,
            thumbnail: {
                url: 'https://res.cloudinary.com/dyyeqgu18/image/upload/v1745093774/HomeMakersDIY/dufjrweik8vazinwnaoe.jpg',
                filename: 'HomeMakersDIY/dufjrweik8vazinwnaoe'
            },
            status: 'published'


        })

        await post.save();
    }



}

seedDB().then(() => {
    mongoose.connection.close();
});

