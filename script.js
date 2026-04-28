/**
 * script.js — Cerveau interactif du site Terravia
 *
 * Ce fichier gère TOUTE l'interactivité du site.
 * Aucun JS ne doit être écrit dans les fichiers HTML.
 *
 * Structure :
 *   SECTION 1 — Initialisation  (toutes les pages)
 *   SECTION 2 — Navigation      (transitions, liens en construction)
 *   SECTION 3 — Page de connexion (login.html uniquement)
 */


/* =============================================================
   SECTION 1 — INITIALISATION (s'exécute sur toutes les pages)
   ============================================================= */

window.addEventListener("load", () => {

    // Révélation de la page
    // La classe "is-loading" sur le body la gardait invisible pendant le chargement.
    // On l'enlève maintenant que tout est prêt, pour l'animation d'entrée.
    setTimeout(() => {
        document.body.classList.remove("is-loading");
    }, 100);


    // --- Animations au scroll (IntersectionObserver) ---
    // Surveille les éléments .badge et .animate-on-scroll.
    // Dès qu'un élément est visible à 50 %, on lui ajoute la classe "visible"
    // (le CSS prend le relais pour l'animation d'apparition).
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                scrollObserver.unobserve(entry.target); // une seule fois
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll(".badge, .animate-on-scroll")
        .forEach(el => scrollObserver.observe(el));


    // --- Menu burger (mobile) ---
    // Gère l'ouverture / fermeture du menu navigation sur petits écrans.
    const boutonMenu = document.querySelector(".menu-toggle");
    const menuNavigation = document.querySelector(".main-nav");

    if (boutonMenu && menuNavigation) {

        const fermerMenu = () => {
            menuNavigation.classList.add("is-closing");
            boutonMenu.classList.remove("is-active");
            // On attend la fin de l'animation CSS avant de retirer is-open
            setTimeout(() => {
                menuNavigation.classList.remove("is-open", "is-closing");
            }, 300);
        };

        boutonMenu.addEventListener("click", () => {
            if (menuNavigation.classList.contains("is-open")) {
                fermerMenu();
            } else {
                menuNavigation.classList.add("is-open");
                boutonMenu.classList.add("is-active");
            }
        });

        // Ferme le menu si on clique sur un lien (navigation mobile)
        menuNavigation.querySelectorAll("a").forEach(lien => {
            lien.addEventListener("click", () => {
                if (menuNavigation.classList.contains("is-open")) fermerMenu();
            });
        });
    }


    // --- Glassmorphisme du header au scroll ---
    // Observe la section hero. Quand elle sort de l'écran (scroll vers le bas),
    // on ajoute "is-scrolled" sur le header pour activer l'effet verre dépoli.
    const heroSection = document.querySelector(".hero-section");
    const siteHeader = document.querySelector(".site-header");

    if (heroSection && siteHeader) {
        const headerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                siteHeader.classList.toggle("is-scrolled", !entry.isIntersecting);
            });
        }, { threshold: 0 });

        headerObserver.observe(heroSection);
    } else if (siteHeader) {
        // Pages sans hero (contact, login) : header opaque en permanence.
        siteHeader.classList.add("is-scrolled");
    }
});


/* =============================================================
   SECTION 2 — NAVIGATION
   ============================================================= */

// --- Transitions fluides entre les pages ---
// Sur les liens .transition-link qui pointent vers une autre page,
// on ajoute "fade-out" sur le body avant de naviguer.
document.querySelectorAll(".transition-link").forEach(link => {
    link.addEventListener("click", function (e) {
        const targetUrl = this.getAttribute("href");

        const isSamePageAnchor = targetUrl.startsWith("#");
        // Ancre vers la page courante (ex: index.html#contact depuis index.html)
        const isCurrentPageAnchor =
            targetUrl.includes("#") &&
            targetUrl.split("#")[0] === window.location.pathname.split("/").pop();

        if (targetUrl && !isSamePageAnchor && !isCurrentPageAnchor) {
            e.preventDefault();
            document.body.classList.add("fade-out");
            setTimeout(() => { window.location.href = targetUrl; }, 500);
        }
    });
});


// --- Liens en construction ---
// Les éléments .link-arrow pointent vers des pages pas encore disponibles.
// On intercepte le clic pour afficher une alerte au lieu de naviguer.
document.querySelectorAll(".link-arrow").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        alert("En cours de construction...");
    });
});


/* =============================================================
   SECTION 3 — PAGE DE CONNEXION (login.html uniquement)
   Les guards "if (element)" évitent toute erreur sur les autres pages
   où ces éléments n'existent pas.
   ============================================================= */

// --- Auto-focus sur le champ email ---
// Délai calé sur l'animation d'entrée du login-container (0.2s delay + marge)
// pour éviter que le focus soit ignoré sur un élément opacity:0
setTimeout(() => {
    document.getElementById("email")?.focus();
}, 300);


// --- Toggle visibilité du mot de passe ---
const passwordToggle = document.querySelector(".password-toggle");
const passwordInput = document.getElementById("password");

if (passwordToggle && passwordInput) {
    const icon = passwordToggle.querySelector("span");

    passwordToggle.addEventListener("click", (e) => {
        e.preventDefault();
        const isHidden = passwordInput.getAttribute("type") === "password";
        passwordInput.setAttribute("type", isHidden ? "text" : "password");
        icon.textContent = isHidden ? "visibility" : "visibility_off";
        passwordToggle.setAttribute("aria-pressed", isHidden ? "true" : "false");
        passwordInput.focus();
    });
}


// --- Validation du formulaire de connexion ---
const submitBtn = document.querySelector(".form-stack .btn-primary[type='submit']");
const errorBanner = document.getElementById("error-banner");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");

if (submitBtn && errorBanner) {

    submitBtn.addEventListener("click", (e) => {
        e.preventDefault();

        // Réinitialise l'état visuel avant chaque tentative
        [emailInput, passInput].forEach(i => i.classList.remove("has-error"));
        errorBanner.classList.remove("visible");

        const emailEmpty = !emailInput.value.trim();
        const passEmpty = !passInput.value.trim();
        const emailInvalid = !emailEmpty && !emailInput.validity.valid;

        let message = "";

        if (emailEmpty && passEmpty) {
            emailInput.classList.add("has-error");
            passInput.classList.add("has-error");
            message = "Veuillez remplir tous les champs.";
        } else if (emailEmpty) {
            emailInput.classList.add("has-error");
            message = "Veuillez saisir votre adresse email.";
        } else if (passEmpty) {
            passInput.classList.add("has-error");
            message = "Veuillez saisir votre mot de passe.";
        } else if (emailInvalid) {
            emailInput.classList.add("has-error");
            message = "Adresse email invalide.";
        }

        if (message) {
            errorBanner.innerHTML =
                `<span class="material-symbols-outlined error-icon">error</span> ${message}`;
            errorBanner.classList.add("visible");
            return;
        }

        // Pas d'erreur → logique de connexion à implémenter ici
    });

    // Retire l'état d'erreur dès que l'utilisateur recommence à taper
    [emailInput, passInput].forEach(input => {
        input.addEventListener("input", () => {
            input.classList.remove("has-error");
            const stillHasError = [emailInput, passInput].some(i => i.classList.contains("has-error"));
            if (!stillHasError) errorBanner.classList.remove("visible");
        });
    });
}


/* =============================================================
   SECTION 4 — PAGE CONTACT (contact.html uniquement)
   Validation client + bannières d'état. Pas de backend pour
   l'instant : on simule le succès et on reset le formulaire.
   ============================================================= */

const contactForm = document.getElementById("contact-form");

if (contactForm) {
    const contactError   = document.getElementById("contact-error");
    const contactSuccess = document.getElementById("contact-success");
    const nameInput      = document.getElementById("contact-name");
    const mailInput      = document.getElementById("contact-email");
    const msgInput       = document.getElementById("contact-message");
    const requiredFields = [nameInput, mailInput, msgInput];

    const showError = (message) => {
        contactSuccess.classList.remove("visible");
        contactError.innerHTML =
            `<span class="material-symbols-outlined error-icon">error</span> ${message}`;
        contactError.classList.add("visible");
    };

    const clearBanners = () => {
        contactError.classList.remove("visible");
        contactSuccess.classList.remove("visible");
    };

    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();

        requiredFields.forEach(i => i.classList.remove("has-error"));
        clearBanners();

        const nameEmpty = !nameInput.value.trim();
        const mailEmpty = !mailInput.value.trim();
        const msgEmpty  = !msgInput.value.trim();
        const mailInvalid = !mailEmpty && !mailInput.validity.valid;

        if (nameEmpty) nameInput.classList.add("has-error");
        if (mailEmpty || mailInvalid) mailInput.classList.add("has-error");
        if (msgEmpty) msgInput.classList.add("has-error");

        if (nameEmpty || mailEmpty || msgEmpty) {
            showError("Veuillez remplir les champs requis.");
            return;
        }
        if (mailInvalid) {
            showError("Adresse courriel invalide.");
            return;
        }

        contactSuccess.innerHTML =
            `<span class="material-symbols-outlined">check_circle</span> Message reçu — on revient vers vous sous 24 heures ouvrables.`;
        contactSuccess.classList.add("visible");
        contactForm.reset();
        contactSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    requiredFields.forEach(input => {
        input.addEventListener("input", () => {
            input.classList.remove("has-error");
            const stillHasError = requiredFields.some(i => i.classList.contains("has-error"));
            if (!stillHasError) contactError.classList.remove("visible");
        });
    });
}
