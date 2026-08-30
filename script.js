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
 *   SECTION 4.5 — Page services (services.html)
 *   SECTION 4   — Formulaire de contact (contact.html)
 */


/* =============================================================
   SECTION 1 — INITIALISATION (s'exécute sur toutes les pages)
   ============================================================= */

// --- Révélation de la page (anti-FOUC) ---
// La classe "is-loading" est écrite en dur sur <html> dans les 5 pages. On la retire
// dès que le DOM est parsé, sans attendre "load" : sinon la page resterait masquée
// jusqu'au téléchargement de la dernière image.
// Les deux cas dégradés (JS désactivé, script.js jamais exécuté) sont couverts sans
// JavaScript — <noscript> dans chaque <head> et @keyframes fouc-safety-net dans
// style.css — ce qui évite d'avoir un bloc inline recopié dans les cinq pages.
document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.remove("is-loading");
});


// --- Restauration depuis le bfcache ---
// Un seul listener pageshow pour tout le fichier : au retour via les boutons
// précédent/suivant, DOMContentLoaded ne se rejoue pas, pageshow si. Les modules
// qui ont un état à réappliquer s'enregistrent ici plutôt que d'ajouter chacun leur
// propre listener, dont l'ordre relatif ne serait garanti par rien d'explicite.
const onPageRestore = [];
window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
        document.body.classList.remove("fade-out");
    }
    onPageRestore.forEach(fn => fn());
});


// --- Initialisation principale ---
// DOMContentLoaded et non "load" : rien ici n'a besoin des images téléchargées
// (observers, menu burger, états du header travaillent sur la mise en page, pas
// sur les pixels). Attendre "load" retardait toute l'interactivité jusqu'au
// dernier octet de la dernière image.
// Listener distinct de celui de l'anti-FOUC ci-dessus, et enregistré après lui :
// les deux se déclenchent dans l'ordre d'enregistrement, donc une erreur dans ce
// bloc-ci ne peut jamais empêcher la page de redevenir visible.
document.addEventListener("DOMContentLoaded", () => {

    // --- Animations au scroll (IntersectionObserver) ---
    // Surveille les éléments .animate-on-scroll et leur ajoute la classe "visible"
    // (le CSS prend le relais pour l'animation d'apparition).
    //
    // Aucune passe de rattrapage n'est nécessaire pour les éléments déjà présents
    // dans le viewport au chargement : observe() émet toujours une première entrée
    // (l'index de seuil précédent vaut -1, il diffère donc systématiquement), et
    // `isIntersecting` y vaut true dès qu'il y a la moindre intersection avec le
    // root — indépendamment du threshold, qui ne gouverne que les notifications
    // ultérieures. Un élément n'affleurant que de 2 % est donc révélé dès ce
    // premier appel, sans test de position supplémentaire.
    //
    // Le cycle de vie de `will-change` est entièrement géré par le CSS
    // (.animate-on-scroll:not(.visible) dans style.css) : ajouter .visible suffit à
    // libérer la couche compositeur. Une version antérieure le faisait ici, en style
    // inline sur `transitionend` — mais transitionend REMONTE le DOM, donc la fin de
    // n'importe quelle transition `transform` d'un descendant (l'image d'une carte au
    // survol) coupait le hint en pleine révélation, et le listener fuyait si la
    // transition n'aboutissait jamais.
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                scrollObserver.unobserve(entry.target); // déclenché une seule fois par élément
            }
        });
    }, { threshold: 0.1 }); // seuil des notifications de défilement ; la première entrée n'y est pas soumise

    document.querySelectorAll(".animate-on-scroll")
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
    // Quatre états découplés :
    //   • "is-floating" → tout en haut (scrollY <= 0) : header transparent,
    //                     texte blanc, posé sur le hero.
    //   • "show-cta"    → apparition du bouton "Contactez-nous" dans le header,
    //                     déclenché dès que le CTA hero quitte l'écran.
    //   • "is-scrolled" → glassmorphisme du header, déclenché quand la section
    //                     hero entière quitte le viewport.
    //   • "is-hidden"   → escamotage au défilement descendant, sous 840px
    //                     seulement (voir le bloc « Masquage au scroll
    //                     descendant » plus bas).
    // Les trois premiers dépendent de la POSITION du scroll, le quatrième de sa
    // DIRECTION — d'où un mécanisme séparé plutôt qu'un observer de plus.
    // L'état "caché" historique (slide-up hors écran) est, lui, dérivé en CSS via
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

        // --- Masquage au scroll descendant (mobile) ---
        // Hors du `if (heroSection)` ci-dessous, à dessein : le dispositif vaut
        // pour les quatre pages qui ont un header, pas seulement pour celles qui
        // ont un hero.
        //
        // Ce bloc n'AJOUTE que du masquage, il ne révèle jamais rien : dans le
        // haut du hero d'index.html, où l'état caché dérivé
        // (:not(.is-floating):not(.show-cta)) tient déjà le header hors écran,
        // retirer "is-hidden" ne le fait pas redescendre. Le comportement y reste
        // donc identique à ce qu'il était.
        const MOBILE_MAX = 840; // aligné sur le breakpoint mobile de style.css
        const DELTA_MIN  = 6;   // px — hystérésis contre le tremblement du doigt

        // Seuil de déclenchement = hauteur du header : tant qu'il ne recouvre
        // aucun contenu, l'escamoter ne libérerait rien et ne ferait que clignoter.
        let seuilMasquage  = siteHeader.offsetHeight;
        let dernierY       = Math.max(0, window.scrollY);
        let frameEnAttente = false;

        const majMasquageHeader = () => {
            // Clamp à 0 : l'overscroll élastique d'iOS produit un scrollY négatif,
            // qui inverserait le signe du delta et ferait osciller le header au
            // simple rebond en haut de page.
            const y     = Math.max(0, window.scrollY);
            const delta = y - dernierY;

            // Trois raisons de rester en retrait — dont la dernière couvre aussi
            // les sauts instantanés vers le haut (le logo pointe sur href="#"),
            // qui n'émettent pas forcément de delta négatif exploitable.
            if (window.innerWidth > MOBILE_MAX
                || siteHeader.classList.contains("menu-open")
                || y <= seuilMasquage) {
                siteHeader.classList.remove("is-hidden");
                document.body.classList.remove("header-hidden");
                dernierY = y;
                return;
            }

            // Sous le seuil : on sort SANS mettre dernierY à jour, pour que les
            // micro-déplacements s'accumulent jusqu'à former un geste franc.
            // Le mettre à jour ici reviendrait à remettre le compteur à zéro à
            // chaque frame et un scroll très lent ne déclencherait jamais rien.
            if (Math.abs(delta) < DELTA_MIN) return;

            const masquer = delta > 0;
            siteHeader.classList.toggle("is-hidden", masquer);
            // Miroir sur <body> : services.css ne peut pas cibler un ancêtre du
            // header, c'est ce crochet qui fait remonter la barre de pilules.
            document.body.classList.toggle("header-hidden", masquer);
            dernierY = y;
        };

        // Coalescence par requestAnimationFrame : le scroll émet bien plus
        // d'événements qu'il n'y a de frames rendues, et tout ce qu'on fait ici
        // n'a d'effet qu'au prochain rendu.
        window.addEventListener("scroll", () => {
            if (frameEnAttente) return;
            frameEnAttente = true;
            requestAnimationFrame(() => {
                majMasquageHeader();
                frameEnAttente = false;
            });
        }, { passive: true });

        // Le passage mobile ↔ desktop doit resynchroniser l'état (sinon un header
        // escamoté en mobile resterait invisible en desktop, où la règle CSS ne
        // s'applique plus mais où la classe, elle, serait toujours là au prochain
        // retour en mobile). La hauteur du header peut aussi changer avec la largeur.
        window.addEventListener("resize", () => {
            seuilMasquage = siteHeader.offsetHeight;
            majMasquageHeader();
        }, { passive: true });

        // Même raison que pour updateFloatingState plus bas : au DOMContentLoaded
        // la position de défilement restaurée n'est pas encore appliquée, dernierY
        // partirait de 0 et le premier geste serait lu comme une descente.
        window.addEventListener("load", () => {
            dernierY = Math.max(0, window.scrollY);
        });

        // Retour via le bouton "précédent" : la page revient telle qu'elle était,
        // header potentiellement escamoté. On le rend, et on recale la référence.
        onPageRestore.push(() => {
            dernierY = Math.max(0, window.scrollY);
            siteHeader.classList.remove("is-hidden");
            document.body.classList.remove("header-hidden");
        });

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

            // L'état initial est appliqué tout de suite, puis RÉAPPLIQUÉ sur "load".
            // Au DOMContentLoaded le navigateur n'a pas forcément restauré la position de
            // défilement d'un rechargement (history.scrollRestoration) : scrollY vaut alors
            // 0 et le header prendrait "is-floating" — fond transparent, texte blanc — sur
            // un contenu clair. La restauration se fait après le layout, ce qui tombe
            // couramment APRÈS la première frame : une seule requestAnimationFrame ne suffit
            // donc pas à la garantir, alors que "load" est postérieur dans tous les cas.
            updateFloatingState();
            window.addEventListener("load", updateFloatingState);
            onPageRestore.push(updateFloatingState);
        }
        // Pas de branche `else` : sur les pages sans hero (services.html, contact.html),
        // "is-scrolled show-cta" sont écrites en dur dans le markup du <header>, pour que
        // le header soit peint dans le bon état dès la première frame. Les poser ici le
        // faisait glisser depuis le hors-écran par-dessus le fondu d'entrée de la page.
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

// --- Focus initial sur le champ email ---
// L'attribut autofocus est présent dans login.html, mais il ne suffit pas ici :
// pendant l'anti-FOUC, html.is-loading body est en visibility: hidden, et un élément
// non rendu n'est pas focusable — le navigateur peut donc ignorer autofocus.
// Ce listener est enregistré APRÈS celui de la SECTION 1, donc .is-loading est déjà
// retirée quand il s'exécute : le champ est visible et le focus est fiable.
// autofocus reste utile pour le cas sans JS, où <noscript> neutralise le masquage.
// id="email" n'existe que sur login.html (contact.html utilise id="contact-email").
// Déclaré ici et réutilisé plus bas (validation du formulaire) pour éviter deux
// références distinctes vers le même nœud #email.
const emailInput = document.getElementById("email");

if (emailInput) {
    document.addEventListener("DOMContentLoaded", () => {
        emailInput.focus();
    });
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
// emailInput est déclaré plus haut (bloc focus initial) et réutilisé ici.
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
   SECTION 4.5 — PAGE SERVICES (services.html uniquement)
   Active le lien sidebar correspondant à la section visible, puis fait suivre
   le sommaire : centrage horizontal de la pill sur mobile, défilement interne
   synchronisé sur la progression de la page en desktop.
   Guard: s'exécute uniquement si .services-layout est présent.
   ============================================================= */

const servicesLayout = document.querySelector(".services-layout");

if (servicesLayout) {
    const serviceBlocks   = document.querySelectorAll(".service-block[id]");
    const sidebarNavLinks = document.querySelectorAll(".services-sidebar .nav-link");
    const sidebar         = document.querySelector(".services-sidebar");

    // Permet à services.css de cibler le header sur cette page uniquement
    document.body.classList.add("has-pill-nav");

    const activateSidebarLink = (activeId) => {
        sidebarNavLinks.forEach(link => {
            const isActive = link.getAttribute("href") === `#${activeId}`;
            link.classList.toggle("is-active", isActive);
            // Sur mobile, centre la pill active dans la barre horizontale
            if (isActive && window.innerWidth <= 840 && sidebar) {
                const sidebarRect = sidebar.getBoundingClientRect();
                const linkRect    = link.getBoundingClientRect();
                sidebar.scrollTo({
                    left: sidebar.scrollLeft + linkRect.left - sidebarRect.left
                          - (sidebarRect.width / 2) + (linkRect.width / 2),
                    behavior: "smooth"
                });
            }
        });
    };

    const pageHeader = document.querySelector(".site-header");

    // Met à jour --sticky-top sur :root = hauteur réelle de la zone collante
    // (header + sidebar sur mobile, header seul sur desktop) + buffer visuel.
    // Utilisé à la fois par le scroll-spy et par scroll-margin-top en CSS.
    const updateStickyTop = () => {
        const headerH  = pageHeader?.offsetHeight ?? 80;
        const isMobile = window.innerWidth <= 840;
        const sidebarH = isMobile ? (sidebar?.offsetHeight ?? 0) : 0;
        const buffer   = isMobile ? 16 : 32; // --space-md mobile, --space-xl desktop
        document.documentElement.style.setProperty(
            "--sticky-top",
            `${headerH + sidebarH + buffer}px`
        );
    };

    // Jointure header / barre de pilules (services.css, « SURFACE UNIQUE »).
    // On MESURE la position relative des deux boîtes plutôt que de basculer une
    // classe : en fin de layout la barre ne disparaît pas d'un coup, elle est
    // chassée vers le haut par le bas de sa zone collante et passe derrière le
    // header sur ~62px de défilement. Tout seuil binaire laisse donc, pendant ce
    // trajet, soit une bande de verre vide sous le header, soit des pilules qui
    // débordent par-dessus lui.
    //
    // Deux mesures complémentaires, dont la somme fait la hauteur de la barre :
    // • --pill-glass-overhang : la part de la barre restée visible SOUS le
    //   header, donc ce dont le panneau de verre doit déborder pour la couvrir ;
    // • --pill-bar-clip : la part passée DERRIÈRE le header, à écrêter. La barre
    //   est peinte au-dessus du header pour que le flou n'atteigne pas les
    //   pilules ; sans cet écrêtage, elles recouvriraient le logo et le CTA en
    //   glissant vers le haut.
    let overhangPose = null;
    let clipPose     = null;

    const syncPillGlass = () => {
        const racine = document.documentElement;
        let overhang = 0;
        let clip     = 0;

        if (sidebar && pageHeader && window.innerWidth <= 840) {
            const barre  = sidebar.getBoundingClientRect();
            const basHdr = pageHeader.getBoundingClientRect().bottom;

            // Accostée = son haut a rejoint le bas du header (à un pixel près, le
            // temps que les sous-pixels se recalent). Sinon elle descend encore
            // dans le flux et le verre ne doit pas déborder : il flouterait le
            // haut de l'intro, qui passe précisément dans cette bande.
            if (barre.top <= basHdr + 1) overhang = Math.max(0, barre.bottom - basHdr);
            clip = Math.max(0, basHdr - barre.top);
        }

        // Le bas du header est le seul repère utilisé, et il suit le header quand
        // il s'escamote : les deux mesures restent donc justes sans rien savoir de
        // `header-hidden`. Elles restent même valides pendant la transition sans
        // être recalculées — header et barre parcourent les mêmes 80px avec la
        // même durée et la même courbe, leur écart ne bouge pas.
        // Écriture seulement si la valeur change : accostée, elle est constante
        // sur tout le défilement, inutile d'invalider le style à chaque frame.
        if (overhang !== overhangPose) {
            racine.style.setProperty("--pill-glass-overhang", `${overhang}px`);
            overhangPose = overhang;
        }
        if (clip !== clipPose) {
            racine.style.setProperty("--pill-bar-clip", `${clip}px`);
            clipPose = clip;
        }
    };

    // --- Sommaire synchronisé au scroll (desktop uniquement) ---
    // Le sommaire fait ~1700px pour 650-800px de fenêtre visible : sans pilotage,
    // le lien actif et sa barre verte se retrouvent hors de vue dès le 4e secteur,
    // dans un conteneur que l'utilisateur n'a jamais fait défiler — et dont les
    // barres de défilement sont masquées, donc rien n'indique qu'il le peut.
    //
    // Le report se fait SECTION PAR SECTION, et non par une règle de trois sur toute
    // la page : c'est ce qui le rend à la fois continu et toujours juste. L'avancement
    // dans la section courante est reporté sur le groupe qui lui correspond, si bien
    // que les hauteurs des blocs n'ont pas besoin d'être proportionnelles à celles des
    // groupes — chaque section pilote exactement son groupe, quelles que soient leurs
    // tailles respectives.
    //
    // Un mapping proportionnel global, lui, aurait exigé un garde-fou pour ramener le
    // groupe actif dans la fenêtre, et ce garde-fou aurait produit des SAUTS : exiger
    // qu'un groupe soit entièrement visible épingle le sommaire en butée pendant toute
    // une section — le premier groupe commence à l'offset 0, il ne peut être entièrement
    // visible qu'à scrollTop 0 — puis le relâche d'un coup à la bascule suivante.
    //
    // L'asymétrie est voulue : la page pilote le sommaire, jamais l'inverse. Elle
    // tient sans état supplémentaire ici — c'est `overscroll-behavior: contain`
    // (services.css) qui empêche le sommaire de faire bouger la page. Tant que
    // l'utilisateur le parcourt à la molette, aucun événement scroll de page ne part
    // et rien n'écrase sa position ; la synchronisation ne reprend la main qu'au
    // prochain défilement de la page, l'autorité correcte.

    // Ligne de lecture : hauteur à laquelle une section est réputée être celle qu'on
    // est en train de lire. C'est un repère PERCEPTUEL, à ne pas confondre avec
    // --sticky-top, qui est physique — où une section se pose quand on clique un lien,
    // et la valeur des scroll-margin-top. Les deux ont longtemps été confondus, et le
    // symptôme était net : une section prenait 60 % de l'écran alors que le sommaire
    // désignait encore la précédente, son bord haut n'ayant pas atteint le header.
    //
    // On place donc la ligne à 40 % de la zone de lecture (sous le header) : une
    // section devient active quand elle en occupe 60 %, c'est-à-dire quand elle domine
    // franchement. La marge de 10 points au-delà de la simple majorité évite qu'un
    // aller-retour d'un ou deux pixels ne fasse osciller la sélection.
    const PART_LECTURE = 0.4;
    const ligneDeLecture = () => {
        const stickyTop = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--sticky-top")
        ) || 112;
        return stickyTop + (window.innerHeight - stickyTop) * PART_LECTURE;
    };

    let rafSommaire = null;

    const syncSidebarScroll = () => {
        rafSommaire = null;
        if (!sidebar || window.innerWidth <= 840) return;

        const course = sidebar.scrollHeight - sidebar.clientHeight;
        if (course <= 0) return; // sommaire plus court que sa fenêtre : rien à suivre

        // On repart du verdict du scroll-spy plutôt que de le recalculer : les deux
        // ne peuvent donc pas diverger, et le sommaire suit toujours la barre verte.
        const lienActif = sidebar.querySelector(".nav-link.is-active");
        if (!lienActif) return; // avant le tout premier syncSidebar
        const groupeActif = lienActif.closest(".nav-group");
        const blocActif   = document.getElementById(lienActif.getAttribute("href").slice(1));
        if (!groupeActif || !blocActif) return;

        // Avancement DANS la section courante : 0 quand son haut franchit la ligne de
        // lecture, 1 quand celui de la section suivante la franchit à son tour. Les
        // blocs étant jointifs — ils s'espacent par padding, jamais par marge — la
        // hauteur du bloc courant mesure exactement cette distance.
        // C'est la MÊME ligne que celle du spy, et c'est ce partage qui rend la
        // trajectoire exactement continue : q atteint 1 à la frame précise où le spy
        // bascule sur la section suivante, ni avant ni après. Recopier la valeur ici
        // au lieu d'appeler ligneDeLecture() rouvrirait un saut à chaque bascule.
        const bloc = blocActif.getBoundingClientRect();
        const q = Math.min(1, Math.max(0, (ligneDeLecture() - bloc.top) / bloc.height));

        // Point de lecture reporté dans le sommaire : il descend le long du groupe
        // actif au rythme où la page descend la section. À la bascule, q retombe de
        // 1 à 0 et le point vaut le bas du groupe sortant, soit très exactement le
        // haut du groupe entrant — la trajectoire reste continue, sans raccord.
        // offsetTop est relatif à .services-sidebar : position: sticky en fait une
        // boîte positionnée, donc l'offsetParent, et la valeur se compare directement
        // à scrollTop sans lecture de rect supplémentaire.
        const point = groupeActif.offsetTop + q * groupeActif.offsetHeight;

        // Centré dans la fenêtre : le groupe actif garde du contexte au-dessus et en
        // dessous, et les deux butées — haut de page, fin de course — deviennent des
        // plateaux où le sommaire attend, jamais des à-coups.
        const cible = Math.min(course, Math.max(0, point - sidebar.clientHeight / 2));

        // Comparaison au scrollTop LIVE, et non à une dernière valeur mémorisée comme
        // le fait syncPillGlass : après un défilement manuel du sommaire, un cache
        // ferait croire la cible déjà atteinte et le sommaire resterait désynchronisé
        // jusqu'au prochain changement de section.
        if (Math.abs(cible - sidebar.scrollTop) >= 0.5) sidebar.scrollTop = cible;
    };

    // Coalescence : le calcul lit des géométries puis écrit un scrollTop. Un scroll
    // rapide émet plus d'événements que de frames — sans rAF, plusieurs cycles
    // lecture/écriture se succèderaient dans la même frame pour un seul rendu.
    const demanderSyncSommaire = () => {
        if (rafSommaire === null) rafSommaire = requestAnimationFrame(syncSidebarScroll);
    };

    const updateStickyMetrics = () => {
        updateStickyTop();
        syncPillGlass();
        // Appel direct et non différé : updateStickyTop vient de réécrire le seuil
        // dont dépend le calcul, autant le consommer tout de suite.
        syncSidebarScroll();
    };

    updateStickyMetrics();
    window.addEventListener("resize", updateStickyMetrics, { passive: true });
    window.addEventListener("load", updateStickyMetrics, { once: true });
    // Retour via précédent/suivant : DOMContentLoaded ne rejoue pas et aucun
    // événement scroll n'est garanti, alors que la page est restaurée à sa position.
    onPageRestore.push(updateStickyMetrics);

    // Gel du scroll-spy pendant un scroll piloté (clic sur pill).
    // navScrollActive = true → syncSidebar est gelé.
    // Le debounce de 150 ms détecte la fin du scroll smooth et réactive le spy.
    let navScrollActive   = false;
    let navScrollDebounce = null;

    // Scroll-spy : la section active est la dernière dont le haut du bloc a franchi
    // la ligne de lecture — donc celle qui occupe le plus de l'écran, et non celle
    // qui effleure le header. Itérer dans l'ordre du DOM garantit que la plus basse
    // l'emporte. Par défaut, le premier bloc est actif (haut de page), ce qui couvre
    // le cas où aucune section n'a encore atteint la ligne.
    const syncSidebar = () => {
        if (navScrollActive) return;
        const ligne = ligneDeLecture();
        let activeId = serviceBlocks[0].id;

        serviceBlocks.forEach(block => {
            if (block.getBoundingClientRect().top <= ligne) {
                activeId = block.id;
            }
        });

        activateSidebarLink(activeId);
    };

    window.addEventListener("scroll", () => {
        // Hors du gel : la jointure est une position, pas une sélection. La figer
        // pendant un scroll piloté laisserait le panneau de verre en retard sur
        // la barre pendant toute la durée de l'animation.
        syncPillGlass();

        // Hors du gel pour la même raison. Le clic sur un .nav-link a déjà posé
        // .is-active sur sa cible avant de lancer le scroll : laisser tourner la
        // synchronisation fait glisser le sommaire vers ce groupe PENDANT
        // l'animation, au lieu de l'y faire sauter une fois celle-ci terminée.
        demanderSyncSommaire();

        if (navScrollActive) {
            // Détecte la fin du scroll smooth : 150 ms sans événement scroll
            clearTimeout(navScrollDebounce);
            navScrollDebounce = setTimeout(() => {
                navScrollActive = false;
                syncSidebar();
            }, 150);
        } else {
            syncSidebar();
        }
    }, { passive: true });
    syncSidebar(); // état initial sans attendre un scroll
    // Après syncSidebar, et non seulement dans updateStickyMetrics plus haut : le
    // garde-fou a besoin de .is-active, que seul syncSidebar vient de poser. Sans ce
    // second appel, un chargement en cours de page (rechargement, lien profond) part
    // du seul mapping proportionnel jusqu'au premier défilement.
    syncSidebarScroll();

    // Tous les liens principaux : activation immédiate de la pill cliquée,
    // puis scroll manuel vers la section avec le bon décalage.
    sidebarNavLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href").slice(1);

            // Gel du spy + activation instantanée avant le début du scroll
            navScrollActive = true;
            clearTimeout(navScrollDebounce);
            activateSidebarLink(targetId);

            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;
            const stickyTop = parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue("--sticky-top")
            ) || 112;
            const top = targetEl.getBoundingClientRect().top + window.scrollY - stickyTop;
            window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        });
    });

    // Sous-liens du sommaire et liens d'ancre du pied de page : on scrolle vers la
    // cible ELLE-MÊME, puis on la fait flasher.
    //
    // Viser la section parente plutôt que la fiche — ce que faisait ce handler — ne
    // marchait visiblement que pour les deux premières fiches de chaque secteur : la
    // grille ayant deux colonnes, se poser en haut d'un secteur ne montre que
    // l'en-tête et la première rangée. Les cinq autres fiches recevaient bien leur
    // flash, mais hors écran.
    //
    // Aucun décalage à calculer ici : .service-sub-item et .service-block portent
    // tous deux `scroll-margin-top: var(--sticky-top, …)` (services.css), que
    // scrollIntoView honore. La cible se pose donc sous le header — et sous la barre
    // de pilules en mobile, où --sticky-top inclut sa hauteur.
    //
    // L'animation est pilotée par la classe .is-highlighted (et non :target)
    // pour pouvoir être relancée même si on clique plusieurs fois le même lien.
    //
    // Tout ce qui suit l'arrivée est différé à la fin du défilement, pour deux raisons
    // mesurées sur cette page — voir apresScroll ci-dessous.
    let annulerAttente = null;

    // Exécute fn quand le défilement de la page est retombé. Le minuteur initial est
    // plus long que les suivants : si la cible était déjà en place, le clic ne produit
    // AUCUN événement scroll, et sans lui fn ne partirait jamais.
    const apresScroll = (fn) => {
        annulerAttente?.(); // un clic plus récent annule l'attente précédente, sinon
                            // l'ancienne cible recalerait la page par-dessus la nouvelle
        let minuteur = setTimeout(terminer, 250);
        const onScroll = () => {
            clearTimeout(minuteur);
            minuteur = setTimeout(terminer, 120);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        annulerAttente = () => {
            clearTimeout(minuteur);
            window.removeEventListener("scroll", onScroll);
            annulerAttente = null;
        };
        function terminer() { annulerAttente?.(); fn(); }
    };

    document.querySelectorAll(".services-sidebar .sub-nav a, .site-footer a[href^='#']").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href").slice(1);
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            targetEl.scrollIntoView({ behavior: "smooth", block: "start" });

            apresScroll(() => {
                // 1. Recalage. Les images de fiches sont en `loading="lazy"` SANS
                //    attributs width/height : elles se posent pendant le trajet et
                //    déplacent la cible dans le document, alors que le navigateur vise
                //    la position calculée au clic. Mesuré : la fiche arrivait 30px trop
                //    haut, partiellement sous le header. On ne corrige que les petits
                //    écarts — un grand écart signifie que l'utilisateur a repris la main
                //    pendant le trajet, et lui reprendre le défilement serait pire que
                //    le décalage. `behavior: "auto"` est explicite et nécessaire : sans
                //    lui, scrollIntoView hérite du `scroll-behavior: smooth` de <html>
                //    (style.css) et le recalage se rejouerait en fondu.
                //
                //    La référence est le `scroll-margin-top` PROPRE à la cible, pas
                //    --sticky-top : c'est lui que scrollIntoView applique, et les deux
                //    diffèrent selon la cible. Une fiche reçoit bien les 112px de
                //    services.css, mais une section se voit imposer les 80px du
                //    `section[id]` de style.css, plus spécifique. Mesurer contre
                //    --sticky-top ferait croire à un écart permanent de 32px sur les
                //    sections, et déclencherait à chaque clic un recalage sans effet.
                const marge = parseFloat(getComputedStyle(targetEl).scrollMarginTop) || 0;
                const ecart = targetEl.getBoundingClientRect().top - marge;
                if (Math.abs(ecart) > 1 && Math.abs(ecart) <= 60) {
                    targetEl.scrollIntoView({ behavior: "auto", block: "start" });
                }

                // 2. Flash, réservé aux fiches : les liens du pied de page visent des
                //    .service-block, pour lesquels aucune règle .is-highlighted n'existe.
                //    Sans ce garde, la classe serait posée sans qu'aucune animation ne
                //    démarre — donc sans `animationend` pour la retirer : elle resterait
                //    à demeure et un écouteur {once:true} s'accumulerait à chaque clic.
                if (!targetEl.classList.contains("service-sub-item")) return;

                // Déclenché à l'arrivée, et non au clic : le trajet fluide dure de 0,5 à
                // 1,7 s selon la distance, si bien qu'une fiche lointaine voyait son halo
                // déjà aux deux tiers éteint en apparaissant, là où une fiche proche
                // l'avait presque entier. Le retour est maintenant le même pour les 36.
                // Force le redémarrage de l'animation même si la carte était déjà active.
                targetEl.classList.remove("is-highlighted");
                void targetEl.offsetWidth; // force reflow
                targetEl.classList.add("is-highlighted");
                targetEl.addEventListener("animationend", () => {
                    targetEl.classList.remove("is-highlighted");
                }, { once: true });
            });
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
