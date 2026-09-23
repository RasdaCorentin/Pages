# Rapport d'analyse — Note 14/20

Analyse du compte-rendu (`README.md`) au regard du sujet (`page_dev.md`).

## Manques majeurs

- **Partie 8 (Activation des logs pour Gunicorn) absente** : aucune trace de `--access-logfile` / `--error-logfile`, ni de la directive systemd de création du dossier `/var/log/vapormap` (`LogsDirectory=`), ni de validation des logs lors d'accès à l'application.
- **Partie 9 (Point d'accès unique frontend/API) absente** : pas de configuration du `location /api/` en reverse proxy vers Gunicorn, pas de bascule du frontend sur le port 8000, pas de désactivation de l'accès public direct au port 5000, et aucune vérification que les logs NGINX/Gunicorn séparent bien statique et API. Deux parties entières du lab (sur 9) ne sont donc pas traitées — c'est la cause la plus probable de la perte de points.

## Manques ou imprécisions sur les parties traitées

- **Partie 1** : la consigne insiste sur la distinction "point d'attention" vs "solution" (ne pas confondre le besoin et la réponse technique). Le compte-rendu va assez vite à la solution (HTTPS, whitelist, etc.) sans toujours formuler explicitement le risque/besoin sous-jacent pour chaque point.
- **Partie 2** : les **acteurs** (utilisateurs, administrateur système...) ne sont pas clairement identifiés séparément des **composants** — seuls les composants techniques (NGINX, Gunicorn, Flask, MySQL) sont décrits, alors que le sujet demande explicitement les deux catégories et leurs interactions.
- **Partie 5** : les droits du fichier de service sont fixés avec `chmod 755`, sans qu'apparaisse explicitement la vérification "propriétaire = root, lecture/écriture/exécution pour root uniquement, lecture/exécution seule pour les autres" demandée par l'énoncé (le résultat est correct mais la démarche justificative est absente).
- **Partie 6** : la justification demandée ("Justifier le choix de l'adresse et du port utilisés pour joindre l'API") n'est pas développée — le commentaire indique juste que cela dépend du mode bridge/NAT sans conclusion argumentée pour la config retenue.
- **Vérifications systématiques** : la consigne générale demande de vérifier et documenter le résultat de *chaque* action (création utilisateur, génération de fichier, activation d'environnement virtuel...). Certaines étapes (ex. activation du venv, génération de `config.json` pour Nginx) n'ont pas de vérification explicite juste après l'action.

## Points positifs (pour contexte)

- Structure globale conforme aux parties du lab (1 à 7), avec commandes encadrées en blocs de code et sorties réelles.
- Bonnes explications pédagogiques (ligne par ligne) des commandes shell/SQL/systemd.
- Tests de persistance des données et de redémarrage des services bien documentés (Partie 7).
