
const cloudinary = require('cloudinary').v2;
const cron = require('node-cron');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})


// Schedule: runs every night at 2:00 AM
cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running temp image cleanup...');

    try {
        const { resources } = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'HomeMakersDIY/TempImages/',
            max_results: 500,
        });

        const now = new Date();

        for (const image of resources) {
            const createdAt = new Date(image.created_at);
            const ageInHours = (now - createdAt) / (1000 * 60 * 60);

            if (ageInHours > 24) {
                await cloudinary.uploader.destroy(image.public_id);
                console.log(`Deleted stale image: ${image.public_id}`);
            }
        }

        console.log('[CRON] Temp image cleanup finished.');
    } catch (err) {
        console.error('Error during temp image cleanup:', err);
    }
});


