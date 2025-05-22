

// Show More logic for the tags list 
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.toggle-tags-btn').forEach(button => {
        button.addEventListener('click', () => {
            const postId = button.getAttribute('data-post-id');
            const tags = document.querySelectorAll(`.extra-tag-${postId}`);

            tags.forEach((tag, i) => {
                if (i >= 8) {
                    tag.classList.toggle('d-none');
                    tag.classList.toggle('d-inline-flex');
                }
            });

            button.textContent = button.textContent === 'Show More' ? 'Show Less' : 'Show More';
        });
    });
});


//Delete Modal
document.addEventListener("DOMContentLoaded", function () {
    let targetForm = null;

    const deleteButtons = document.querySelectorAll(".open-delete-modal");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const confirmModal = new bootstrap.Modal(document.getElementById("confirmDeleteModal"));

    deleteButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            targetForm = this.closest("form");
            confirmModal.show();
        });
    });

    confirmBtn.addEventListener("click", function () {
        if (targetForm) {
            targetForm.submit();
        }
    });
});

// Word Counters 
function setupWordCounters(fields, formId) {
    const form = document.getElementById(formId);
    const limits = {};
    const errorMsg = document.getElementById('form-error-msg');

    if (!form) return;


    fields.forEach(({ id, max }) => {
        const input = document.getElementById(id);
        const counter = document.getElementById(`${id}-count`);
        if (!input || !counter) return;

        const update = () => {
            const words = input.value.trim().split(/\s+/).filter(Boolean);
            const count = words.length;
            counter.textContent = `${count} / ${max} words`;
            counter.style.color = count > max ? 'red' : '';
            limits[id] = count <= max;
        };

        input.addEventListener('input', update);
        update();
    });


    function checkValidity() {
        return Object.values(limits).every(Boolean);
    }

    form.addEventListener('submit', function (e) {
        if (!checkValidity()) {
            e.preventDefault();
            if (errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else if (errorMsg) {
            errorMsg.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    setupWordCounters([
        { id: 'title', max: 20 },
        { id: 'description', max: 50 },
    ], 'post-form');

    setupWordCounters([
        { id: 'title', max: 20 },
        { id: 'description', max: 50 },
    ], 'edit-post-form');

    setupWordCounters([
        { id: 'body', max: 300 },
    ], 'review-form');

    setupWordCounters([
        { id: 'title', max: 20 },
        { id: 'body', max: 300 },
    ], 'thread-form');

    setupWordCounters([
        { id: 'body', max: 300 },
    ], 'reply-form');

    setupWordCounters([
        { id: 'newBio', max: 50 },
    ], 'change-bio-form');
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#post-form');

    form.addEventListener('submit', (e) => {
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;

        if (profanity.isProfane(title) || profanity.isProfane(description)) {
            e.preventDefault();
            alert("Please remove inappropriate content before submitting.");
        }
    });
})


const validFeedback = input.parentElement.querySelector('.valid-feedback');

const update = () => {
    const words = input.value.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    counter.textContent = `${count} / ${max} words`;
    counter.style.color = count > max ? 'red' : '';
    limits[id] = count <= max;

    if (validFeedback) {
        validFeedback.style.display = count > max ? 'none' : 'block';
    }
};


