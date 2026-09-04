# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Avant toute demande d'autorisation

Chaque fois qu'une commande Bash (ou toute autre action) demande une autorisation, **expliquer
d'abord, en une ou deux phrases**, ce que la commande fait et pourquoi elle est nécessaire ici.
Explication destinée à un débutant : mots simples, pas de jargon non expliqué, et **pas de blabla** —
juste l'essentiel avant de lancer la commande.

**L'explication va dans la demande d'autorisation elle-même**, pas seulement dans le chat : c'est
l'encadré affiché au moment du « Allow ? » qui est lu. Concrètement, le champ `description` de
l'outil Bash doit être **en français** et contenir *ce que fait la commande* **et** *pourquoi elle
est nécessaire ici* — pas une étiquette technique en anglais du type « Create a new branch ». Une
explication laissée uniquement dans le message de chat ne compte pas.

## Le projet

Site vitrine statique de **Solutions Terravia** (géomatique et arpentage, Québec) : 5 pages HTML
(`index`, `services`, `apropos`, `contact`, `login`) servies telles quelles, sans build, sans
dépendance npm, sans tests. Le contenu, les commentaires du
code et les messages de commit sont **en français** — s'y tenir.

## Lancer le site

Extension **Live Server** (VS Code), port `5501` — voir `.vscode/settings.json`. Ouvrir un `.html`
puis « Go Live ». Aucune commande de build, de lint ou de test : ce qui est dans le dépôt est ce qui
est servi.

## Architecture CSS — 3 couches, dans cet ordre

Chaque page importe, dans cet ordre exact : `tokens.css` → `style.css` → `[page].css`

- **tokens.css** — source unique de vérité. Variables `:root` (couleurs, `--text-*`, `--space-*`,
  `--radius-*`, `--shadow-*`, `--header-height`), défauts sémantiques sur les balises de base, et
  quelques utilitaires (`.label-upper`, `.font-display`, `.text-highlight`, `.text-gradient`).
- **style.css** — global aux 5 pages : reset, boutons, header et menu, en-têtes de section,
  révélation au défilement, liens à flèche, footer. Rien qui ne serve qu'à une seule page : si une
  règle n'a plus qu'un seul appelant, sa place est dans la feuille de cette page.
- **index.css / services.css / apropos.css / contact.css / login.css** — spécifique à une page.
  `index.css` porte le hero, la grille de cartes de services, la section technologie et le CSS
  dormant des projets (voir « État fonctionnel »).

**Règle d'or : aucune valeur brute (hex, rgba, rem, px) hors de `tokens.css`.** S'il manque une
valeur, ajouter d'abord un token. Seule exception assumée : `#1A3C34` en dur dans le
`<meta name="theme-color">` des 5 pages et dans `assets/favicon.svg` (ni `<link>` ni `<meta>` ne lit
une variable CSS) — si `--forest-900` change, répercuter à ces endroits.

**`login.css` a un double rôle** : styles de `login.html` *et* classes de formulaire génériques
(`.form-stack`, `.input-wrapper`, `.form-input`, `.error-banner`…) réutilisées par `contact.html`.
Toucher à ces classes impacte les deux pages.

Breakpoints en usage : `380px`, `480px`, `555px`, `840px` (mobile max) / `841px` (tablette),
`950px` (desktop). `555px` est propre à la bascule du logo du header (voir « Logo adaptatif » dans
l'index plus bas, détail dans la skill `mecanismes-front`) : il est calé sur la largeur cumulée du
logo et du bouton, pas sur une classe d'appareil — ne pas y raccrocher d'autres règles.

## Architecture JS — un seul fichier

Tout vit dans `script.js`, chargé par les 5 pages. **Aucun JS inline dans le HTML** — règle du projet,
pas une préférence. Le fichier est découpé en sections numérotées (init, navigation, login, contact,
services) et chaque bloc propre à une page est protégé par un guard `if (element)`, ce qui permet de
charger le même script partout sans erreur.

Mécanismes transversaux — **le détail vit dans la skill `mecanismes-front`**, dont le corps est
chargé à la demande et non à chaque session.

**IMPORTANT — avant de modifier le header, le menu burger, la barre de pilules de `services.html`,
le scroll-spy ou le chargement des pages : invoquer la skill `mecanismes-front`.** Les lignes
ci-dessous ne sont que des garde-fous : elles disent qu'un piège existe, pas comment il marche. Un
changement qui rend fausse une phrase de la skill doit être répercuté dans la skill **au même
commit** — une couleur, un texte ou une valeur de token ne le nécessitent pas.

- **Anti-FOUC** — `is-loading` sur `<html>` + deux replis sans JS ; modifier l'un des trois sans les
  autres peut laisser la page définitivement invisible.
- **bfcache** — un seul listener `pageshow`, via le tableau `onPageRestore`. Pas de second listener.
- **Transitions de page** — durée dans le seul token `--duration-page-fade`, lu par le JS ; jamais de
  valeur en dur côté JS.
- **États du header** — `is-floating`, `is-scrolled`, `show-cta`, `is-hidden`, plus le miroir
  `body.header-hidden` consommé par `services.css`.
- **Masquage au scroll descendant (mobile)** — seuil `840px` tenu en double, le JS **et** le média
  CSS.
- **Surface de verre unique (services, mobile)** — un seul `backdrop-filter` pour le header **et** la
  barre de pilules ; jointure **mesurée** en continu (`syncPillGlass`), jamais déduite d'un seuil.
- **Sommaire synchronisé (services, desktop)** — report **section par section** ; ne pas le remplacer
  par un mapping proportionnel global (~214px de saut mesurés).
- **Ligne de lecture** — seuil du scroll-spy à 60 % de la zone de lecture, à ne pas ramener à
  `--sticky-top` ; `ligneDeLecture()` est partagée avec le sommaire, ne jamais la recopier en dur.
- **Logo adaptatif** — bascule pilotée par `.show-cta`, pas par la largeur seule ; `--logo-lockup-w`
  à recalculer (hauteur × 3,27) si `--logo-icon-h` change.
- **Zone collante vs `--sticky-top`** — deux mesures aux besoins opposés, ne pas uniformiser.
- **Ancres de services** — deux cibles, `elScroll` (où l'on défile) et `targetEl` (ce qui flashe) ; ne
  pas rebasculer sur une cible unique. Recalage et flash différés à la fin du défilement.
- **Feuille du menu mobile (≤ 840px)** — position écrite en style inline **image par image** par le
  JS ; ne pas déclarer de `transition` sur `transform`/`visibility` de `.main-nav` sous 840px, ni
  reprendre `backdrop-filter` sur `.site-header` dans ce média.
- **Révélation au scroll** — `.animate-on-scroll` reçoit `.visible` via IntersectionObserver.
- **Liens non implémentés** — `.link-arrow` et `.link-placeholder` affichent
  `alert("En cours de construction...")`. TODO ouvert : notification non bloquante.

## État fonctionnel

- **Aucun backend.** Le formulaire de `contact.html` valide côté client puis simule le succès et se
  reset ; `login.html` valide les champs et affiche une bannière d'erreur, sans authentification
  réelle. Le markup est prêt pour un branchement ultérieur (Formspree, Netlify Forms ou API).
- Le site n'est pas encore déployé.
- **Section « Projets récents » : retirée du HTML, styles conservés volontairement.** L'activité
  démarre et il n'y a pas encore de réalisations à présenter ; la section reviendra dès qu'il y aura
  de vrais projets à montrer. Le CSS est donc **dormant, pas mort — ne pas le supprimer** lors d'un
  nettoyage de code inutilisé :
  - `index.css` — section 4 « SECTION PROJETS » (`.projects-section`, `.projects-header`,
    `.projects-grid`, `.project-card`, `.project-bg`, `.project-overlay`, `.project-info`,
    `.project-category`, `.project-detail`, `.link-view-all`), plus `.project-card` dans le média
    `480px` de la section 1 et `.projects-grid` / `.projects-header` dans les médias `841px` et
    `950px` de la section 6.
  - `tokens.css` — `--shadow-project-hover`, dont c'est le seul usage.
  - Pour la réactiver : remettre `<section class="projects-section" id="projets">` dans `index.html`
    entre la section services et la section technologie, et le lien `Projets` dans la `.main-nav` des
    quatre pages qui en ont une (`#projets` depuis `index.html`, `index.html#projets` depuis
    `services.html`, `apropos.html` et `contact.html`). Voir le commit `68ebb65` pour le markup exact.
- Polices Google (Montserrat, Orbitron, Material Symbols Outlined) chargées **avant** les CSS locaux,
  pour que la cascade locale les surcharge sans `!important`.
- Les noms de fichiers d'`assets/` sont volontairement sans accent (les accents cassaient les URL).

## Photos des fiches de `services.html`

Rangées dans `assets/services/<secteur>/<sujet>.<ext>` — minuscules, sans accent, tirets, sans
répéter le nom du secteur que le dossier porte déjà. Le `alt` décrit **ce que l'image montre**, pas
le titre de la fiche : les deux se recoupent, mais un lecteur d'écran doit apprendre quelque chose de
l'image plutôt que de relire le `h3` juste dessous.

**Taille minimale : 1600 × 340 px.** Le bandeau (`.service-card-img`) fait 160 px de haut et prend
toute la largeur de la fiche. La fiche est à son plus large **non pas sur grand écran mais à 840 px
de fenêtre**, juste avant que la grille ne repasse à deux colonnes : 840 − 48 de marges = **792 px**.
Au-delà de 840 px la barre latérale de 240 px et la seconde colonne reprennent la place, et la fiche
retombe à 452 px sur un écran de 1280 px. C'est donc 792 × 160, doublé pour les écrans à haute
densité, d'où 1600 × 340. En dessous, l'image est agrandie et devient visiblement floue.

Deux photos sont actuellement sous ce seuil et paraîtront floues :
`secteur-minier/calculs-dynamitage.jpg` (299 × 225) et `secteur-minier/exportation-dao.jpg`
(315 × 160).

**Cadrage** : `object-fit: cover` sur un bandeau de ratio ~5:1 ne garde d'une photo 16:9 que le tiers
central en hauteur — le haut et le bas sont coupés. Le sujet doit être centré verticalement.

**Poids** : aucune compression n'a encore été faite, le dossier pèse ~33 Mo pour des images affichées
en 160 px de haut. Chantier ouvert, à traiter dans un commit dédié.

## Conventions

- Commits en français, format `type(portée): description` — ex. `fix(connexion): …`,
  `feat(services): …`, `chore(footer): …`. Travailler sur une branche, jamais sur `main`.
- Le code est densément commenté, en français, et explique **l'intention** (« pourquoi ce choix »)
  plutôt que de paraphraser l'instruction. Chaque fichier ouvre sur un bloc d'en-tête décrivant son
  rôle et son sommaire — maintenir ce niveau et mettre le sommaire à jour en ajoutant une section.