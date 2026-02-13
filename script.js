// 👋 Coucou ! Bienvenue dans le cerveau du site.
// C'est ici qu'on gère tout ce qui bouge et qui est interactif.

// On attend gentiment que TOUTE la page (images, textes, styles) soit chargée avant de commencer.
window.addEventListener("load", () => {
    
    // 🎭 Le rideau s'ouvre !
    // Au début, on a mis une classe "is-loading" sur le body qui rendait tout invisible.
    // Maintenant que tout est prêt, on l'enlève pour faire apparaître le site.
    setTimeout(() => {
        document.body.classList.remove("is-loading");
    }, 100); // On attend un tout petit peu (100ms) pour être sûr que ça soit fluide.

    // --- 👀 L'Espion du Scroll (Intersection Observer) ---
    // Cet outil surveille quand les éléments entrent dans l'écran de l'utilisateur.
    // C'est pour faire les animations d'apparition quand on descend dans la page.
    const espion = new IntersectionObserver((lesElementsVus) => {
        lesElementsVus.forEach(elementVu => {
            // Si l'élément est visible à l'écran...
            if (elementVu.isIntersecting) {
                // ... on lui ajoute la classe "visible".
                // Le CSS va voir ça et lancer l'animation (faire monter l'élément en fondu).
                elementVu.target.classList.add('visible');
                
                // Une fois qu'on l'a vu, on arrête de l'espionner.
                // Comme ça, l'animation ne se joue qu'une seule fois.
                espion.unobserve(elementVu.target);
            }
        });
    }, { threshold: 0.5 }); // On déclenche quand 50% de l'élément est visible.

    // On dit à notre espion de surveiller tous les éléments qui ont la classe ".badge" ou ".animate-on-scroll"
    const elementsAAnimer = document.querySelectorAll('.badge, .animate-on-scroll');
    elementsAAnimer.forEach(el => espion.observe(el));

    // --- 🍔 Le Menu Burger (Mobile) ---
    // On récupère le bouton (les 3 barres) et le menu (la liste de liens).
    const boutonMenu = document.querySelector('.menu-toggle');
    const menuNavigation = document.querySelector('.main-nav');
    
    // On vérifie que ces éléments existent bien sur la page pour éviter les erreurs
    if (boutonMenu && menuNavigation) {
        
        // Quand on clique sur le bouton...
        boutonMenu.addEventListener('click', () => {
            // On ajoute ou on enlève la classe "is-open" au menu.
            // (Si elle est là, on l'enlève. Si elle n'est pas là, on l'ajoute).
            const estOuvert = menuNavigation.classList.toggle('is-open');
            
            // On anime aussi le bouton lui-même (pour qu'il se transforme en croix).
            boutonMenu.classList.toggle('is-active', estOuvert);
        });

        // Petite amélioration : Quand on clique sur un lien du menu, on veut que le menu se ferme tout seul.
        const liensDuMenu = menuNavigation.querySelectorAll('a');
        liensDuMenu.forEach(lien => {
            lien.addEventListener('click', () => {
                // On ferme tout !
                menuNavigation.classList.remove('is-open');
                boutonMenu.classList.remove('is-active');
            });
        });
    }

    // --- ✨ Animation du Header au Scroll ---
        // Le but est d'ajouter une classe "is-scrolled" au header
        // dès que le bouton principal du héros n'est plus visible.
        const heroPrimaryButton = document.getElementById('hero-start-btn');
        const siteHeader = document.querySelector('.site-header');
    
        if (heroPrimaryButton && siteHeader) {
            const observerOptions = {
                rootMargin: "-80px 0px 0px 0px", // On considère que l'élément disparaît 80px (hauteur du header) avant qu'il ne sorte vraiment de l'écran.
                threshold: 0 // Se déclenche dès que l'élément n'est plus du tout visible.
            };
    
            const headerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // entry.isIntersecting est un booléen :
                    // - true si le bouton est visible
                    // - false s'il est invisible
                    
                    // On veut la classe "is-scrolled" UNIQUEMENT quand le bouton N'EST PAS visible.
                    // Donc, on ajoute la classe si "isIntersecting" est "false".
                    siteHeader.classList.toggle('is-scrolled', !entry.isIntersecting);
                });
            }, observerOptions);
    
            // On demande à notre observateur de surveiller le bouton du héros.
            headerObserver.observe(heroPrimaryButton);
        }
});