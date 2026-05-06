/**
 * script.js — Interactivité du site Solutions Terravia
 *
 * Centralise toute l'interactivité du site vitrine.
 * Aucun JavaScript ne doit être écrit dans les fichiers HTML.
 *
 * Structure :
 *   SECTION 1   — Initialisation   (toutes les pages)
 *   SECTION 2   — Navigation       (transitions de page, liens en construction)
 *   SECTION 3   — Page de connexion (login.html)
 *   SECTION 3.5 — Copie des coordonnées (contact.html)
 *   SECTION 4   — Formulaire de contact (contact.html)
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
                scrollObserver.unobserve(entry.target); // déclenché une seule fois par élément
            }
        });
    }, { threshold: 0.5 }); // 50 % visible avant de déclencher l'animation

    document.querySelectorAll(".badge, .animate-on-scroll")
        .forEach(el => scrollObserver.observe(el));


    // --- Menu burger (mobile) ---
    // Gère l'ouverture / fermeture du menu navigation sur petits écrans.
    const boutonMenu = document.querySelector(".menu-toggle");
    const menuNavigation = document.querySelector(".main-nav");

    if (boutonMenu && menuNavigation) {

        /**
         * Ferme le menu mobile avec animation de fermeture.
         * Ajoute "is-closing" pour jouer l'animation CSS slideUp,
         * puis retire "is-open" et "is-closing" après sa durée (300 ms).
         * NOTE: siteHeader est déclaré plus bas dans ce même callback —
         * il est accessible ici car cette fonction n'est appelée qu'après
         * la fin du handler "click", moment où siteHeader est déjà initialisé.
         */
        const fermerMenu = () => {
            menuNavigation.classList.add("is-closing");
            boutonMenu.classList.remove("is-active");
            boutonMenu.setAttribute("aria-expanded", "false");
            setTimeout(() => {
                menuNavigation.classList.remove("is-open", "is-closing");
                siteHeader?.classList.remove("menu-open");
            }, 300); // doit correspondre à la durée de l'animation slideUp dans style.css
        };

        boutonMenu.addEventListener("click", () => {
            if (menuNavigation.classList.contains("is-open")) {
                fermerMenu();
            } else {
                menuNavigation.classList.add("is-open");
                boutonMenu.classList.add("is-active");
                boutonMenu.setAttribute("aria-expanded", "true");
                siteHeader?.classList.add("menu-open");
            }
        });

        // Ferme le menu si on clique sur un lien (navigation mobile)
        menuNavigation.querySelectorAll("a").forEach(lien => {
            lien.addEventListener("click", () => {
                if (menuNavigation.classList.contains("is-open")) fermerMenu();
            });
        });
    }


    // --- Header au scroll ---
    // Trois états découplés :
    //   • "is-floating" → tout en haut (scrollY <= 0) : header transparent,
    //                     texte blanc, posé sur le hero.
    //   • "show-cta"    → apparition du bouton "Contactez-nous" dans le header,
    //                     déclenché dès que le CTA hero quitte l'écran.
    //   • "is-scrolled" → glassmorphisme du header, déclenché quand la section
    //                     hero entière quitte le viewport.
    // L'état "caché" (slide-up hors écran) est dérivé en CSS via
    // :not(.is-floating):not(.show-cta) — pas de classe JS dédiée.
    const siteHeader = document.querySelector(".site-header");
    const heroCtaBtn = document.querySelector("#hero-start-btn");
    const heroSection = document.querySelector(".hero-section");

    if (siteHeader) {
        // Observer sur le CTA hero : dès qu'il sort du viewport,
        // le bouton équivalent dans le header doit apparaître.
        if (heroCtaBtn) {
            const ctaObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // show-cta = true quand le CTA hero N'EST PLUS visible
                    siteHeader.classList.toggle("show-cta", !entry.isIntersecting);
                });
            }, { threshold: 0 });
            ctaObserver.observe(heroCtaBtn);
        }

        if (heroSection) {
            // Observer sur la section hero entière pour activer le glassmorphisme
            const headerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // is-scrolled = true quand le hero N'EST PLUS visible
                    siteHeader.classList.toggle("is-scrolled", !entry.isIntersecting);
                });
            }, { threshold: 0 });
            headerObserver.observe(heroSection);

            /**
             * Met à jour la classe "is-floating" selon la position du scroll.
             * "is-floating" est actif uniquement quand scrollY === 0 (tout en haut de page).
             * Listener passif pour ne pas bloquer le thread de rendu.
             */
            const updateFloatingState = () => {
                siteHeader.classList.toggle("is-floating", window.scrollY <= 0);
            };
            window.addEventListener("scroll", updateFloatingState, { passive: true });
            updateFloatingState(); // applique l'état initial sans attendre un scroll
        } else {
            // Pages sans section hero (contact.html, login.html) :
            // le header est toujours opaque et le bouton CTA toujours visible.
            siteHeader.classList.add("is-scrolled");
            siteHeader.classList.add("show-cta");
        }
    }
});


/* =============================================================
   SECTION 2 — NAVIGATION
   ============================================================= */

// --- Transitions fluides entre les pages ---
// Sur les liens .transition-link qui pointent vers une autre page,
// on ajoute "fade-out" sur le body avant de naviguer.
// Les ancres vers la même page (ex : index.html#services depuis index.html)
// sont exclues et laissent le navigateur gérer le scroll natif.
document.querySelectorAll(".transition-link").forEach(link => {
    link.addEventListener("click", function (e) {
        const targetUrl = this.getAttribute("href");

        const isSamePageAnchor = targetUrl.startsWith("#");

        // NOTE: pathname.split("/").pop() renvoie "" à la racine "/" (ex : dev server).
        // Fallback sur "index.html" pour que les ancres type "index.html#services"
        // soient reconnues comme appartenant à la page courante.
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        const isCurrentPageAnchor =
            targetUrl.includes("#") &&
            targetUrl.split("#")[0] === currentPage;

        if (targetUrl && !isSamePageAnchor && !isCurrentPageAnchor) {
            e.preventDefault();
            document.body.classList.add("fade-out");
            // Délai aligné sur la transition CSS fade-out (0.5 s dans style.css)
            setTimeout(() => { window.location.href = targetUrl; }, 500);
        }
    });
});


// Retirer fade-out si la page est restaurée depuis le bfcache (bouton retour/avant)
window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
        document.body.classList.remove("fade-out");
    }
});


// --- Liens en construction ---
// .link-arrow et .link-placeholder pointent vers des pages ou sections
// pas encore disponibles. Le clic est intercepté pour éviter une navigation cassée.
// TODO: Remplacer l'alert() par une notification UI non-bloquante (toast, infobulle)
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

// --- Auto-focus sur le champ email (login.html uniquement) ---
// Le délai de 300 ms est calé sur l'animation d'entrée du login-container
// (0.2 s de delay CSS + marge) pour s'assurer que l'élément est visible
// avant de lui donner le focus — un focus sur un élément opacity:0 est ignoré.
if (document.getElementById("email")) {
    setTimeout(() => {
        document.getElementById("email").focus();
    }, 300);
}


// --- Toggle visibilité du mot de passe ---
const passwordToggle = document.querySelector(".password-toggle");
const passwordInput = document.getElementById("password");

if (passwordToggle && passwordInput) {
    const icon = passwordToggle.querySelector("span"); // <span> Material Symbols dans le bouton

    passwordToggle.addEventListener("click", (e) => {
        e.preventDefault();
        const isHidden = passwordInput.getAttribute("type") === "password";
        // Bascule entre type="password" (masqué) et type="text" (visible)
        passwordInput.setAttribute("type", isHidden ? "text" : "password");
        icon.textContent = isHidden ? "visibility" : "visibility_off";
        // aria-pressed indique l'état "mot de passe actuellement visible"
        passwordToggle.setAttribute("aria-pressed", isHidden ? "true" : "false");
        passwordInput.focus(); // maintient le focus dans le champ après la bascule
    });
}

// --- Détection Caps Lock sur le champ password ---
const capsWarning = document.getElementById("caps-warning");

if (passwordInput && capsWarning) {
    const updateCapsLock = (e) => {
        const capsOn = e.getModifierState("CapsLock");
        capsWarning.classList.toggle("is-visible", capsOn);
        capsWarning.setAttribute("aria-hidden", capsOn ? "false" : "true");
    };

    // keydown couvre les touches normales ; keyup couvre le toggle Caps Lock lui-même
    passwordInput.addEventListener("keydown", updateCapsLock);
    passwordInput.addEventListener("keyup", updateCapsLock);

    passwordInput.addEventListener("blur", () => {
        capsWarning.classList.remove("is-visible");
        capsWarning.setAttribute("aria-hidden", "true");
    });
}


// --- Validation du formulaire de connexion ---
// Validation côté client uniquement — aucune logique d'authentification implémentée.
// TODO: Brancher sur une API d'authentification (JWT, session, etc.)
const submitBtn = document.querySelector(".form-stack .btn-primary[type='submit']");
const errorBanner = document.getElementById("error-banner");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");

// Guard double : sur contact.html, errorBanner n'existe pas (id="contact-error"),
// ce qui empêche ce bloc de s'exécuter par erreur sur la mauvaise page.
if (submitBtn && errorBanner) {

    submitBtn.addEventListener("click", (e) => {
        e.preventDefault();

        // Réinitialise l'état visuel avant chaque tentative de soumission
        [emailInput, passInput].forEach(i => i.classList.remove("has-error"));
        errorBanner.classList.remove("visible");

        const emailEmpty = !emailInput.value.trim();
        const passEmpty = !passInput.value.trim();
        // validity.valid exploite la validation HTML5 native du type="email"
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
            // innerHTML utilisé pour injecter l'icône Material Symbols —
            // le contenu est entièrement contrôlé en interne, pas de risque XSS
            errorBanner.innerHTML =
                `<span class="material-symbols-outlined error-icon">error</span> ${message}`;
            errorBanner.classList.add("visible");
            return;
        }

        // Pas d'erreur → logique de connexion à implémenter ici
    });

    // Retire le marquage d'erreur dès que l'utilisateur recommence à saisir
    [emailInput, passInput].forEach(input => {
        input.addEventListener("input", () => {
            input.classList.remove("has-error");
            // La bannière n'est masquée que quand aucun champ n'est plus en erreur
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
    // Région ARIA live pour annoncer la copie aux lecteurs d'écran
    const liveRegion = channelsRoot.querySelector(".channel-copy-live");
    // WeakMap : associe chaque bouton à son timer de reset sans créer de fuite mémoire
    const timers = new WeakMap();

    /**
     * Copie du texte dans le presse-papiers via l'API legacy execCommand.
     * Utilisé comme fallback quand navigator.clipboard est indisponible
     * (contexte HTTP non sécurisé ou navigateur ancien).
     * @param {string} text - Texte à copier dans le presse-papiers
     */
    const fallbackCopy = (text) => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px"; // hors écran, invisible sans perturber le layout
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } finally { ta.remove(); }
    };

    /**
     * Applique le feedback visuel "copié" sur un bouton .channel-copy.
     * Ajoute la classe "is-copied" (crossfade icône + anneau radar via CSS),
     * met à jour la région ARIA live, et programme la réinitialisation après 1,8 s.
     * @param {HTMLElement} button - Bouton .channel-copy qui vient d'être activé
     */
    const markCopied = (button) => {
        button.classList.remove("is-copied");
        // Reflow forcé : réinitialise l'animation CSS si l'utilisateur reclique
        // avant la fin du timer (sans ce reflow, l'anneau ne repart pas)
        void button.offsetWidth;
        button.classList.add("is-copied");
        if (liveRegion) liveRegion.textContent = "Copié dans le presse-papiers";

        // Annule le timer précédent pour éviter une double réinitialisation
        const previous = timers.get(button);
        if (previous) clearTimeout(previous);
        const t = setTimeout(() => {
            button.classList.remove("is-copied");
            if (liveRegion) liveRegion.textContent = "";
        }, 1800);
        timers.set(button, t);
    };

    // Délégation d'événement sur le conteneur pour couvrir tous les boutons présents et futurs
    channelsRoot.addEventListener("click", (event) => {
        const button = event.target.closest(".channel-copy");
        if (!button) return;
        const text = button.dataset.copy; // texte défini dans l'attribut data-copy du HTML
        if (!text) return;

        // navigator.clipboard requiert HTTPS ou localhost (window.isSecureContext)
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

    /**
     * Affiche la bannière d'erreur du formulaire de contact avec un message.
     * Masque la bannière de succès si elle était visible.
     * @param {string} message - Texte d'erreur à afficher (contenu interne contrôlé)
     */
    const showError = (message) => {
        contactSuccess.classList.remove("visible");
        contactError.innerHTML =
            `<span class="material-symbols-outlined error-icon">error</span> ${message}`;
        contactError.classList.add("visible");
    };

    /**
     * Masque les deux bannières d'état (erreur et succès) du formulaire.
     */
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

        // TODO: Brancher sur un service d'envoi (ex. Formspree, endpoint backend)
        // Simulation de succès : affiche la bannière et réinitialise le formulaire
        contactSuccess.innerHTML =
            `<span class="material-symbols-outlined">check_circle</span> Message reçu — on revient vers vous le plus rapidement possible!`;
        contactSuccess.classList.add("visible");
        contactForm.reset();
        contactSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Retire le marquage d'erreur au premier caractère saisi dans un champ
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
    // Sélectionne uniquement les cases portant name="services" dans le panel
    const serviceCheckboxes = serviceDropdown
        ? serviceDropdown.querySelectorAll('.checkbox-input[name="services"]')
        : [];

    // Table de correspondance valeur de case → libellé affiché dans le trigger et les chips
    const SERVICE_LABELS = {
        "lidar-aerien":   "LiDAR aérien",
        "photogrammetrie":"Photogrammétrie",
        "inspection-3d":  "Inspection 3D",
        "volumetrie-mnt": "Volumétrie & MNT",
        "autre":          "Autre",
    };

    /**
     * Met à jour le texte affiché dans le bouton trigger du dropdown.
     * Affiche le libellé du service si une seule case est cochée,
     * ou "N services sélectionnés" si plusieurs.
     * Ajoute/retire la classe "has-selection" pour adapter le style du trigger.
     */
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

    /**
     * Reconstruit les chips visuelles depuis les cases cochées.
     * Vide le conteneur et recrée un chip par case cochée, avec un bouton
     * de suppression qui décoche la case et rafraîchit l'UI immédiatement.
     */
    function syncChips() {
        tagsContainer.innerHTML = "";
        [...serviceCheckboxes].filter(cb => cb.checked).forEach(cb => {
            const label = SERVICE_LABELS[cb.value] ?? cb.value; // fallback sur la valeur brute
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

    /**
     * Ouvre le panel de sélection des services.
     * Met à jour aria-expanded pour l'accessibilité clavier et lecteurs d'écran.
     */
    function openDropdown() {
        serviceDropdown.classList.add("is-open");
        serviceTrigger.setAttribute("aria-expanded", "true");
    }

    /**
     * Ferme le panel de sélection des services.
     * Met à jour aria-expanded pour l'accessibilité clavier et lecteurs d'écran.
     */
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

        // Ferme le dropdown en cliquant en dehors de son conteneur
        document.addEventListener("click", (e) => {
            if (!serviceDropdown.contains(e.target)) closeDropdown();
        });

        // Ferme le dropdown via la touche Échap (accessibilité clavier)
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeDropdown();
        });

        // requestAnimationFrame garantit que le reset du formulaire est appliqué
        // avant de relire l'état des cases à cocher
        contactForm.addEventListener("reset", () => requestAnimationFrame(() => {
            syncChips();
            updateTrigger();
        }));

        // Initialisation au chargement : gère la restauration d'état du navigateur
        // (bfcache, autofill) qui peut pré-cocher des cases sans déclencher "change"
        syncChips();
        updateTrigger();
    }
}
