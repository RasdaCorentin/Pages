# TP - Application Vapormap en production

#### NOM, Prénom : GUILLIER Yaële, RASDA Corentin

---

## Partie 1 : Définition des contraintes du mode "production" 

Quand on passe du mode développeur au mode production, il faut prendre en compte différents paramètres essentiels :

### 🔄 Fonctionnement  
- **En mode développement**  
  - L’application tourne en local dans une VM linux on y accéde par une requête http depuis notre machine.  
  - Les requêtes sont directement envoyé à Flask par le front avec l'IP et le port en clair.
  - Le serveur subis des arrêts et relance fréquentes.

- **En mode production**  
  - L’application doit fonctionner 24/7 avec plusieurs utilisateurs simultanés.  
  - Les services doivent être monitorés pour garantir stabilité, disponibilité et performance.  
  - L'application résiste aux pannes.

➡️ *Nous devons donc assurer un fonctionnement fiable, tolérant aux pannes et prêt à monter en charge.*  

---

### ⚡ Performance  
- **En mode développement** : un seul utilisateur (car on est en local), exécution rapide et peu de ressources nécessaires.  
- **En mode production** : de nombreux utilisateurs sollicitent fortement l’API.  

➡️ *Nous devons donc optimiser les requêtes et récupérer des métriques de performance via les logs et les métriques.*  

---

### 🔐 Sécurité  
- **En mode développement** : sécurité minimale, car l’application n’est pas exposée à Internet.  
- **En mode production** : l’application est en ligne et vulnérable aux attaques.  

➡️ *Nous devons donc :*  
- Chiffrer les échanges avec un accès HTTPS.  
- Restreindre les accès utilisateurs aux autres accés du serveur.  
- Appliquer le principe whitelist (si c'est pas OUI c'est NON) pour les services et la base de données.  

---

### 🏗️ Architecture  
- **En mode développement** :  
  - Flask avec serveur intégré.  
  - Base SQLite locale.  

- **En mode production** :  
  - NGINX permet de serveur web et reverse proxy.  
  - Gunicorn exécute l’application Flask avec plusieurs workers (processus). 
  - Flask permet la gestions des différents environnement.
  - MySQL/MariaDB sont des base de données robuste et qui passent à l'échelle.  
  - systemD permet l'orchestration et la supervision des services. 
  

➡️ *Nous devons donc coordonner ces services pour garantir la cohérence et la fiabilité de l’application.* 

---

## Partie 2 : Définition de l'architecture 

### Les composants :  

- **🌐 Serveur Web (NGINX)**  
  Il reçoit les requêtes des utilisateurs tout en jouant le rôle de reverse proxy 
  vers Gunicorn ainsi il agit comme une barrière de sécurité. Il assure également la gestion 
  des connexions des utilisateurs via HTTPS.

- **🖥️ Gunicorn (serveur WSGI)**  
  Il permet de faire l’interface entre Flask et NGINX et lance plusieurs workers pour gérer les requêtes simultanés.  

- **🐍 Application Flask**  
  Il permet la redirection et le déploiement des applications dans différents environnements. 

- **🗄️ Base de données MySQL/MariaDB**  
  Elles permettent de stocké et géré les données.  
---

### Schéma simplifié de l’architecture  

```plaintext
[ Utilisateurs 🌍 ]
        |
      HTTPS
        |
     [ NGINX 🔐 ]
        |
   Reverse Proxy
        |
   [ Gunicorn ⚙️ ]
        |
   [ Flask 🐍 ]
        |
   [ MySQL 🗄️ ]
```

## Partie 3 : Préparation du système et Installation des dépendances 

### Choix du serveur  
J’ai choisi de partir sur un serveur minimal Debian avec un accès root et un utilisateur sudoers.  
J’ai également créé un nouvel utilisateur pour ma collègue, qui sera lui aussi sudoers, afin que nous puissions travailler ensemble sur le serveur.  

  Problème : je souhaite ouvrir uniquement une IP et un port pour permettre à ma collègue d’accéder à ma VM en toute sécurité.  
  Solution : modifier le fichier /etc/ssh_config.

Ensuite, nous allons créer un utilisateur commun qui aura accès au serveur préalablement préparé.  

---

#### Étape 1 : Création de la VM Debian 5 🖧  
Création et configuration d’une VM Debian minimaliste pour héberger l’application.  

#### Étape 2 : Ajout de ma collègue 👩‍💻  
Ajout d’un utilisateur supplémentaire (sudoers) pour permettre un travail collaboratif sur le serveur.  

#### Étape 3 : Mise à jour et installation des dépendances 📦  

1. Mettre à jour le système :  
   ```bash
   sudo apt update && sudo apt upgrade
   ```
**Explication:**
  - sudo : permet d'avoir les droits de root
  - apt update : permet de faire la mise a jour des liste
  - && : permet d'exécute les deux commandes a la suite si celle de gauche a reussir
  - apt upgrade : permet de faire la mise a jour des paquets

2. Installer les utilitaires de base :
   ```bash
   sudo apt install curl git vim jq
   ```
**Explication:**
  - sudo : permet d'avoir les droits de root
  - apt install : permet d'installer un paquet 
  - curl : est le paquet qu'on vas installer (permet de transférer des paquets)
  - git: est un deuxième paquet qu'on installe (permet de se lier a git) 
  - vim : est un troisième paquet qu'on installe (permet d'étider des fichiers dans le terminal)
  - jq : est le dernier paquet qu'on installe (permet manipuler et formater du JSON)

3. Installer les dépendances nécessaires au projet (packages récupérés depuis [lab Vapormap](https://vapormap.gitlab.io/lab-prod-linux/lab/)) :

   ```bash
   sudo apt install curl git jq python3 python3-pip python3-venv software-properties-common mariadb-server mariadb-client libmariadb-dev pkg-config
   ```
**Explication:**
  - sudo : permet d'avoir les droits de root
  - apt install : permet d'installer des paquets (ici tout ce qui suit) 
  - curl : permet de transférer des paquets
  - git: permet de se lier a git
  - vim : permet d'étider des fichiers dans le terminal
  - jq : permet manipuler et formater du JSON
  - python3 python3-pip python3-venv : permet d'avoir python ainsi que les modules pip (pour fiare des installations) et venv (crée un environnement)
  - software-properties-common : permet de gérer facilement les dépôts logiciels (ajouter/supprimer des repositories et gérer les clés d’authentification).
  - mariadb-server : installe le serveur de base de données MariaDB
  - mariadb-client : installe l’outil client en ligne de commande pour se connecter à un serveur MariaDB/MySQL et exécuter des requêtes
  - libmariadb-dev : fournit les fichiers nécessaires pour développer et compiler des programmes qui interagissent avec MariaDB/MySQL (headers, librairies)
  - pkg-config : utilitaire qui aide à compiler du code en trouvant automatiquement les chemins et options des bibliothèques installées

#### Étape 4 : Création de l’utilisateur `app-vapormap` 👤

Caractéristiques de l’utilisateur :

* Compte de type system
* Description : `"Vapormap App system-user"`
* Homedir : `/home/app-vapormap`
* Shell : `/bin/sh`
* Création du groupe avec le même nom

Commande :
```bash
sudo useradd -rm -b /home -s /bin/sh -c "Vapormap App system-user" -U -p PASS app-vapormap
```
**Explication:**
  - sudo : exécute la commande avec les droits administrateur
  - useradd : crée un nouvel utilisateur
  - -r : crée un compte système (non destiné à une connexion interactive)
  - -m : crée automatiquement le répertoire personnel de l’utilisateur
  - -b /home : définit le répertoire de base où sera créé le home
  - -s /bin/sh : définit le shell de connexion par défaut
  - -c "..." : ajoute un commentaire (souvent une description du compte)
  - -U : crée en même temps un groupe portant le même nom que l’utilisateur
  - -p PASS : définit le mot de passe chiffré de l’utilisateur
  - app-vapormap : nom de l’utilisateur à créer

#### Étape 5 : Sécurisation du mot de passe 🔒

```bash
root@debian5:~# passwd app-vapormap 
New password: 
Retype new password: 
passwd: password updated successfully
root@debian5:~# exit
```
**Explication:**
  - passwd : permet de configurer un mot de passe a notre utilisateur (app-vapormap)

 Le compte `app-vapormap` est maintenant prêt à être utilisé en production.

Et que app-vapormap ne dispose pas des droits super utilisateurs:

```bash 
app-vapormap@debian5:~/vapormap-prod/frontend$ sudo ls
[sudo] password for app-vapormap: 
app-vapormap is not in the sudoers file.
```

## Partie 4 : Déploiement de l'API
#### Création de la base de donnée et de l'utilisateur

On execute les commandes suivante pour pouvoir paramètrés notre base de donée:
```bash
sudo mysql -e "CREATE DATABASE db_vapormap;"
sudo mysql -e "GRANT ALL PRIVILEGES ON db_vapormap.* TO 'user_vapormap'@'localhost' IDENTIFIED BY 'vapormap';"
sudo mysql -e "GRANT ALL PRIVILEGES ON db_vapormap.* TO 'user_vapormap'@'%'         IDENTIFIED BY 'vapormap';"
sudo mysql -e "FLUSH PRIVILEGES;"
```
**Explication:**
  - sudo : exécute la commande avec les droits administrateur
  - mysql : est un symlink vers la ligne de commande MariaDB et permet d'intéragir avec la base de donnée
  - e : permet d'executer les commandes
  - "CREATE DATABASE db_vapormap;" : commande SQL qui permet de crée la base de donnée avec le nom db_vapormap
  - "GRANT ALL PRIVILEGES ON db_vapormap.* TO 'user_vapormap'@'localhost' IDENTIFIED BY 'vapormap';" : 
     permet d'ajouter tous les droits de la base de donnée a l'utilisateur user_vapormap connecter en local avec le mots de passe vapormap
  - "GRANT ALL PRIVILEGES ON db_vapormap.* TO 'user_vapormap'@'%'         IDENTIFIED BY 'vapormap';" : 
     permet la même chose que la commande d'avant juste cette fois ci on peut se connecter depuis n'importe quel machine
  - FLUSH PRIVILEGES;" : permet d'envoyer les commandes présédente dans la config

On vérifie que tout a bien été créé avec la commande suivante :
```bash
mysql -h localhost -u user_vapormap -pvapormap -D db_vapormap
```
**Explication:**
  - mysql : est un symlink vers la ligne de commande MariaDB et permet d'intéragir avec la base de donnée
  - h : permet de donné le nom de l'host ici "localhost"
  - u : permet de donné le nom de l'utilisateur
  - p : permet de mettre le mot de passe mais il ne faut pas avoir d'espace entre l'option et le mot de passe d'où pvapormap
  - D : permet de mettre le nom de la base de donné


On arrivera sur l'interface de MariaDB qui nous indique tout est bien lancé :
```bash
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 34
Server version: 10.11.13-MariaDB-0ubuntu0.24.04.1 Ubuntu 24.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [db_vapormap]>
```

  La commande suivante permet d'ouvrir la database:
  ```bash
  MariaDB [db_vapormap]> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| db_vapormap        |
| information_schema |
+--------------------+
2 rows in set (0,003 sec)
  ```

#### Installation de l'application
Pour réaliser l'installation nous devons nous connecter a notre utilisateur:
```bash
 yaele@ubuntu:~$ su app-vapormap
 Password:
 $ bash
 app-vapormap@ubuntu:~$
  ```
**Explication:**
  - su : permet de changer d'utilisateur
  - bash : pour avoir une interface bash

Pour la suite, nous avons eu un probléme dans les droits utilisateurs et avons du attribuer des droits a notre utilisateur:
```bash
sudo chown app-vapormap:app-vapormap /home/app-vapormap
sudo chmod 700 /home/app-vapormap/
```
**Explication:**
  - chown : change le propriétaire
  - app-vapormap:app-vapormap : nom d'utilisateur, nom de groupe 
  - chmod : change les droits d'accés
  - 700 : applique les droits read-write-execute au propriétaire et rien aux autres

Après avoir régler ce problème, nous avons puis poursuivre en cloner le git dans le dossier vapormap-prod :
```bash
 pwd
 /home/app-vapormap
 mkdir vapormap-prod 
 cd vapormap-prod/
 git clone https://gitlab.com/vapormap/vapormap-src.git
  ```
**Explication:**
  - pwd: permet de voir dans quel répertoir on est
  - mkdir: permet de créer un dossier
  - cd : permet de se diriger dans les divers répertoires
  - git clone : permet de cloner un git dans le dossier où on est

On crée un environnement virtuel sur python pour éviter d'affecter le python de la VM :
```bash
 python3 -m venv env
 source env/bin/activate
  ```
**Explication:**
  - python3 : permet de lancé python3
  - m : permet d'appelé un module
  - venv : le module appelé par l'option m qui permet de créer des environnement virtuel (ici du nom de env)
  - source : permet d'executé un script (ici activate)

On installe le module complémentaire de gestion de package wheel :
```bash
pip install wheel
```
**Explication**
  - pip install : permet d'installer une librairie

On continue en installant les dépendances python:
```bash
pip install -r requirements/production.txt
```
**Explication**
  - pip install : permet d'installer une librairie
  - r : dis a python de prendre les dépendances dans le fichier

#### Initialisation de la base de données

En restant connecter sur notre utilisateur app-vapormap on vas ajouter dans l'environnement python que l'on viens de créer des variables d'environnement:
```bash
export VAPOR_DBNAME=db_vapormap
export VAPOR_DBUSER=user_vapormap
export VAPOR_DBPASS=vapormap
export VAPOR_DBHOST=localhost
export FLASK_APP="app"
```
**Explication**
 - export : permet de définir ou modifier une variable d'environnement depuis le terminal
 - Les arguments qui suivent la commande export crée différentes variables pour le nom de la base de donné, de l'utilisateur, le mot de passe et le nom de l'host
 - FLASK_APP="app" : est une variable qui permet a flask de trouver ou est le fichier app

Par la suite, on vas mettre a jour la base de donné avec les migrations de flask avec la commande :
```bash
flask db upgrade
```
**Explication**
 - db : sous-commande ajoutée par Flask-Migrate (extension de flask qui permet de gérer les évolutions de la base de données)

 On vérifie la création des tables avec MariaDB et la commande SHOW TABLES:
 ```bash
 mysql -h localhost -u user_vapormap -pvapormap -D db_vapormap
 Reading table information for completion of table and column names
 You can turn off this feature to get a quicker startup with -A

 Welcome to the MariaDB monitor.  Commands end with ; or \g.
 Your MariaDB connection id is 32
 Server version: 10.11.13-MariaDB-0ubuntu0.24.04.1 Ubuntu 24.04

 Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

 Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

 MariaDB [db_vapormap]> SHOW TABLES;
 +-----------------------+
 | Tables_in_db_vapormap |
 +-----------------------+
 | alembic_version       |
 | point                 |
 +-----------------------+
 2 rows in set (0,003 sec)
 ```

#### Test du bon fonctionnement de l'API

#### Etape 1 : Ajouter des variables d'environnement
On reste dans la séssion de notre utilisateur app-vapormap et dans l'nevironnement python. On vas ensuite ajouter les variables d'environnement:
```bash
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1
export PYTHONPATH=$HOME/vapormap-prod/api
export SETTINGS_FILE="production"
```
**Explication**
- PYTHONDONTWRITEBYTECODE=1 : empêche Python de créer des fichiers compilés
- PYTHONUNBUFFERED=1 : désactive le buffering de la sortie standard
- PYTHONPATH=$HOME/vapormap-prod/api : ajoute le dossier ~/vapormap-prod/api au chemin de recherche des modules Python 
- SETTINGS_FILE="production" : est une variable qui indique à flask quel module ou fichier utiliser pour lancer l’application

#### Etape 2 : Lancer le serveur Gunicorn

```bash
(vapormap-prod) app-vapormap@debian5:/home/app-vapormap/vapormap-prod/api/app# gunicorn --bind 0.0.0.0:5000 wsgi:app
```
**Explication :**
- gunicorn : lance le serveur WSGI (Gunicorn) qui permet de faire tourner l’application Flask en production.
- --bind 0.0.0.0:5000 : indique que Gunicorn doit écouter sur **toutes les interfaces réseau** (`0.0.0.0`) et sur le **port 5000**.
- wsgi:app : précise à Gunicorn le point d’entrée de l’application Flask.
  - wsgi = nom du fichier Python wsgi.py (sans l’extension).
  - app = nom de l’objet Flask défini dans ce fichier.

#### Etape 3 : Tester l'accés à l'API

```bash
[koda@Arcko3 ~]$ curl http://localhost:5000/api/points/
```
**Explication :**
  - curl : outil en ligne de commande pour effectuer des requêtes HTTP
  - http://localhost:5000/api/points/ : URL de l’API
  - localhost = machine locale (127.0.0.1)
  - 5000 = port où tourne Gunicorn/Flask
  - /api/points/ = route définie dans l’application Flask qui retourne des données

Cette commande envoie une requête GET à l’API et récupère les données sous forme JSON.

##### Résultat attendu

```json
[]
```
S'il n'y pas d'erreur ces crochets indiquent qu'il n'y a pas de données dans la TABLE points de la DB.

## Partie 5 : Lancement de l'API en tant que service

Nous commencons en ouvrant le fichier api-systemd.conf.template:
```bash
[Unit]
Description=Gunicorn for VaporMap
After=network.target

[Service]
User=${VAPORMAP_USER}
Group=${VAPORMAP_GROUP}
WorkingDirectory=${VAPORMAP_DIR}
Environment="PATH=${VAPORMAP_PATH}"
Environment="PYTHONPATH=${VAPORMAP_PATH}"
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=PYTHONUNBUFFERED=1
Environment=SETTINGS_FILE="production"
Environment=VAPOR_DBUSER=${VAPOR_DBUSER}
Environment=VAPOR_DBPASS=${VAPOR_DBPASS}
Environment=VAPOR_DBHOST=${VAPOR_DBHOST}
Environment=VAPOR_DBNAME=${VAPOR_DBNAME}
ExecStart=${VAPORMAP_PATH}/gunicorn wsgi:app --bind 0.0.0.0:${VAPORMAP_API_PORT}

[Install]
WantedBy=multi-user.target
```
**Explication**
- Description=Gunicorn for VaporMap : donne un nom au service
- After=network.target : permet de dire au service de démarrer après que le réseau soit disponible
- ```User=${VAPORMAP_USER} et Group=${VAPORMAP_GROUP}``` : permet de donné le nom de l'utilisateur et le groupe sous lequel le service s’exécute
- ```WorkingDirectory=${VAPORMAP_DIR} ```: est le répertoire où se trouve le code de l'application
- ```Environment="PATH=${VAPORMAP_PATH}" ```: permet de pointer vers l'environnement virtuel Python
- Les variables suivantes sont celle définit plus tôt :
  - ```Environment="PYTHONPATH=${VAPORMAP_PATH}"```
  - ```Environment=PYTHONDONTWRITEBYTECODE=1 ```
  - ```Environment=PYTHONUNBUFFERED=1```
  - ```Environment=SETTINGS_FILE="production"```
  - ```Environment=VAPOR_DBUSER=${VAPOR_DBUSER}```
  - ```Environment=VAPOR_DBPASS=${VAPOR_DBPASS}```
  - ```Environment=VAPOR_DBHOST=${VAPOR_DBHOST}```
  - ```Environment=VAPOR_DBNAME=${VAPOR_DBNAME}```
- ```ExecStart=${VAPORMAP_PATH}/gunicorn wsgi:app --bind 0.0.0.0:${VAPORMAP_API_PORT}``` : commande qui lance Gunicorn pour exécuter l’application wsgi:app
- WantedBy=multi-user.target : permet de dire au service de démarrer automatiquement au démarrage du système

On fait des exports pour préparer la commande envsubst :
```bash
export VAPORMAP_USER=app-vapormap
export VAPORMAP_GROUP=app-vapormap
export VAPORMAP_DIR=/home/app-vapormap/vapormap-prod/api
export VAPORMAP_PATH=/home/app-vapormap/vapormap-prod/venv/bin
export VAPORMAP_API_PORT=5000
export VAPOR_DBUSER=user_vapormap
export VAPOR_DBPASS=vapormap
export VAPOR_DBHOST=localhost
export VAPOR_DBNAME=db_vapormap
```
Par la suite on lance la commande envsubst :
```bash
envsubst < api-systemd.conf.template > api-systemd.conf.service
```
**Explication**
- envsubst : remplace dans un fichier toutes les variables d’environnement

###### Retour de commande :

Avant envsubst :

```bash
[Unit]
Description=Gunicorn for VaporMap
After=network.target

[Service]
User=${USER}
Group=${USER}
WorkingDirectory=${HOME}/vapormap-prod
Environment=PATH="${VAPORMAP_PATH}"
Environment=PYTHONPATH="${VAPORMAP_PATH}"
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=PYTHONUNBUFFERED=1
Environment=SETTINGS_FILE="production"
Environment=VAPOR_DBUSER=${VAPOR_DBUSER}
Environment=VAPOR_DBPASS=${VAPOR_DBPASS}
Environment=VAPOR_DBHOST=${VAPOR_DBHOST}
Environment=VAPOR_DBNAME=${VAPOR_DBNAME}
ExecStart=${PYTHON_PATH}/gunicorn wsgi:app --bind 0.0.0.0:${VAPORMAP_API_PORT}

[Install]
WantedBy=multi-user.target
```

Après :

```bash
[Unit]
Description=Gunicorn for VaporMap
After=network.target

[Service]
User=app-vapormap
Group=app-vapormap
WorkingDirectory=/home/app-vapormap/vapormap-prod/api
Environment="PATH=/home/app-vapormap/vapormap-prod/venv/bin"
Environment="PYTHONPATH=/home/app-vapormap/vapormap-prod/"
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=PYTHONUNBUFFERED=1
Environment=SETTINGS_FILE="production"
Environment=VAPOR_DBUSER=user_vapormap
Environment=VAPOR_DBPASS=vapormap
Environment=VAPOR_DBHOST=localhost
Environment=VAPOR_DBNAME=db_vapormap
ExecStart=/home/app-vapormap/vapormap-prod/venv/bin/gunicorn wsgi:app --bind 0.0.0.0:5000

[Install]
WantedBy=multi-user.target
```

On applique les droits utilisateurs sur ` /etc/systemd/system/vapormap-api.service ` :

```bash
sudo chmod 755 /etc/systemd/system/vapormap-api.service
-rwxr-xr-x  1 root root  755 Oct  1 03:16 vapormap-api.service
```

Ensuite on démarre le service :

```bash
  sudo systemctl start vapormap-api.service
```
**Explication**
- systemctl : permet de controler les services de systemD
- start : lance le serveur du nom vapormap-api.service

On vérifie que tous c'est bien lancer avec :

```bash
 sudo systemctl status vapormap-api.service
 ```
 **Explication**
- status : permet de voir l'état du serveur

###### Retour de commande :

```bash
app-vapormap@debian5:~$ systemctl status vapormap-api.service 
● vapormap-api.service - Gunicorn for VaporMap
     Loaded: loaded (/etc/systemd/system/vapormap-api.service; enabled; preset: enabled)
     Active: active (running) since Sat 2025-10-04 16:00:56 CDT; 7min ago
 Invocation: d900a7739cfa4afa88980a51e630eaa7
   Main PID: 669 (gunicorn)
      Tasks: 2 (limit: 2303)
     Memory: 87.9M (peak: 89.9M)
        CPU: 545ms
     CGroup: /system.slice/vapormap-api.service
             ├─669 /home/app-vapormap/vapormap-prod/venv/bin/python3 /home/app-vapormap/vapormap-prod/venv/bin/gunicorn wsgi:app --bind 0.0.0.0:5000
             └─747 /home/app-vapormap/vapormap-prod/venv/bin/python3 /home/app-vapormap/vapormap-prod/venv/bin/gunicorn wsgi:app --bind 0.0.0.0:5000
```

S'il y a un problème active ne s'affichera pas comme active et il faudra retourner à la partie 4 pour débug.
La commande de journalisation de systemctl permet d'en apprendre d'avantage sur les bugs 
Nécéssite des droits super-utilisateurs que app-vapormap ne posséde pas : 
```bash 
sudo journalctl -u vapormap-api.service -f
```
**Explications** 

- journalctl : 
  - -u :
  - -f : affiche les logs en continue

Pour terminer on l'active au démarrage du serveur :

```bash
    systemctl enable vapormap-api.service
```
## Partie 6 : Déploiement du frontend

Au cas où ce n'est pas déjà fait on installe :

```bash
    sudo apt install nginx-light
```

**Explications**

  nginx-light : serveur http léger, light car moins de configurations et donc moins de surface d'attaque donc plus sécurisé


#### Etape 1 : Configurer l'accès à l'API
 
On a un template de fichier de configuration pour l'accès à l'API (maintenue par vapormap-api.service) : 

frontend/config.json.template : 

```bash 
{ "apiUrl": "http://${VAPORMAP_BACKEND_HOST}:${VAPORMAP_BACKEND_PORT}" }
```
On prépare les exports:

**Explications** 

```bash
export VAPORMAP_BACKEND_HOST = localhost # Cela va dépendre si la VM est en bridge ou NAT
export VAPORMAP_BACKEND_PORT = 5000
```

On crée notre fichier config.json :

```bash
envsubst < config.json.template > html/config.json
```

###### Retour de commande 

```bash
app-vapormap@debian5:~/vapormap-prod/frontend$ cat html/config.json 
{ "apiUrl": "http://localhost:5000" }
```

#### Etape 2 : Générer le fichier de configuration du serveur Nginx

On a un template de fichier de configuration pour le serveur Nginx : 

frontend/nginx.conf.template :

```bash
# VaporMap server configuration

server {
        listen ${VAPORMAP_URL_PORT};
        server_name  ${VAPORMAP_URL_SERVERNAME};

        root ${VAPORMAP_FRONTEND_ROOT};

        index index.html index.htm;

        location = /favicon.ico { access_log off; log_not_found off; }

        location / {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                try_files $uri $uri/ =404;
        }
      }
```
On prépare les exports:

**Explications** 

```bash
export VAPORMAP_URL_PORT = 8000
export VAPORMAP_URL_SERVERNAME = 0.0.0.0
export VAPORMAP_FRONTEND_ROOT = /home/app-vapormap/vapormap-prod/frontend/html
```

On crée notre fichier config.json :

```bash
envsubst < nginx.conf.template > /etc/nginx/sites-available/vapormap 
```

###### Retour de commande 


```bash
cat /etc/nginx/sites-available/vapormap 

# VaporMap server configuration

server {
        listen 8000;
        server_name 0.0.0.0;

        root /home/app-vapormap/vapormap-prod/frontend/html;

        index index.html index.htm;

        location = /favicon.ico { access_log off; log_not_found off; }

        location / {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                try_files $uri $uri/ =404;
        }
     }
```

#### Etape 3 : Activer la configuration 

Créer un lien symbolique : 

```bash
ln -s /etc/nginx/sites-available/vapormap /etc/nginx/sites-enabled/
```

**Explication**

  - ln
    - -s : Crée un lien symbolique (différent de hardlink)

On vérifie les droits : 

```bash 
-root@debian5:~# rw-r--r--  1 root root 1545 Aug 29 09:10 nginx.conf

root@debian5:~# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

On relance le service 

```bash
sudo systemctl restart nginx
```
Attention a bien donner les droit en execution aux autres jusqu'au dossier html pour que le serveur puisse fournir les fichiers qui composent la page HTML

## Partie 7 : Validation du bon fonctionnement de l'application

#### Etape 1 : Validation de l'accès à l'application

```bash
[koda@Arcko3 ~] $ curl -v http://localhost:8000/
* Host localhost:8000 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:8000...
* connect to ::1 port 8000 from ::1 port 59814 failed: Connexion refusée
*   Trying 127.0.0.1:8000...
* Established connection to localhost (127.0.0.1 port 8000) from 127.0.0.1 port 34024 
* using HTTP/1.x
> GET / HTTP/1.1
> Host: localhost:8000
> User-Agent: curl/8.16.0
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Server: nginx
< Date: Sun, 05 Oct 2025 17:22:34 GMT
< Content-Type: text/html
< Content-Length: 4794
< Last-Modified: Mon, 29 Sep 2025 14:32:16 GMT
< Connection: keep-alive
< ETag: "68da9870-12ba"
< Accept-Ranges: bytes
```

Ici  le curl -v permet d'obtenir le détail de la réponse côté serveur (donc ma VM) depuis ma machine.

HTTP/1.1 200OK signifie que la configuration de nginx a bien fonctionné.

Ensuite le : Content-type: text/html

Nous confirme la récéption d'un objet HTML.

#### Etape 2 : Validation du fonctionnement du service

Grace aux deux systemctl enable : 

```bash
systemctl enable vapormap-api.service
systemctl enable nginx
``` 

On s'assure leur lancement à chaque démarrage.

#### Etape 3 : Validation de la persistance des données

Après avoir créer deux point et redémarrer le serveur.


On vérifie leur persistance dans la base de donnée. 
```bash
app-vapormap@debian5:~$ mysql -h localhost -u user_vapormap -pvapormap -D db_vapormap
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 33
Server version: 11.8.3-MariaDB-0+deb13u1 from Debian -- Please help get to 10k stars at https://github.com/MariaDB/Server

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [db_vapormap]> SHOW TABLES;
+-----------------------+
| Tables_in_db_vapormap |
+-----------------------+
| alembic_version       |
| point                 |
+-----------------------+
2 rows in set (0.001 sec)

MariaDB [db_vapormap]> SELECT * FROM api_point;
ERROR 1146 (42S02): Table 'db_vapormap.api_point' doesn't exist
MariaDB [db_vapormap]> SELECT * FROM point;
+----------+--------------+-----------+----------+---------+---------------------+
| point_id | element_name | longitude | latitude | comment | date                |
+----------+--------------+-----------+----------+---------+---------------------+
|        1 | PAF          |  -78.5742 | -2.54799 | NULL    | 2025-10-10 00:00:00 |
|        2 | PAF          |   13.7988 |  20.4682 | NULL    | 2025-10-10 00:00:00 |
+----------+--------------+-----------+----------+---------+---------------------+
2 rows in set (0.001 sec)
```
Le serveur est prêt à servir en production, merci à M.Braux pour ces enseignements en Administration Systéme on se reverra l'année prochaine.
