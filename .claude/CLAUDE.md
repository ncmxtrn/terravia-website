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
- **style.css** — global aux 5 pages : reset, boutons, header, hero, services, projets (dormant, voir
  « État fonctionnel »), footer.
- **services.css / apropos.css / contact.css / login.css** — spécifique à une page.

**Règle d'or : aucune valeur brute (hex, rgba, rem, px) hors de `tokens.css`.** S'il manque une
valeur, ajouter d'abord un token. Seule exception assumée : `#1A3C34` en dur dans le
`<meta name="theme-color">` des 5 pages et dans `assets/favicon.svg` (ni `<link>` ni `<meta>` ne lit
une variable CSS) — si `--forest-900` change, répercuter à ces endroits.

**`login.css` a un double rôle** : styles de `login.html` *et* classes de formulaire génériques
(`.form-stack`, `.input-wrapper`, `.form-input`, `.error-banner`…) réutilisées par `contact.html`.
Toucher à ces classes impacte les deux pages.

Breakpoints en usage : `380px`, `480px`, `555px`, `840px` (mobile max) / `841px` (tablette),
`950px` (desktop). `555px` est propre à la bascule du logo du header (voir « Logo adaptatif »
plus bas) : il est calé sur la largeur cumulée du logo et du bouton, pas sur une classe
d'appareil — ne pas y raccrocher d'autres règles.

## Architecture JS — un seul fichier

Tout vit dans `script.js`, chargé par les 5 pages. **Aucun JS inline dans le HTML** — règle du projet,
pas une préférence. Le fichier est découpé en sections numérotées (init, navigation, login, contact,
services) et chaque bloc propre à une page est protégé par un guard `if (element)`, ce qui permet de
charger le même script partout sans erreur.

Mécanismes transversaux à connaître avant de toucher au chargement ou au header :

- **Anti-FOUC** — `class="is-loading"` est écrite en dur sur `<html>` dans les 5 pages, retirée par
  `script.js` au `DOMContentLoaded`. Deux replis sans JS : un `<noscript><style>` dans chaque `<head>`
  et un filet `@keyframes` (2 s) dans `style.css`. Modifier l'un des trois sans les autres peut
  laisser la page définitivement invisible.
- **bfcache** — un seul listener `pageshow`, et un tableau `onPageRestore` où les modules enregistrent
  leur ré-application d'état. Ne pas ajouter de listener `pageshow` concurrent.
- **Transitions de page** — les liens `.transition-link` ajoutent `fade-out` sur `<body>` puis
  naviguent au terme du fondu. La durée vit dans **un seul endroit**, le token
  `--duration-page-fade` : `style.css` la consomme pour la transition de `.page-transition`, et
  `script.js` la **lit** via `getComputedStyle` (`dureeFonduPage`) pour caler son minuteur. Ne pas
  réintroduire de valeur en dur côté JS. La même déclaration gouverne le fondu d'**entrée** de
  l'anti-FOUC — changer le token affecte les deux.
- **États du header** — `is-floating` (scrollY ≤ 0), `is-scrolled` (hero sorti du viewport, via
  IntersectionObserver), `show-cta` ; l'état « caché » est dérivé en CSS. Les classes initiales sont
  écrites en dur dans le markup pour éviter un flash au chargement.
- **Masquage au scroll descendant (mobile)** — quatrième état, `is-hidden` : sous `840px`, le header
  s'escamote quand on descend et revient quand on remonte. Il se distingue des trois autres sur deux
  points — il dépend de la **direction** du scroll et non de sa position (d'où un listener dédié, à
  coalescence `requestAnimationFrame`, plutôt qu'un observer de plus), et il **n'ajoute que du
  masquage** : il ne révèle jamais un header que l'état caché dérivé tient hors écran, ce qui laisse
  le haut du hero d'`index.html` inchangé. Les deux mécanismes posent le même `translateY(-100%)` et
  cohabitent sans conflit de spécificité. Le JS **et** le média CSS gardent tous deux le seuil des
  `840px`. Miroir sur `<body>` : la classe **`body.header-hidden`**, dont l'unique consommateur est
  `services.css` — la barre de pilules collante y passe à `top: 0` pour suivre le header (le CSS ne
  peut pas cibler un ancêtre de `.site-header`). `--sticky-top` n'est volontairement **pas** recalculé
  selon cet état : la ligne de lecture du scroll-spy en dérive, et les `scroll-margin-top` doivent
  rester stables.
- **Surface de verre unique (services.html, mobile)** — accostée sous le header, la barre de pilules
  lui est jointive : deux `backdrop-filter` voisins y feraient une marche de ton (chacun floute son
  **propre** arrière-plan en s'écrêtant à ses propres bords). Le verre est donc porté par **un seul**
  élément, `.has-pill-nav .site-header::before`, qui déborde vers le bas ; le header et la barre sont
  tous deux transparents, et la barre passe **au-dessus** du header (`z-index: 101`) pour que le flou
  ne s'applique pas aux pilules. Pendant un `menu-open`, c'est le voile du menu (102) qui passe devant
  elle et le header qui monte à 104 — les deux valeurs vivent dans `style.css`, section « Feuille du
  menu mobile ».
  La jointure est **mesurée** en continu par `syncPillGlass` (`script.js`), jamais déduite d'un seuil :
  la barre ne quitte pas le header d'un coup, elle est chassée vers le haut par le bas de sa zone
  collante en fin de layout et glisse derrière lui sur ~62px de défilement. Deux variables
  complémentaires, dont la somme fait la hauteur de la barre — **`--pill-glass-overhang`** (part visible
  *sous* le header, ce dont le verre doit déborder) et **`--pill-bar-clip`** (part passée *derrière*, que
  `clip-path` coupe, sans quoi les pilules recouvriraient le logo et le CTA). Toute bascule binaire à
  leur place laisse, pendant ce trajet, soit une bande de verre vide sous le header — très visible sur
  le footer sombre — soit des pilules qui débordent par-dessus lui.
  Le **débordement** se mesure toujours contre le bas du header — le panneau de verre part de sa boîte,
  il doit déborder de ce qui l'en sépare — et ce repère suit le header quand il s'escamote, donc sans
  rien savoir de `header-hidden`. En revanche **le test « la barre est-elle accostée ? » ne peut pas s'y
  fier seul** : sur le papier les deux parcourent les mêmes 80px avec la même durée et la même courbe,
  mais sur iPhone c'est faux — le `transform` du header est composité et arrive vite, le `top` de la
  barre est animé sur le thread principal, occupé par le défilement. La barre se retrouve 80px sous un
  header déjà remonté et se fait déclarer « pas accostée » alors qu'elle l'est ; le verre la lâchait
  pendant toute la transition. D'où un **second test, joué seulement si le premier échoue** : le `top`
  **calculé** de la barre, seul repère toujours cohérent avec sa position rendue — accostée, elle est
  rendue exactement à son offset collant. Toujours **ne pas** déduire ce repère de `header-hidden` ni du
  `top` *visé* : une telle valeur bascule à la pose de la classe alors que la barre met toute la
  transition à descendre. La distinction est entre la valeur **calculée** (qui suit la transition image
  par image, correcte) et la valeur **visée** (qui saute, piège).
  **La mesure doit en plus être rejouée à la fin de chaque transition** (deux écouteurs `transitionend`
  dans `script.js` : `transform` sur le header, `top` sur la barre) : le défilement piloté par un clic
  sur une pilule se termine avant les transitions, la dernière mesure porte donc sur un état de passage
  et plus aucun événement ne vient la corriger. On écoute les **deux** boîtes, c'est la dernière arrivée
  qui fixe la géométrie. Ne pas se fier à l'inspecteur de bureau pour ce genre de symptôme : il simule un
  écran, pas le moteur de rendu ni la lenteur du thread principal d'un téléphone.
  Sans JS (pas de `.has-pill-nav`), la barre garde un fond opaque ; les deux variables valent alors 0
  par leur repli `var(…, 0px)`, ce qui limite le verre au header — le bon rendu en haut de page.
  **Menu burger ouvert, le verre change de porteur — il ne s'éteint pas.** Le débordement est annulé
  (il repeindrait par-dessus le voile, cf. « Feuille du menu mobile »), et la barre reprend le verre
  **à son compte** : mêmes tokens, même géométrie. Elle a porté un temps un fond blanc opaque, et
  c'était visible — à l'instant du clic, avant même que le voile ne monte, elle claquait du dépoli à
  l'aplat, ce qui se lit non comme un changement de fond mais comme une barre qui **perd** son fond
  puis le retrouve. C'est la seule fenêtre où deux `backdrop-filter` voisins sont tolérables : le
  header est opaque au-dessus, il n'y a plus de jointure à accorder. Un `backdrop-filter: blur(0px)`
  neutre est déclaré en permanence sur la barre, uniquement pour que la couche de composition existe
  déjà à cet instant — sans elle, un téléphone peut laisser les pilules à découvert une image ou deux.
- **Sommaire synchronisé (services.html, desktop)** — la sidebar fait ~1700px de liens pour 650-800px
  de fenêtre visible : elle défile en interne (`overflow-y: auto`), et `syncSidebarScroll` reporte sur
  son `scrollTop` la progression de la page. Le report est fait **section par section**, jamais par une
  règle de trois sur toute la page : l'avancement dans la section courante (`q`, entre 0 et 1) est
  reporté sur le groupe correspondant, `point = groupe.offsetTop + q × groupe.offsetHeight`, que l'on
  centre dans la fenêtre. Les hauteurs des blocs n'ont donc pas besoin d'être proportionnelles à celles
  des groupes — chaque section pilote exactement son groupe. À la bascule, `q` retombe de 1 à 0 et le
  point vaut le bas du groupe sortant, soit exactement le haut du groupe entrant : **la trajectoire est
  continue par construction**, ce qui dispense de tout garde-fou.
  **Ne pas remplacer ce report par un mapping proportionnel global** : il faudrait alors borner la cible
  pour ramener le groupe actif dans la fenêtre, et cette borne produit des sauts — exiger qu'un groupe
  soit *entièrement* visible épingle le sommaire en butée pendant toute une section (le premier groupe
  est à l'offset 0, il ne peut être entièrement visible qu'à `scrollTop` 0), puis le relâche d'un coup
  à la bascule. Mesuré à ~214px de saut sur une géométrie réaliste.
  La fonction **`ligneDeLecture()`** est partagée avec le scroll-spy et ne doit jamais être recopiée
  en dur : c'est ce partage qui fait coïncider la bascule du spy avec `q = 1`. Deux valeurs divergentes
  rouvriraient un saut à chaque changement de section. Appelé hors du gel `navScrollActive`, comme
  `syncPillGlass` et pour la même raison — une position n'est pas une sélection.
- **Ligne de lecture (`ligneDeLecture`, services.html)** — repère **perceptuel** qui décide quelle
  section est active, à distinguer de `--sticky-top`, qui est **physique** (où une section se pose au
  clic sur un lien, et la valeur des `scroll-margin-top`). Elle vaut `--sticky-top + 40 % de la zone
  sous le header` : une section devient active quand elle occupe **60 %** de la zone de lecture, pas
  quand son bord haut effleure le header. **Ne pas revenir à `--sticky-top` comme seuil du spy** :
  c'était le cas avant, et une section pouvait occuper 73 % de l'écran pendant que le sommaire
  désignait encore la précédente. Les 60 % ne sont pas une simple majorité : les 10 points au-delà
  évitent qu'un aller-retour de quelques pixels ne fasse osciller la sélection, et ils sont calés sur
  deux cas réels — une section à 53 % ne bascule pas, à 73 % elle a déjà basculé.
  **L'asymétrie est le cœur du dispositif : la page pilote le sommaire, jamais l'inverse.** Elle ne
  coûte aucun état côté JS, c'est `overscroll-behavior: contain` (services.css) qui la tient, en
  empêchant le sommaire de propager son défilement à la page en fin de course. Tant que l'utilisateur
  parcourt le sommaire, aucun événement `scroll` de page ne part et rien n'écrase sa position ; la
  synchronisation ne reprend la main qu'au prochain défilement de la page. **Ne pas ajouter de timer
  de pause après une interaction manuelle** — il ferait décrocher le sommaire de la page sans rien
  résoudre. Le calcul est désactivé sous `840px` (la sidebar y est une barre de pilules horizontale)
  et compare toujours au `scrollTop` **courant**, jamais à une valeur mémorisée : un cache, ici,
  laisserait le sommaire désynchronisé après un défilement manuel.
- **Logo adaptatif du header** — sur `index.html`, `services.html` et `apropos.html`, le `.logo` du header
  porte la classe **`.logo--adaptive`** et contient **deux** `<img>` : le lockup `logo-noir.svg`
  (`.logo-icon--full`) et le monogramme carré `logo-monogramme-noir.svg` (`.logo-icon--mark`). Sous
  `555px` ils se croisent en fondu — mais la bascule est pilotée par **`.show-cta`**, pas par la
  largeur seule : c'est le bouton « Contactez-nous » qui crée l'encombrement, donc l'état flottant en
  haut du hero garde volontairement le lockup complet. **`contact.html` est hors du dispositif** (pas
  de classe, pas de second `<img>`) : son `show-cta` en dur ne sert qu'à empêcher le header de se
  cacher, son CTA étant neutralisé par `contact.css` — rien n'y encombre la grille. Les `.logo` de
  pied de page sont hors du dispositif pour la même raison. La largeur animée de `.logo--adaptive`
  impose un token en dur, `--logo-lockup-w` — **à recalculer (hauteur × 3,27) si `--logo-icon-h`
  change**.
- **Zone collante vs `--sticky-top` (services.html)** — deux mesures à ne pas confondre.
  **`hauteurZoneCollante()`** rend ce qui reste collé en haut : le header seul en desktop, header
  **+ barre de pilules** en mobile. **`--sticky-top`** y ajoute un buffer visuel (32px desktop,
  16px mobile). Les liens de **section** visent la zone **nue** — une section demandée
  explicitement vient **à ras** du header ; avec `--sticky-top` elle se posait 32px plus bas, une
  bande vide entre le header et son filet. Les **fiches**, elles, gardent le buffer via leur
  `scroll-margin-top`. Ne pas uniformiser : les deux valeurs répondent à deux besoins opposés.
  Le recalage des liens de section se mesure contre `hauteurZoneCollante()`, **pas** contre le
  `scroll-margin-top` de la section — celui-ci vaut 80px et ignore la barre de pilules, ce qui
  poserait la section derrière elle en mobile.
- **Ancres de services (services.html)** — le handler des sous-liens distingue **deux cibles** :
  `elScroll`, ce vers quoi on défile, et `targetEl`, ce qui flashe (toujours la fiche cliquée).
  `elScroll` vaut la **section** quand la fiche est en **première rangée** de sa grille — on ouvre
  alors sur l'en-tête, icône et titre du secteur apparents, la rangée restant à l'écran juste en
  dessous — et la **fiche** au-delà. Viser la section pour *toutes* les fiches était le
  comportement d'origine, et il ne marchait visiblement que pour les deux premières : la grille
  ayant deux colonnes, se poser en haut d'un secteur ne montre que l'en-tête et la première
  rangée, les autres fiches recevant leur flash hors écran. **Ne pas rebasculer sur une cible
  unique**, dans un sens ou dans l'autre.
  La rangée est déduite des `offsetTop` et non d'un compte figé à deux : la grille passe à une
  colonne sous 840px, et suivrait un passage à trois. Le **recalage doit porter sur `elScroll`**,
  jamais sur `targetEl` — mesurer la fiche après avoir défilé vers sa section rouvrirait l'écart
  permanent décrit plus bas. Aucun décalage n'est calculé en JS : `scrollIntoView` applique le
  `scroll-margin-top` de la cible.
  Recalage et flash sont **différés à la fin du défilement** (`apresScroll`), pour deux raisons
  mesurées : les images de fiches sont en `loading="lazy"` **sans attributs `width`/`height`**, donc
  elles se posent pendant le trajet et déplacent la cible dans le document (−30px constatés) alors
  que le navigateur vise la position calculée au clic ; et le trajet dure de 0,5 à 1,7 s selon la
  distance, si bien qu'un flash lancé au clic était déjà aux deux tiers éteint à l'arrivée sur une
  fiche lointaine. Le minuteur initial d'`apresScroll` est plus long que les suivants **à dessein** :
  cliquer une cible déjà en place ne produit aucun événement `scroll`, et sans lui le flash ne
  partirait jamais.
  Le recalage se mesure contre le **`scroll-margin-top` propre à la cible**, pas contre
  `--sticky-top` : les deux diffèrent. Une fiche reçoit les 112px de `services.css`, mais une section
  se voit imposer les **80px** du `section[id]` de `style.css` — plus spécifique (0,1,1) que
  `.service-block` (0,1,0), donc le `scroll-margin-top` de `services.css` sur `.service-block` est
  **mort**. Comparer à `--sticky-top` ferait croire à un écart permanent de 32px sur les sections.
- **Feuille du menu mobile (≤ 840px)** — le menu burger n'est pas un panneau accroché sous le header :
  c'est une feuille qui monte du bas de l'écran, qu'on peut saisir n'importe où et renvoyer d'un
  lancer. **Sa position, sa visibilité et l'opacité du voile sont écrites en style inline par
  `script.js`, image par image** (fonction `poserFeuille`), jamais par une transition CSS : une
  transition ignore la vitesse d'entrée, et la main sent le décrochage à l'instant du relâchement. Le
  CSS ne pose que l'apparence et l'état de repos, qui est aussi le repli sans JS. **Ne pas déclarer de
  `transition` sur `transform`/`visibility` de `.main-nav` sous 840px** — elle entrerait en
  concurrence avec le ressort.
  Trois pièces : un geste à hystérésis de 8px (sous ce seuil on ne capture pas le pointeur, sans quoi
  le `click` serait retargé vers la feuille et les liens deviendraient inertes), une projection
  d'inertie à la formule d'Apple (`v/1000 × 0,998/0,002`) qui décide du congé au-delà de 42 % de la
  hauteur, et un ressort qui hérite de la vitesse du doigt. Un `dragstart` est neutralisé sur la
  feuille : un appui maintenu sur un lien déclenche sinon le glisser-déposer natif, qui répond par un
  `pointercancel` et tue le geste au deuxième pixel.
  Le même `<nav class="main-nav">` sert les deux rôles — barre horizontale en desktop, feuille en
  mobile. **C'est ce qui impose que le header ne soit pas un bloc conteneur** : un `backdrop-filter`,
  même à `blur(0px)`, en fait un pour ses descendants en `position: fixed`, et la feuille se calait
  alors sur le bas du header au lieu du bas de l'écran. Sous 840px, fond et flou du header sont donc
  déportés sur `.site-header::before` — même remède que la barre de pilules ci-dessus. Ne pas
  reprendre `backdrop-filter` sur `.site-header` dans ce média.
  `menu-open` est portée par le header (élévation) **et** par le body (verrou du défilement), et
  n'est retirée qu'une fois la feuille **sortie de l'écran**, pas au clic : sinon le header replonge
  sous le voile et la page redevient défilante pendant le vol retour.
  **Le verre du header se densifie le temps de l'ouverture**
  (`.site-header.menu-open:not(.is-floating)::before`) — ce n'est pas cosmétique, et la raison est
  **arithmétique, pas un bug** : le voile est à 102, le header monte à 104, ils composent donc le gris
  dans l'**ordre inverse** l'un de l'autre. Le header montre `0,72 blanc + 0,28 × (page grisée)` — le
  gris n'agit que sur ce que le verre laisse passer, il est **dilué au quart** — quand la barre, sous
  le voile, le prend en entier. Le header prend alors la teinte de la page **en clair**, et cette
  teinte **bouge** avec ce qui défile derrière : mesuré dans Chromium sur ses dix derniers pixels,
  teinte 219 et variation horizontale 5,1, contre 252 et 1,7 pour une surface opaque. Ça se lit comme
  un trait clair au-dessus des pilules, comme si le grisé s'arrêtait avant le header.
  **Il n'y a pas d'échappatoire : du verre au-dessus du voile laisse voir la page.** « Le header ne
  change pas d'aspect » et « rien ne transparaît » sont incompatibles — il faut densifier. Faire
  repasser le verre **sous** le voile en n'élevant que `.header-content` a été essayé : le header
  disparaît, la photo s'affiche nette à sa place. Ne pas y revenir.
  `:not(.is-floating)` exclut le haut du hero d'`index.html`, où le header est volontairement
  transparent avec un logo blanc. Les trois classes du sélecteur sont nécessaires : il faut (0,3,1)
  pour l'emporter sur `.has-pill-nav .site-header::before` de `services.css` (0,2,1), chargé après
  `style.css`.
  **`services.html` atteint la même densité autrement : en doublant la couche, pas en changeant la
  couleur.** Son pseudo-élément déborde pour peindre la barre de pilules et c'est lui qui reprend la
  bande quand `menu-open` tombe : un blanc plein y claque à cet instant avant de revenir au verre en
  400 ms. Il garde donc ses 72 % (`--surface-glass` rendu en (0,3,2)), et c'est la **boîte** du header
  qui reçoit une seconde couche du même token — `0,72 + 0,28 × 0,72 = 0,92`, mesuré à 242,7 de teinte
  et 2,48 de variation, soit le trait supprimé. Aucune valeur brute, et la boîte transitionne déjà son
  `background-color` sur 400 ms, donc la densification monte au lieu de claquer.
  À savoir aussi, si un jour un éclair blanc est signalé à l'ouverture : tout ce qui dépend de
  `menu-open` bascule **d'un coup** à la pose de la classe, alors que l'opacité du voile, elle, monte
  **progressivement** au rythme du ressort (~400 ms). Les deux ne sont pas synchronisés.
- **Révélation au scroll** — `.animate-on-scroll` reçoit `.visible` via IntersectionObserver.
- **Liens non implémentés** — `.link-arrow` et `.link-placeholder` interceptent le clic et affichent
  `alert("En cours de construction...")`. TODO ouvert : remplacer par une notification non bloquante.

## État fonctionnel

- **Aucun backend.** Le formulaire de `contact.html` valide côté client puis simule le succès et se
  reset ; `login.html` valide les champs et affiche une bannière d'erreur, sans authentification
  réelle. Le markup est prêt pour un branchement ultérieur (Formspree, Netlify Forms ou API).
- Le site n'est pas encore déployé.
- **Section « Projets récents » : retirée du HTML, styles conservés volontairement.** L'activité
  démarre et il n'y a pas encore de réalisations à présenter ; la section reviendra dès qu'il y aura
  de vrais projets à montrer. Le CSS est donc **dormant, pas mort — ne pas le supprimer** lors d'un
  nettoyage de code inutilisé :
  - `style.css` — section 6 « SECTION PROJETS » (`.projects-section`, `.projects-header`,
    `.projects-grid`, `.project-card`, `.project-bg`, `.project-overlay`, `.project-info`,
    `.project-category`, `.project-detail`), plus `.project-card` dans le média `480px` de la
    section 1 et `.projects-grid` / `.projects-header` dans les médias `841px` et `950px`.
  - `tokens.css` — `--shadow-project-hover`, dont c'est le seul usage.
  - Pour la réactiver : remettre `<section class="projects-section" id="projets">` dans `index.html`
    entre la section services et la section technologie, et le lien `Projets` dans la `.main-nav` des
    quatre pages qui en ont une (`#projets` depuis `index.html`, `index.html#projets` depuis
    `services.html`, `apropos.html` et `contact.html`). Voir le commit `68ebb65` pour le markup exact.
- Polices Google (Montserrat, Orbitron, Material Symbols Outlined) chargées **avant** les CSS locaux,
  pour que la cascade locale les surcharge sans `!important`.
- Les noms de fichiers d'`assets/` sont volontairement sans accent (les accents cassaient les URL).

## Conventions

- Commits en français, format `type(portée): description` — ex. `fix(connexion): …`,
  `feat(services): …`, `chore(footer): …`. Travailler sur une branche, jamais sur `main`.
- Le code est densément commenté, en français, et explique **l'intention** (« pourquoi ce choix »)
  plutôt que de paraphraser l'instruction. Chaque fichier ouvre sur un bloc d'en-tête décrivant son
  rôle et son sommaire — maintenir ce niveau et mettre le sommaire à jour en ajoutant une section.