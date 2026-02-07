window.addEventListener("load", () => {
    // On attend un tout petit peu pour être sûr que le navigateur est prêt
    // (C'est l'astuce qui règle le problème du rafraîchissement)
    setTimeout(() => {
        document.body.classList.remove("is-loading");
    }, 100); 
});