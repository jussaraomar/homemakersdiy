const tabButtons = document.querySelectorAll(".nav ul li");
const tabs = document.querySelectorAll(".tab");




tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        // Removes 'active' class from all buttons
        tabButtons.forEach(btn => btn.classList.remove("active"));

        // Hides all tabs
        tabs.forEach(tab => tab.style.display = "none");

        // Adds 'active' class to clicked button
        button.classList.add("active");

        // Shows the corresponding tab
        tabs[index].style.display = "block";
    });
});

// Initializes the first tab as visible
tabs[0].style.display = "block";


