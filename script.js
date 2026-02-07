// On attend que toute la page soit chargée (images, styles, scripts)
window.addEventListener("load", () => {
    
    // Petite astuce UX (Expérience Utilisateur) :
    // On ajoute une classe "is-loading" au <body> dans le HTML qui cache tout (opacity: 0).
    // Une fois que tout est prêt, on retire cette classe pour faire apparaître le site en douceur (Fade-in).
    // Cela évite de voir les éléments "sauter" pendant le chargement.
    
    setTimeout(() => {
        document.body.classList.remove("is-loading");
    }, 100);
});