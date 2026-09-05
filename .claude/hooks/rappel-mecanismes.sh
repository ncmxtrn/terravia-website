#!/bin/bash
# Rappel de maintenance — prévient quand un fichier à mécanismes vient d'être modifié, pour que la
# skill `mecanismes-front` ne se périme pas en silence. Déclenché par le hook PostToolUse déclaré
# dans `.claude/settings.local.json`.
#
# Pourquoi un hook plutôt qu'une consigne : une consigne dans CLAUDE.md ou dans la skill est du
# conseil, elle ne se déclenche que si Claude la lit. Le hook, lui, est exécuté par Claude Code à
# chaque édition, sans dépendre d'un jugement du modèle.
#
# Ne parle qu'une fois par session et par fichier : un rappel répété dix fois dans la même tâche
# n'est plus lu, et c'est le rappel utile qui s'y noie.

entree=$(cat)
chemin=$(printf '%s' "$entree" | jq -r '.tool_input.file_path // empty')
session=$(printf '%s' "$entree" | jq -r '.session_id // "sans-session"')

# Seuls ces quatre fichiers portent les mécanismes documentés. Les autres (apropos.css,
# contact.css, tokens.css…) sortent immédiatement.
#
# On filtre sur le CHEMIN complet et non sur le seul basename : depuis que chaque page
# vit dans son propre dossier et se nomme index.html, un basename() de services/index.html
# vaudrait "index.html" — indiscernable de la page d'accueil à la racine.
case "$chemin" in
  */services/index.html) fichier="services/index.html" ;;
  */services/services.css) fichier="services/services.css" ;;
  *script.js) fichier="script.js" ;;
  *style.css) fichier="style.css" ;;
  *) exit 0 ;;
esac

# "/" remplacé par "-" pour la clé du marqueur : $fichier peut désormais contenir un
# segment de dossier (ex. "services/index.html"), et un "/" y créerait un chemin au
# lieu d'un nom de fichier.
cle="${fichier//\//-}"
marqueur="${TMPDIR:-/tmp}/terravia-rappel-$session-$cle"
[ -e "$marqueur" ] && exit 0
touch "$marqueur"

msg="⚠ $fichier porte des mécanismes documentés. Si ce changement rend fausse une phrase de la skill \`mecanismes-front\` (qui porte le fond du header, comment la jointure du verre est mesurée, quel élément est animé…), mettre à jour .claude/skills/mecanismes-front/SKILL.md dans le même commit, et la ligne de garde-fou de .claude/CLAUDE.md si l'interdiction elle-même change. Une couleur, un texte ou une valeur de token ne le nécessitent pas."

# systemMessage : pour l'afficher à l'utilisateur. additionalContext : pour que Claude en tienne
# compte dans la suite du tour.
jq -n --arg m "$msg" \
  '{systemMessage: $m, hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $m}}'
exit 0
