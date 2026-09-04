---
name: mecanismes-front
description: >-
  Mécanismes transversaux du front de Solutions Terravia — header (quatre états, masquage au
  scroll), feuille du menu burger, surface de verre de la barre de pilules de services.html,
  sommaire synchronisé et scroll-spy, ancres de fiches, logo adaptatif, anti-FOUC, transitions de
  page, bfcache. À charger avant toute modification de ces zones : elles tiennent sur des équilibres
  mesurés (pixels, spécificité CSS, thread principal d'un iPhone) qu'on ne devine pas en lisant le
  code.
when_to_use: >-
  Dès que la demande touche le header, le menu burger ou sa feuille, la barre de pilules, le
  sommaire ou le scroll-spy de services.html, les ancres de fiches, le logo du header, le chargement
  ou le fondu des pages — ou un symptôme du genre : barre qui perd son fond, éclair blanc à
  l'ouverture du menu, saut du sommaire, section active en retard, page restée invisible.
---

# Mécanismes transversaux du front

Ce fichier tenait auparavant dans `.claude/CLAUDE.md`, dont il représentait 77 % du poids alors
qu'il n'est utile qu'à une tâche sur cinq. Il en a été sorti pour que le reste des règles du projet
soit mieux suivi ; le contenu n'a pas changé. `CLAUDE.md` en garde un index d'une ligne par
mécanisme — l'avertissement y reste, le *pourquoi* est ici.

Ce qui suit décrit des équilibres **mesurés**, pas des préférences : chaque « ne pas faire X » vient
d'un symptôme constaté, souvent sur téléphone. Les lire avant de modifier le code évite de refaire
un aller-retour déjà fait.

**Sommaire**

1. [Anti-FOUC](#anti-fouc)
2. [bfcache](#bfcache)
3. [Transitions de page](#transitions-de-page)
4. [États du header](#états-du-header)
5. [Masquage au scroll descendant (mobile)](#masquage-au-scroll-descendant-mobile)
6. [Surface de verre unique (services.html, mobile)](#surface-de-verre-unique-serviceshtml-mobile)
7. [Sommaire synchronisé (services.html, desktop)](#sommaire-synchronisé-serviceshtml-desktop)
8. [Ligne de lecture (services.html)](#ligne-de-lecture-serviceshtml)
9. [Logo adaptatif du header](#logo-adaptatif-du-header)
10. [Zone collante vs `--sticky-top` (services.html)](#zone-collante-vs---sticky-top-serviceshtml)
11. [Ancres de services (services.html)](#ancres-de-services-serviceshtml)
12. [Feuille du menu mobile (≤ 840px)](#feuille-du-menu-mobile--840px)
13. [Révélation au scroll](#révélation-au-scroll)
14. [Liens non implémentés](#liens-non-implémentés)
15. [Maintenance de ce fichier](#maintenance-de-ce-fichier)

---

## Anti-FOUC

`class="is-loading"` est écrite en dur sur `<html>` dans les 5 pages, retirée par `script.js` au
`DOMContentLoaded`. Deux replis sans JS : un `<noscript><style>` dans chaque `<head>` et un filet
`@keyframes` (2 s) dans `style.css`. Modifier l'un des trois sans les autres peut laisser la page
définitivement invisible.

## bfcache

Un seul listener `pageshow`, et un tableau `onPageRestore` où les modules enregistrent leur
ré-application d'état. Ne pas ajouter de listener `pageshow` concurrent.

## Transitions de page

Les liens `.transition-link` ajoutent `fade-out` sur `<body>` puis naviguent au terme du fondu. La
durée vit dans **un seul endroit**, le token `--duration-page-fade` : `style.css` la consomme pour la
transition de `.page-transition`, et `script.js` la **lit** via `getComputedStyle`
(`dureeFonduPage`) pour caler son minuteur. Ne pas réintroduire de valeur en dur côté JS. La même
déclaration gouverne le fondu d'**entrée** de l'anti-FOUC — changer le token affecte les deux.

## États du header

`is-floating` (scrollY ≤ 0), `is-scrolled` (hero sorti du viewport, via IntersectionObserver),
`show-cta` ; l'état « caché » est dérivé en CSS. Les classes initiales sont écrites en dur dans le
markup pour éviter un flash au chargement.

## Masquage au scroll descendant (mobile)

Quatrième état, `is-hidden` : sous `840px`, le header s'escamote quand on descend et revient quand on
remonte. Il se distingue des trois autres sur deux points — il dépend de la **direction** du scroll
et non de sa position (d'où un listener dédié, à coalescence `requestAnimationFrame`, plutôt qu'un
observer de plus), et il **n'ajoute que du masquage** : il ne révèle jamais un header que l'état
caché dérivé tient hors écran, ce qui laisse le haut du hero d'`index.html` inchangé. Les deux
mécanismes posent le même `translateY(-100%)` et cohabitent sans conflit de spécificité. Le JS **et**
le média CSS gardent tous deux le seuil des `840px`. Miroir sur `<body>` : la classe
**`body.header-hidden`**, dont l'unique consommateur est `services.css` — la barre de pilules
collante y passe à `top: 0` pour suivre le header (le CSS ne peut pas cibler un ancêtre de
`.site-header`). `--sticky-top` n'est volontairement **pas** recalculé selon cet état : la ligne de
lecture du scroll-spy en dérive, et les `scroll-margin-top` doivent rester stables.

**Flèche du hero (et bouton « Découvrir nos services ») vers `#services`, sous 840px** : ce sont des
liens d'ancre ordinaires, donc soumis au `scroll-margin-top: var(--header-height)` global de
`section[id]` (`style.css`) — qui réserve la hauteur du header pour que la cible n'arrive pas
dessous, correct tant qu'il reste visible. Un trajet de cette ampleur (hero → `#services`) franchit
presque toujours le seuil de masquage ci-dessus **avant l'arrivée** : sans traitement particulier, le
header disparaît en route et l'espace qu'on lui avait réservé reste un vide au-dessus de la section
au lieu d'être comblé. Le choix retenu n'est **pas** d'empêcher ce masquage (un header qui
réapparaîtrait pour la traversée puis se recacherait a été essayé et écarté) : ces deux liens sont
interceptés en JS et visent directement le haut **nu** de la section (`getBoundingClientRect()`, sans
le `scroll-margin-top`), en mobile seulement — le desktop garde l'ancre native, déjà correcte puisque
le header n'y disparaît jamais. Le header se cache alors normalement pendant le trajet, comme
n'importe quel autre défilement descendant, et la section arrive à ras de l'écran une fois qu'il est
parti.

## Surface de verre unique (services.html, mobile)

Accostée sous le header, la barre de pilules lui est jointive : deux `backdrop-filter` voisins y
feraient une marche de ton (chacun floute son **propre** arrière-plan en s'écrêtant à ses propres
bords). Le verre est donc porté par **un seul** élément, `.has-pill-nav .site-header::before`, qui
déborde vers le bas ; le header et la barre sont tous deux transparents, et la barre passe
**au-dessus** du header (`z-index: 101`) pour que le flou ne s'applique pas aux pilules. Pendant un
`menu-open`, c'est le voile du menu (102) qui passe devant elle et le header qui monte à 104 — les
deux valeurs vivent dans `style.css`, section « Feuille du menu mobile ».

La jointure est **mesurée** en continu par `syncPillGlass` (`script.js`), jamais déduite d'un seuil :
la barre ne quitte pas le header d'un coup, elle est chassée vers le haut par le bas de sa zone
collante en fin de layout et glisse derrière lui sur ~62px de défilement. Deux variables
complémentaires, dont la somme fait la hauteur de la barre — **`--pill-glass-overhang`** (part
visible *sous* le header, ce dont le verre doit déborder) et **`--pill-bar-clip`** (part passée
*derrière*, que `clip-path` coupe, sans quoi les pilules recouvriraient le logo et le CTA). Toute
bascule binaire à leur place laisse, pendant ce trajet, soit une bande de verre vide sous le header —
très visible sur le footer sombre — soit des pilules qui débordent par-dessus lui.

Le **débordement** se mesure toujours contre le bas du header — le panneau de verre part de sa boîte,
il doit déborder de ce qui l'en sépare — et ce repère suit le header quand il s'escamote, donc sans
rien savoir de `header-hidden`. En revanche **le test « la barre est-elle accostée ? » ne peut pas
s'y fier seul** : sur le papier les deux parcourent les mêmes 80px avec la même durée et la même
courbe, mais sur iPhone c'est faux — le `transform` du header est composité et arrive vite, le `top`
de la barre est animé sur le thread principal, occupé par le défilement. La barre se retrouve 80px
sous un header déjà remonté et se fait déclarer « pas accostée » alors qu'elle l'est ; le verre la
lâchait pendant toute la transition. D'où un **second test, joué seulement si le premier échoue** :
le `top` **calculé** de la barre, seul repère toujours cohérent avec sa position rendue — accostée,
elle est rendue exactement à son offset collant. Toujours **ne pas** déduire ce repère de
`header-hidden` ni du `top` *visé* : une telle valeur bascule à la pose de la classe alors que la
barre met toute la transition à descendre. La distinction est entre la valeur **calculée** (qui suit
la transition image par image, correcte) et la valeur **visée** (qui saute, piège).

**La mesure doit en plus être rejouée à la fin de chaque transition** (deux écouteurs `transitionend`
dans `script.js` : `transform` sur le header, `top` sur la barre) : le défilement piloté par un clic
sur une pilule se termine avant les transitions, la dernière mesure porte donc sur un état de passage
et plus aucun événement ne vient la corriger. On écoute les **deux** boîtes, c'est la dernière
arrivée qui fixe la géométrie. Ne pas se fier à l'inspecteur de bureau pour ce genre de symptôme : il
simule un écran, pas le moteur de rendu ni la lenteur du thread principal d'un téléphone.

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

## Sommaire synchronisé (services.html, desktop)

La sidebar fait ~1700px de liens pour 650-800px de fenêtre visible : elle défile en interne
(`overflow-y: auto`), et `syncSidebarScroll` reporte sur son `scrollTop` la progression de la page.
Le report est fait **section par section**, jamais par une règle de trois sur toute la page :
l'avancement dans la section courante (`q`, entre 0 et 1) est reporté sur le groupe correspondant,
`point = groupe.offsetTop + q × groupe.offsetHeight`, que l'on centre dans la fenêtre. Les hauteurs
des blocs n'ont donc pas besoin d'être proportionnelles à celles des groupes — chaque section pilote
exactement son groupe. À la bascule, `q` retombe de 1 à 0 et le point vaut le bas du groupe sortant,
soit exactement le haut du groupe entrant : **la trajectoire est continue par construction**, ce qui
dispense de tout garde-fou.

**Ne pas remplacer ce report par un mapping proportionnel global** : il faudrait alors borner la
cible pour ramener le groupe actif dans la fenêtre, et cette borne produit des sauts — exiger qu'un
groupe soit *entièrement* visible épingle le sommaire en butée pendant toute une section (le premier
groupe est à l'offset 0, il ne peut être entièrement visible qu'à `scrollTop` 0), puis le relâche
d'un coup à la bascule. Mesuré à ~214px de saut sur une géométrie réaliste.

La fonction **`ligneDeLecture()`** est partagée avec le scroll-spy et ne doit jamais être recopiée en
dur : c'est ce partage qui fait coïncider la bascule du spy avec `q = 1`. Deux valeurs divergentes
rouvriraient un saut à chaque changement de section. Appelé hors du gel `navScrollActive`, comme
`syncPillGlass` et pour la même raison — une position n'est pas une sélection.

## Ligne de lecture (services.html)

`ligneDeLecture` est un repère **perceptuel** qui décide quelle section est active, à distinguer de
`--sticky-top`, qui est **physique** (où une section se pose au clic sur un lien, et la valeur des
`scroll-margin-top`). Elle vaut `--sticky-top + 40 % de la zone sous le header` : une section devient
active quand elle occupe **60 %** de la zone de lecture, pas quand son bord haut effleure le header.
**Ne pas revenir à `--sticky-top` comme seuil du spy** : c'était le cas avant, et une section pouvait
occuper 73 % de l'écran pendant que le sommaire désignait encore la précédente. Les 60 % ne sont pas
une simple majorité : les 10 points au-delà évitent qu'un aller-retour de quelques pixels ne fasse
osciller la sélection, et ils sont calés sur deux cas réels — une section à 53 % ne bascule pas, à
73 % elle a déjà basculé.

**L'asymétrie est le cœur du dispositif : la page pilote le sommaire, jamais l'inverse.** Elle ne
coûte aucun état côté JS, c'est `overscroll-behavior: contain` (services.css) qui la tient, en
empêchant le sommaire de propager son défilement à la page en fin de course. Tant que l'utilisateur
parcourt le sommaire, aucun événement `scroll` de page ne part et rien n'écrase sa position ; la
synchronisation ne reprend la main qu'au prochain défilement de la page. **Ne pas ajouter de timer de
pause après une interaction manuelle** — il ferait décrocher le sommaire de la page sans rien
résoudre. Le calcul est désactivé sous `840px` (la sidebar y est une barre de pilules horizontale) et
compare toujours au `scrollTop` **courant**, jamais à une valeur mémorisée : un cache, ici, laisserait
le sommaire désynchronisé après un défilement manuel.

## Logo adaptatif du header

Sur `index.html`, `services.html` et `apropos.html`, le `.logo` du header porte la classe
**`.logo--adaptive`** et contient **deux** `<img>` : le lockup `logo-noir.svg` (`.logo-icon--full`)
et le monogramme carré `logo-monogramme-noir.svg` (`.logo-icon--mark`). Sous `555px` ils se croisent
en fondu — mais la bascule est pilotée par **`.show-cta`**, pas par la largeur seule : c'est le
bouton « Contactez-nous » qui crée l'encombrement, donc l'état flottant en haut du hero garde
volontairement le lockup complet. **`contact.html` est hors du dispositif** (pas de classe, pas de
second `<img>`) : son `show-cta` en dur ne sert qu'à empêcher le header de se cacher, son CTA étant
neutralisé par `contact.css` — rien n'y encombre la grille. Les `.logo` de pied de page sont hors du
dispositif pour la même raison. La largeur animée de `.logo--adaptive` impose un token en dur,
`--logo-lockup-w` — **à recalculer (hauteur × 3,27) si `--logo-icon-h` change**.

## Zone collante vs `--sticky-top` (services.html)

Deux mesures à ne pas confondre. **`hauteurZoneCollante()`** rend ce qui reste collé en haut : le
header seul en desktop, header **+ barre de pilules** en mobile. **`--sticky-top`** y ajoute un
buffer visuel (32px desktop, 16px mobile). Les liens de **section** visent la zone **nue** — une
section demandée explicitement vient **à ras** du header ; avec `--sticky-top` elle se posait 32px
plus bas, une bande vide entre le header et son filet. Les **fiches**, elles, gardent le buffer via
leur `scroll-margin-top`. Ne pas uniformiser : les deux valeurs répondent à deux besoins opposés.

Le recalage des liens de section se mesure contre `hauteurZoneCollante()`, **pas** contre le
`scroll-margin-top` de la section — celui-ci vaut 80px et ignore la barre de pilules, ce qui poserait
la section derrière elle en mobile.

## Ancres de services (services.html)

Le handler des sous-liens distingue **deux cibles** : `elScroll`, ce vers quoi on défile, et
`targetEl`, ce qui flashe (toujours la fiche cliquée). `elScroll` vaut la **section** quand la fiche
est en **première rangée** de sa grille — on ouvre alors sur l'en-tête, icône et titre du secteur
apparents, la rangée restant à l'écran juste en dessous — et la **fiche** au-delà. Viser la section
pour *toutes* les fiches était le comportement d'origine, et il ne marchait visiblement que pour les
deux premières : la grille ayant deux colonnes, se poser en haut d'un secteur ne montre que l'en-tête
et la première rangée, les autres fiches recevant leur flash hors écran. **Ne pas rebasculer sur une
cible unique**, dans un sens ou dans l'autre.

La rangée est déduite des `offsetTop` et non d'un compte figé à deux : la grille passe à une colonne
sous 840px, et suivrait un passage à trois. Le **recalage doit porter sur `elScroll`**, jamais sur
`targetEl` — mesurer la fiche après avoir défilé vers sa section rouvrirait l'écart permanent décrit
plus bas. Aucun décalage n'est calculé en JS : `scrollIntoView` applique le `scroll-margin-top` de la
cible.

Recalage et flash sont **différés à la fin du défilement** (`apresScroll`), pour deux raisons
mesurées : les images de fiches sont en `loading="lazy"` **sans attributs `width`/`height`**, donc
elles se posent pendant le trajet et déplacent la cible dans le document (−30px constatés) alors que
le navigateur vise la position calculée au clic ; et le trajet dure de 0,5 à 1,7 s selon la distance,
si bien qu'un flash lancé au clic était déjà aux deux tiers éteint à l'arrivée sur une fiche
lointaine. Le minuteur initial d'`apresScroll` est plus long que les suivants **à dessein** : cliquer
une cible déjà en place ne produit aucun événement `scroll`, et sans lui le flash ne partirait jamais.

Le recalage se mesure contre le **`scroll-margin-top` propre à la cible**, pas contre `--sticky-top` :
les deux diffèrent. Une fiche reçoit les 112px de `services.css`, mais une section se voit imposer
les **80px** du `section[id]` de `style.css` — plus spécifique (0,1,1) que `.service-block` (0,1,0),
donc le `scroll-margin-top` de `services.css` sur `.service-block` est **mort**. Comparer à
`--sticky-top` ferait croire à un écart permanent de 32px sur les sections.

## Feuille du menu mobile (≤ 840px)

Le menu burger n'est pas un panneau accroché sous le header : c'est une feuille qui monte du bas de
l'écran, qu'on peut saisir n'importe où et renvoyer d'un lancer. **Sa position, sa visibilité et
l'opacité du voile sont écrites en style inline par `script.js`, image par image** (fonction
`poserFeuille`), jamais par une transition CSS : une transition ignore la vitesse d'entrée, et la
main sent le décrochage à l'instant du relâchement. Le CSS ne pose que l'apparence et l'état de
repos, qui est aussi le repli sans JS. **Ne pas déclarer de `transition` sur `transform`/`visibility`
de `.main-nav` sous 840px** — elle entrerait en concurrence avec le ressort.

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
déportés sur `.site-header::before` — même remède que la barre de pilules ci-dessus. Ne pas reprendre
`backdrop-filter` sur `.site-header` dans ce média.

`menu-open` est portée par le header (élévation) **et** par le body (verrou du défilement), et n'est
retirée qu'une fois la feuille **sortie de l'écran**, pas au clic : sinon le header replonge sous le
voile et la page redevient défilante pendant le vol retour.

**Le verre du header reprend un fond opaque le temps de l'ouverture**
(`.site-header.menu-open:not(.is-floating)::before`) — ce n'est pas cosmétique. Le voile (102)
assombrit la page jusqu'au bas du header, mais le header monte à 104 pour rester net et cliquable, et
son fond est du verre à 72 % : la page qu'il laisse voir au travers passe **derrière** le voile et lui
échappe. Une lisière de contenu en couleur apparaît alors au ras de son bord bas — criante dès qu'une
photo passe derrière — et se lit comme un trait clair au-dessus des pilules, comme si le grisé
s'arrêtait avant le header. Même remède que pour la barre de pilules : une surface privée de son
arrière-plan reprend un fond plein. `:not(.is-floating)` exclut le haut du hero d'`index.html`, où le
header est volontairement transparent avec un logo blanc. Les trois classes du sélecteur sont
nécessaires : il faut (0,3,1) pour l'emporter sur `.has-pill-nav .site-header::before` de
`services.css` (0,2,1), chargé après `style.css`.

**`services.html` fait exception, et l'opacité y passe par la BOÎTE du header, pas par son
`::before`** — parce que ce pseudo-élément y déborde pour peindre la barre de pilules. Un blanc plein
posé dessus claque sur la bande des pilules à l'instant où `menu-open` tombe, puis revient au verre
en 400 ms. `services.css` rend donc au pseudo-élément son `--surface-glass` (0,3,2) et pose le blanc
sur `.site-header` : même rendu — un verre à 72 % sur un blanc plein donne du blanc plein — sans la
secousse. Ne pas remettre l'opacité sur le pseudo-élément de cette page.

À savoir aussi, si un jour un éclair blanc est signalé à l'ouverture : tout ce qui dépend de
`menu-open` bascule **d'un coup** à la pose de la classe, alors que l'opacité du voile, elle, monte
**progressivement** au rythme du ressort (~400 ms). Les deux ne sont pas synchronisés.

## Révélation au scroll

`.animate-on-scroll` reçoit `.visible` via IntersectionObserver.

## Liens non implémentés

`.link-arrow` et `.link-placeholder` interceptent le clic et affichent
`alert("En cours de construction...")`. TODO ouvert : remplacer par une notification non bloquante.

---

## Maintenance de ce fichier

Ce fichier décrit des équilibres mesurés : il ne vaut que s'il reste vrai. Après un changement dans
une des zones ci-dessus, relire la section concernée et se poser **une seule question : est-ce qu'une
phrase est devenue fausse ?**

- **Oui** → mettre à jour la section **dans le même commit** que le code, et la ligne de garde-fou de
  `.claude/CLAUDE.md` si c'est l'interdiction elle-même qui change.
- **Non** (couleur, texte, valeur d'un token, contenu éditorial) → ne rien toucher.

Annoncer la mise à jour à l'utilisateur plutôt que de la faire en silence : c'est lui qui sait si le
changement est définitif ou un essai.
