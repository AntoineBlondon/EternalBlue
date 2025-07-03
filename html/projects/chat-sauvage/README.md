# Le Chat Sauvage

**A web app for sharing real-time locations in private rooms.**

> Pour la version française, voir [ici](./README_fr.md)

---

## How does it work?

### 1. Join or create a room

* Enter a **username**.
* Click **Create Room** to generate a room with a unique code.
* Or enter an existing code and click **Join Room**.

> Tip: Rooms work a bit like on *makeitmeme*, using simple shareable codes.

---

### 2. Roles and permissions

* The **person who creates the room** becomes the `host`.
* The `host` can:

  * Change the settings (location update interval, make the room public or not).
  * Create a **polygon** visible to all users on the map (the button only appears for the host).

---

### 3. Location sharing

* By default, **no one sees anyone**.

* Each user can choose **whether or not to send their location**.

  * Click **Start Sending Location** to begin (updates every 30 seconds).
  * Click **Refresh Locations** to manually fetch the latest positions.

* You can **choose who to see**:

  * Click on a user's name to make them visible.
  * Click again to hide them.

> It may take a second or two to update — please don't spam the buttons ^^

---

### 4. Interactive map

* An **online map (Leaflet + OpenStreetMap)** displays:

  * The visible users.
  * The **latest polygon created by the host**, if any.

---

### 5. Chat

* Use the chat field at the bottom of the page to talk in real time with others in the room.

---

### 6. Leaving a room

* Click **Leave Room** to exit properly.
* If no users remain, the room is automatically deleted on the server.

---

## Notes

* The interface is simple and may contain a few bugs.
* The app works fine with a small group, but hasn't been tested with more than 10 users at once.

---

## Tech stack

* **Frontend**: HTML, JavaScript (vanilla), Leaflet.js
* **Backend**: Flask (Python), CORS, REST API
* **Hosting**: PythonAnywhere (for the backend)
