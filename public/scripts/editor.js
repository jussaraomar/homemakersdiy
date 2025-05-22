
let initialImages = new Set();
let uploadedImages = new Set();


// TinyMCE Initialization
tinymce.init({
    selector: 'textarea#content',
    plugins: 'lists link image table wordcount',
    paste_data_images: false,
    powerpaste_allow_local_images: false,
    image_dimensions: false,
    object_resizing: false,
    min_height: 800,
    content_style: `
    img {
      max-width: 100%;
      height: auto;
    }
  `,
    toolbar: 'undo redo | styles | bold italic | alignleft aligncenter alignright alignjustify | link image | outdent indent ',


    images_upload_handler: function (blobInfo, progress) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', blobInfo.blob(), blobInfo.filename());
            formData.append('upload_preset', 'unsigned_uploads');
            formData.append('folder', 'HomeMakersDIY/TempImages');

            const content = tinymce.activeEditor.getContent();
            const imgCount = (content.match(/<img/g) || []).length;
            const maxSize = 3 * 1024 * 1024; // 3MB 




            //Limits number of images uploaded
            if (imgCount >= 10) {
                reject('Maximum of 10 images allowed per post');
                return;
            }


            //Limits image file size
            if (blobInfo.blob().size > maxSize) {
                reject('Image is too large. Maximum size is 3MB.');
                return;
            }

            const xhr = new XMLHttpRequest();

            xhr.open('POST', 'https://api.cloudinary.com/v1_1/dyyeqgu18/image/upload');


            xhr.upload.onprogress = (e) => {
                progress(e.loaded / e.total * 100);
            };

            xhr.onload = function () {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    uploadedImages.add(response.secure_url);
                    resolve(response.secure_url);

                } else {
                    reject('Upload failed');
                }
            };

            xhr.onerror = function () {
                console.error('Upload failed:', xhr.status, xhr.responseText);
                reject('Upload failed: ' + xhr.status + ' ' + xhr.responseText);
            };

            xhr.send(formData);
        });
    },

    setup: function (editor) {

        editor.on('init', function () {
            const initialContent = editor.getContent();
            const imgRegex = /<img[^>]+src="([^">]+)"/g;
            let match;
            while ((match = imgRegex.exec(initialContent))) {
                initialImages.add(match[1]);
            }

        });

        //Checking if there are changes in the textarea
        editor.on('change input keyup', function () {
            window.isFormDirty = true;

        });

    },

});


// Logic for destroying erased/backspaced images from cloudinary
// Compares all images uploaded with all images present at publishing and removes the difference

const postForm = document.getElementById('post-form');
if (postForm) {
    postForm.addEventListener('submit', async function (e) {

        tinymce.triggerSave();

        const content = tinymce.get('content').getContent();

        // Extract image URLs from current editor content
        const currentImages = new Set();
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        while ((match = imgRegex.exec(content))) {
            currentImages.add(match[1]);
        }

        // Find removed images
        const removedImages = [...uploadedImages].filter(url => !currentImages.has(url));

        //Deletes images from Cloudiary
        if (removedImages.length > 0) {
            await fetch('cloudinary/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    removedImages,

                })
            });
        }


    });
}


const editPostForm = document.getElementById('edit-post-form');
if (editPostForm) {

    editPostForm.addEventListener('submit', async function (e) {


        tinymce.triggerSave();
        const content = tinymce.get('content').getContent();

        // Extract final images in the content
        const currentImages = new Set();
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        while ((match = imgRegex.exec(content))) {
            currentImages.add(match[1]);
        }

        // Determine images to delete
        const allKnownImages = new Set([...initialImages, ...uploadedImages]);
        const removedImages = [...allKnownImages].filter(url => !currentImages.has(url));



        try {
            // Send delete request to server
            if (removedImages.length > 0) {
                await fetch('/posts/cloudinary/delete-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ removedImages })
                });
            }
        } catch (err) {
            console.error('Failed to delete removed images:', err);
        }



    });


}




