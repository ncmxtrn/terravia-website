document.addEventListener('DOMContentLoaded', function() {

    const header = document.getElementById('main-header');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    // 1. Sticky Header
    // Adds a 'scrolled' class to the header when the page is scrolled down.
    function handleScroll() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleScroll);

    // 2. Mobile Menu Toggle
    // Toggles the 'nav-open' class on the header to show/hide the mobile menu.
    function toggleMobileMenu() {
        header.classList.toggle('nav-open');
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Optional: Close mobile menu when a link is clicked
    if (navLinks) {
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && header.classList.contains('nav-open')) {
                header.classList.remove('nav-open');
            }
        });
    }

});
