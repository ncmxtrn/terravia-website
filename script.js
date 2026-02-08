// On attend que toute la page soit chargée (images, styles, scripts)
window.addEventListener("load", () => {
    
    // Petite astuce UX (Expérience Utilisateur) :
    // On ajoute une classe "is-loading" au <body> dans le HTML qui cache tout (opacity: 0).
    // Une fois que tout est prêt, on retire cette classe pour faire apparaître le site en douceur (Fade-in).
    // Cela évite de voir les éléments "sauter" pendant le chargement.
    
    setTimeout(() => {
        document.body.classList.remove("is-loading");
    }, 100);

    // --- Animation au scroll (Intersection Observer) ---
    // Cela permet de détecter quand un élément entre dans l'écran
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Ajoute la classe .visible qui lance la transition CSS
                entry.target.classList.add('visible');
                // On arrête d'observer une fois animé (pour ne pas le rejouer en remontant)
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 }); // Se déclenche quand 50% de l'élément est visible

    // On cible le badge ET les nouveaux éléments animés
    const elementsToAnimate = document.querySelectorAll('.badge, .animate-on-scroll');
    elementsToAnimate.forEach(el => observer.observe(el));
});