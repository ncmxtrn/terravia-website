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
document.querySelectorAll(".link-arrow, .link-placeholder").forEach(link => {
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
   SECTION 3.5 — COPIER LES COORDONNÉES (cards .channel-copy)
   Délégation d'event sur .contact-channels. Crossfade icône
   content_copy → check, anneau radar, retour après 1.8 s.
   ============================================================= */

const channelsRoot = document.querySelector(".contact-channels");

if (channelsRoot) {
    const liveRegion = channelsRoot.querySelector(".channel-copy-live");
    const timers = new WeakMap();

    const fallbackCopy = (text) => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } finally { ta.remove(); }
    };

    const markCopied = (button) => {
        button.classList.remove("is-copied");
        // reflow pour relancer l'animation de l'anneau si re-clic rapide
        void button.offsetWidth;
        button.classList.add("is-copied");
        if (liveRegion) liveRegion.textContent = "Copié dans le presse-papiers";

        const previous = timers.get(button);
        if (previous) clearTimeout(previous);
        const t = setTimeout(() => {
            button.classList.remove("is-copied");
            if (liveRegion) liveRegion.textContent = "";
        }, 1800);
        timers.set(button, t);
    };

    channelsRoot.addEventListener("click", (event) => {
        const button = event.target.closest(".channel-copy");
        if (!button) return;
        const text = button.dataset.copy;
        if (!text) return;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => markCopied(button))
                .catch(() => { fallbackCopy(text); markCopied(button); });
        } else {
            fallbackCopy(text);
            markCopied(button);
        }
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
            `<span class="material-symbols-outlined">check_circle</span> Message reçu — on revient vers vous le plus rapidement possible!`;
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

    // --- Dropdown services + chips ---
    const serviceDropdown   = document.getElementById("services-dropdown");
    const serviceTrigger    = document.getElementById("services-trigger");
    const tagsContainer     = document.getElementById("services-tags");
    const serviceCheckboxes = serviceDropdown
        ? serviceDropdown.querySelectorAll('.checkbox-input[name="services"]')
        : [];

    const SERVICE_LABELS = {
        "lidar-aerien":   "LiDAR aérien",
        "photogrammetrie":"Photogrammétrie",
        "inspection-3d":  "Inspection 3D",
        "volumetrie-mnt": "Volumétrie & MNT",
        "autre":          "Autre",
    };

    function updateTrigger() {
        const checked = [...serviceCheckboxes].filter(cb => cb.checked);
        const textEl  = serviceTrigger.querySelector(".services-trigger-text");
        if (checked.length === 0) {
            textEl.textContent = "Sélectionner des services…";
            serviceTrigger.classList.remove("has-selection");
        } else {
            textEl.textContent = checked.length === 1
                ? SERVICE_LABELS[checked[0].value]
                : `${checked.length} services sélectionnés`;
            serviceTrigger.classList.add("has-selection");
        }
    }

    function syncChips() {
        tagsContainer.innerHTML = "";
        [...serviceCheckboxes].filter(cb => cb.checked).forEach(cb => {
            const label = SERVICE_LABELS[cb.value] ?? cb.value;
            const chip  = document.createElement("span");
            chip.className = "service-chip";
            chip.innerHTML = `${label}<button type="button" class="service-chip-remove" aria-label="Retirer ${label}"><span class="material-symbols-outlined">close</span></button>`;
            chip.querySelector(".service-chip-remove").addEventListener("click", () => {
                cb.checked = false;
                syncChips();
                updateTrigger();
            });
            tagsContainer.appendChild(chip);
        });
    }

    function openDropdown() {
        serviceDropdown.classList.add("is-open");
        serviceTrigger.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
        serviceDropdown.classList.remove("is-open");
        serviceTrigger.setAttribute("aria-expanded", "false");
    }

    if (serviceDropdown) {
        serviceTrigger.addEventListener("click", () => {
            serviceDropdown.classList.contains("is-open") ? closeDropdown() : openDropdown();
        });

        serviceCheckboxes.forEach(cb => cb.addEventListener("change", () => {
            syncChips();
            updateTrigger();
        }));

        document.addEventListener("click", (e) => {
            if (!serviceDropdown.contains(e.target)) closeDropdown();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeDropdown();
        });

        contactForm.addEventListener("reset", () => requestAnimationFrame(() => {
            syncChips();
            updateTrigger();
        }));
    }
}
