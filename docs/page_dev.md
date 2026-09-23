# Lab Linux - Application VaporMap en mode production

---

## Objectif

L'objectif est de déployer l'application Vapormap, dans un environnement Linux, en mode "Production".

Le déploiment a été validée dans un environnement Ubuntu 24.04, avec python version 3.12.

> **Note**
> L'objectif n'est pas de développer/modifier l'application, ou de maîtriser les outils utilisés pour son développement.

---

## Restitution attendue

Un compte-rendu au format Markdown, structuré selon les parties de ce lab :

- Les noms et prénoms des membres du binôme en en-tête
- Pour chaque étape : les commandes utilisées et les résultats obtenus, encadrés par des balises markdown "code"
- Les vérifications et les tests réalisés, et leurs résultats
- Les choix de mise en oeuvre, et leur justification

La lisibilité et l'orthographe du document sont évaluées.

> **Note**
> Après chaque action (création d'un utilisateur, génération d'un fichier, activation d'un environnement virtuel, ...), vérifier qu'elle s'est bien déroulée, et faire figurer cette vérification dans le compte-rendu.

---

## Partie 1 : Définition des contraintes du mode "production"

Le déploiement de VaporMap en mode "développement" a été réalisé lors du lab précédent.

Identifier les points d'attention que soulève la mise en production de cette application, et pour chacun, proposer la solution à mettre en oeuvre.

Balayer les aspects fonctionnement et architecture, performance, et sécurité.

Préciser les points qui seront effectivement mis en oeuvre dans ce lab.

> **Note**
> Il ne s'agit pas de produire une liste générique de bonnes pratiques, mais de partir de l'application et de son déploiement en mode "développement".
>
> Le périmètre est celui du déploiement. La compatibilité de l'application avec tel navigateur ou tel système d'exploitation relève du développement.
>
> Ne pas confondre le point d'attention et la solution : "chiffrer les données" est une solution. Le point d'attention correspondant, c'est le besoin auquel elle répond : quelles données protéger, à quel endroit, et contre quel risque.

---

## Partie 2 : définition de l'architecture

Décrire les **acteurs** et les **composants** mis en oeuvre pour le déploiement en mode "production", et leurs **interactions**.

Mettre en évidence ce qui change par rapport à l'architecture du déploiement en mode "développement".

> **Exemple : un distributeur automatique de billets**
>
> - **Acteurs**, extérieurs au système : le porteur de la carte, le technicien qui recharge l'automate.
> - **Composants**, les briques du système : le lecteur de carte, l'écran, le mécanisme de distribution, le serveur de la banque.
> - **Interactions** : le porteur saisit son code, l'automate interroge le serveur de la banque, le serveur répond, l'automate distribue les billets.

---

## Partie 3 : Préparation du système et Installation des dépendances

- Mettre à jour le système
- Installer les utilitaires de base : `curl`, `git`, `vim`, `nano`, `jq`
- Créer un utilisateur `app-vapormap` selon les caractéristiques ci dessous :
  - compte de type `system`
  - description : 'Vapormap App system-user'
  - homedir : /home/app-vapormap
  - shell : /bin/sh
  - création du groupe avec le même nom
- Vérifier la création de l'utilisateur et de son groupe

---

## Partie 4: Déploiement de l'API

### Installation de la base de données

- Installer les packages de MariaDB : `software-properties-common`, `mariadb-server`
- Activer MariaDB au redémarrage du serveur
- Créer une base de données pour l'application, et un utilisateur permettant d'y accéder :
  - base de données : `db_vapormap`
  - utilisateur : `user_vapormap`
  - mot de passe : `vapormap`
- Tester la connexion

Ci-dessous les informations complémentaires pour utiliser MariaDB :

- L'utilisateur `root` peut se connecter à MariaDB sans mot de passe.
- Les commandes à utiliser pour créer la base de données et l'utilisateur sont :

```bash
sudo mysql -e "CREATE DATABASE db_vapormap;"
sudo mysql -e "GRANT ALL PRIVILEGES ON db_vapormap.* TO 'user_vapormap'@'localhost' IDENTIFIED BY 'vapormap';"
sudo mysql -e "GRANT ALL PRIVILEGES ON db_vapormap.* TO 'user_vapormap'@'%'         IDENTIFIED BY 'vapormap';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

- La commande à utiliser pour se connecter à la base de données est `mysql -h localhost -u user_vapormap -pvapormap -D db_vapormap`
- La commande SQL permettant d'afficher les bases de données est `SHOW DATABASES;`

### Installation des pré-requis

- Installer les package de l'environnement Python : `python3`, `python3-pip`, `python3-venv`
- Installer les packages du client MariaDB, sur lequel s'appuie le client python pour MariaDB : `mariadb-client`, `libmariadb-dev` et `pkg-config`.

### Installation de l'application

> **Warning**
> Le changement d'utilisateur doit initialiser l'environnement du nouvel utilisateur, et notamment la variable `$HOME`. Vérifier l'utilisateur courant et son environnement après la connexion.

- Se connecter en tant qu'utilisateur `app-vapormap`.
- Utiliser la commande `git` pour cloner le dépôt de l'API depuis l'adresse : https://gitlab.com/vapormap/vapormap-api.git, dans le dossier `$HOME/vapormap-api-prod`
- Dans le dossier `$HOME/vapormap-api-prod` créé par la commande précédente, créer un environnement virtuel python, et l'activer
- Vérifier que l'environnement virtuel utilisé est bien celui qui vient d'être créé
- Utiliser la commande pip, pour installer le module complémentaire de gestion de package `wheel`, qui permet la distribution de package python pré-compilés (pour le module client python pour MariaDB).
- Installer les dépendances python listées dans le fichier `requirements/production.txt`.

> Les commandes à utiliser pour les opérations en rapport avec Python sont disponibles dans le lab "Déploiement de l'application Vapormap, manuellement, en mode "Développement".

### Initialisation de la base de données

- Si ce n'est pas déjà le cas, se connecter en tant qu'utilisateur `app-vapormap`, et initialiser l'environnement Python.
- Ajouter dans l'environnement les variables d'environnement :
  - Pour l'accès à la base de données à partir des données utilisées pour initialiser la base de données : `VAPOR_DBNAME`, `VAPOR_DBUSER`, `VAPOR_DBPASS` et `VAPOR_DBHOST`,
  - Pour le framework Flask : `FLASK_APP="app"` et `SETTINGS_FILE="production"`
- Se placer dans le dossier de l'API, et initialiser la base de données (migrate), avec la commande Flask `flask db upgrade`

> Vous pouvez vérifier la création des tables, en utilisant la commande SQL `SHOW TABLES;`

### Test du bon fonctionnement de l'API

Tester le fonctionnement de l'API, en lançant manuellement le serveur Gunicorn :

- Si ce n'est pas déjà le cas, se connecter en tant qu'utilisateur `app-vapormap`, et initialiser l'environnement Python.
- Ajouter dans l'environnement les variables d'environnement :
  - Pour l'accès à la base de données à partir des données utilisées pour initialiser la base de données : `VAPOR_DBNAME`, `VAPOR_DBUSER`, `VAPOR_DBPASS` et `VAPOR_DBHOST`
  - pour python : `PYTHONDONTWRITEBYTECODE=1` et `PYTHONUNBUFFERED=1`
  - Pour le framework Flask : `PYTHONPATH=$HOME/vapormap-api-prod`, `FLASK_APP="app"` et `SETTINGS_FILE="production"`
- Lancer le serveur Gunicorn.
  - Le module WSGI d'application à lancer est app (voir fichier `wsgi.py`)
  - Le port sur lequel l'API est accessible est le port `5000`
  - La commande a utiliser est donc :

```bash
cd $HOME/vapormap-api-prod
gunicorn --bind 0.0.0.0:5000 wsgi:app
```

- Utiliser la commande curl pour tester l'API. Le résultat à obtenir est disponible dans le document "Mode opératoire pour une installation en mode développement" dans le dépôt.
- Tester l'accès à l'API en se connectant avec un navigateur : se connecter en http, sur le port 5000, et tester l'uri `/api/points/`.
- Arrêter le serveur Gunicorn
- Sortir de l'environnement virtuel python, et de la session utilisateur `app-vapormap`.

---

## Partie 5: Lancement de l'API en tant que service

Le dépôt de l'API contient un fichier de template de fichier de service, à mettre en place pour lancer l'API en tant que service : `api-systemd.conf.template`. Ce fichier doit être modifié, et placé dans le dossier `/etc/systemd/system/`.

> **Warning**
> L'accès aux fichiers est restreint : le fichier de template n'est accessible qu'à l'utilisateur `app-vapormap`, et le fichier de configuration ne peut être créé que par `root`. Aucun des deux utilisateurs ne peut donc réaliser l'opération seul.
>
> L'utilisateur `app-vapormap` ne doit pas disposer des droits `sudo`.
>
> Attention également à la portée de la commande `sudo` dans une commande comportant une redirection.
>
> Enfin, toutes les variables présentes dans un fichier de template ne sont pas nécessairement des variables à substituer. Contrôler systématiquement le fichier obtenu.

- Décrire le contenu de ce fichier de template
- Puis utiliser la commande `envsubst` pour générer le fichier de configuration `/etc/systemd/system/vapormap-api.service` à partir de ce template, après avoir préalable renseigné les variables d'environnement nécessaires.
- Vérifier le contenu du fichier généré
- Ajuster les droits du fichier de configuration :
- Le propriétaire doit être l'utilisateur `root`, et il doit pouvoir lire, modifier et exécuter le fichier
- Tous les autres utilisateurs doivent pouvoir lire et exécuter le fichier, mais pas le modifier.
- Enfin démarrer le service, et tester son status
- Tester l'accès à l'API avec la commande `curl`
- Une fois le bon fonctionnement validé, activer le service au redémarrage du serveur

---

## Partie 6: Déploiement du frontend

### Installer le serveur WEB Nginx

- Installer les packages de Nginx : `nginx-light`
- Activer Nginx au redémarrage du serveur

### Récupération de l'application

- Se connecter en tant qu'utilisateur `app-vapormap`.
- Utiliser la commande `git` pour cloner le dépôt du frontend depuis l'adresse : https://gitlab.com/vapormap/vapormap-front.git, dans le dossier `$HOME/vapormap-front-prod`

### Configurer l'accès à l'API

Le dépôt contient un fichier de template du fichier de configuration de l'application : `config.json.template`. Ce fichier doit être modifié, pour générer le fichier `html/config.json` utilisé par le frontend.

- Utiliser la commande `envsubst` pour générer le fichier de configuration `html/config.json` à partir de ce template, après avoir préalable renseigné les variables d'environnement nécessaires.
- Vérifier le fichier généré.
- Justifier le choix de l'adresse et du port utilisés pour joindre l'API.
- Sortir de la session utilisateur `app-vapormap`.

### Générer le fichier de configuration du serveur Nginx

Le dépôt contient un fichier de template de fichier de configuration pour Nginx, à ajouter à la configuration par défaut du serveur Nginx : `nginx.conf.template`. Ce fichier doit être modifié, et placé dans le dossier `/etc/nginx/sites-available`, et avoir pour nom `vapormap`.

> **Warning**
> Comme pour le fichier de service, l'accès aux fichiers est restreint : le fichier de template n'est accessible qu'à l'utilisateur `app-vapormap`, et le fichier de configuration ne peut être créé que par `root`.

- Utiliser la commande `envsubst` pour générer le fichier de configuration `/etc/nginx/sites-available/vapormap` à partir du fichier `nginx.conf.template`, après avoir préalable renseigné les variables d'environnement nécessaires : `VAPORMAP_URL_SERVERNAME=0.0.0.0`, `VAPORMAP_URL_PORT=8000` et `VAPORMAP_FRONTEND_ROOT=/home/app-vapormap/vapormap-front-prod/html`.
- Vérifier le contenu du fichier

### Activer la configuration

- Activer la configuration générée dans la configuration de Nginx, en créant un lien symbolique dans le dossier `/etc/nginx/sites-enabled`, vers le fichier généré `/etc/nginx/sites-available/vapormap`
- Vérifier la configuration de Nginx, en lançant la commande `nginx -t`, qui permet de valider la configuration
- Relancer le service Nginx
- Autoriser l'accès de Nginx aux fichiers du frontend :
  - Déterminer sous quels utilisateur/groupe s'execute le processus Nginx
  - Autoriser l'accès en lecture au dossier `/home/app-vapormap/vapormap-front-prod`, au groupe exécutant le processus Nginx.

> **Warning**
> Nginx doit pouvoir traverser l'ensemble de l'arborescence menant aux fichiers du frontend, et pas uniquement accéder au dossier qui les contient.
>
> Les droits accordés doivent rester limités au strict nécessaire.

---

## Partie 7 : Validation du bon fonctionnement de l'application

### Validation de l'accès à l'application

- Se connecter à l'application en utilisant un navigateur : se connecter en http, sur le port 8000, et créer des points de relevé.

### Validation du fonctionnement du service

- Tester le redémarrage du serveur

### Validation de la persistance des données

- Valider la persistance des points de relevés dans la table `point` de la base de données `db_vapormap`.
- La commande SQL `SHOW TABLES;` permet de lister les tables.
- La commande SQL `SELECT * FROM point;` permet de lister le contenu de la table `point`.

---

## Partie 8 : Activation des logs pour Gunicorn

Le fichier de service systemd pour l'API ne prévoit pas la gestion des logs de Gunicorn.

Pour gérer les logs, Gunicorn propose 2 options permettant de gérer les logs :

- Pour les logs d'accès : `--access-logfile`
- Pour les logs d'erreur : `--error-logfile`

Le dossier `/var/log/vapormap` doit exister, et le processus qui exécute Gunicorn, lancé avec l'utilisateur `app-vapormap`, doit pouvoir y écrire.

SystemD dispose d'une directive permettant de prendre en charge la création et les droits du dossier de logs d'un service. La mettre en oeuvre, plutôt que de créer le dossier manuellement.

Modifier le fichier de gestion de service SystemD pour ajouter ces options, et rediriger les logs respectivement dans les fichiers `/var/log/vapormap/gunicorn-access.log` et `/var/log/vapormap/gunicorn-error.log`.

Faire prendre en compte la modification du fichier de configuration du service, et le relancer.

Valider le fonctionnement, en observant les logs lors d'accès à l'application.

---

## Partie 9 : Mise en place d'un point d'accès unique pour le frontend et l'API

Le serveur WEB NGINX est utilisé pour le frontend, mais il peut également être configuré pour gérer l'accès à l'API, et permettre un point d'accès unique à l'application.

Pour identifier ces uri d'accès à l'API, créer des points sur l'interface de l'application, et observer les logs correspondants. L'ensemble de l'API est exposé sous un préfixe unique `/api/` :

- `/api/points/` : gestion des points
- `/api/tracks/` : accès à la liste des points à afficher au format geojson

Pour mettre en place un point d'accès unique à l'application, il suffit donc de configurer au niveau de Nginx une seule redirection vers Gunicorn, pour le préfixe `/api/`.

Ce qui correspond à la configuration :

```nginx
# Backend API
location /api/ {
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Scheme $scheme;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://127.0.0.1:5000/api/;
    proxy_redirect off;
}
```

Pour mettre en place cette configuration :

- Modifier le fichier de configuration de Nginx de Vapormap.
- Tester la nouvelle configuration, avec la commande `nginx -t`
- Puis relancer le serveur Nginx

Il est également nécessaire de modifier le fichier de configuration du frontend, pour utiliser le port 8000, et non plus le port 5000, pour communiquer avec l'API.

Par sécurité, désactiver l'accès direct à l'API, en désactivant l'accès public direct via le port 5000, en modifiant la configuration de systemD.

Créer des points sur l'interface de l'application, et valider que :

- Toutes les requêtes apparaissent dans les logs de NGINX : les fichiers statiques du frontend comme les appels à l'API,
- Seules les requêtes vers l'API (`/api/`) apparaissent dans les logs de Gunicorn. Les fichiers statiques du frontend sont servis directement par NGINX, et n'y figurent donc pas.

> Un rechargement forcé des pages au niveau du navigateur est souvent nécessaire.
