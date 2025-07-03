# Le Chat Sauvage

**Une webapp pour partager sa position en temps réel dans des salons privés.**

---

## Comment ça marche ?

### 1. Rejoindre ou créer une room

* Entrez un **nom d’utilisateur**.
* Cliquez sur **Create Room** pour générer une room avec un code unique.
* Ou entrez un code existant et cliquez sur **Join Room**.

> Astuce : Les rooms fonctionnent un peu comme dans *makeitmeme*, avec un simple système de code.

---

### 2. Rôles et permissions

* Le **créateur de la room** devient automatiquement l'`host`.
* L'`host` peut :

  * Modifier les paramètres (temps entre les envois de localisation, rendre la room publique ou non).
  * Créer un **polygone** visible par tous sur la carte (le bouton n'apparaît que pour l'host).

---

### 3. Partage de position

* Personne ne voit personne au départ.

* Chaque utilisateur peut choisir **s’il veut envoyer sa position**.

  * Cliquez sur **Start Sending Location** pour commencer (actualisé toutes les 30 sec).
  * Cliquez sur **Refresh Locations** pour forcer une mise à jour manuelle.

* Vous pouvez **choisir qui voir** :

  * Cliquez sur le nom d’un utilisateur pour le rendre visible.
  * Cliquez à nouveau pour le cacher.

> ça peut prendre une ou deux secondes à s'actualiser, ne martelez pas les boutons svp ^^

---

### 4. Carte interactive

* Une **carte en ligne (Leaflet + OpenStreetMap)** affiche :

  * Les utilisateurs visibles.
  * Le **dernier polygone créé par l'host** (s'il y en a un).

---

### 5. Chat

* Utilisez le champ en bas de page pour discuter en temps réel avec les autres personnes dans la room.

---

### 6. Quitter la room

* Cliquez sur **Leave Room** pour quitter proprement.
* Si plus personne n’est dans la room, elle est automatiquement supprimée côté serveur.

---

## Remarques

* L’interface est simple et peut comporter quelques bugs.
* L'application fonctionne normalement avec quelques personnes, mais n’a pas encore été testée avec plus de 10 utilisateurs simultanés.

---

## Tech stack

* **Frontend** : HTML, JavaScript (vanilla), Leaflet.js
* **Backend** : Flask (Python), CORS, REST API
* **Hébergement** : PythonAnywhere (pour le backend)


