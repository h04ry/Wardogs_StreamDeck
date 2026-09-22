# Wardogs Artillery Calculator
> **Quick Start Guide • Stream Deck Setup • Fast In-Game Mortar Calculations**  
> Doc ID: `SOP-ARTY-01` | Version: `V1.0` | OS: **Windows 11 / 10**

---

## 🎯 What is this?

Tired of alt-tabbing to a browser map or calculator mid-firefight? 

The **Wardogs Artillery Plugin** (`de.wardogs.artillery.sdPlugin`) does all the ballistic heavy lifting for you right on your Elgato Stream Deck. Simply copy coordinates to your clipboard, tap a key, and get instant bearing and distance on your Stream Deck buttons. Stay in the game, keep eyes on target, and lay down fire without interruption.

### Quick Specs
* **OS:** Windows 11 (fully backwards compatible with Windows 10)
* **Software:** Elgato Stream Deck v6.0 or newer
* **Plugin ID:** `de.wardogs.artillery.sdPlugin`
* **Created by:** h04ry / S4CK

---

## 🚀 1. Setup & Installation (One-Time)

### Choose your download:
* **Option A: `de.wardogs.artillery.streamDeckPlugin` (Recommended)**  
  The easiest way. Just double-click the file, and the Stream Deck app will handle the rest automatically.
* **Option B: `de.wardogs.artillery.sdPlugin.zip` (Manual Install)**  
  If you prefer doing it manually, unpack the zip folder directly into your Stream Deck plugins directory.

---

### Manual Installation Walkthrough
1. **Quit Stream Deck:**  
   Right-click the Stream Deck icon in your Windows system tray (bottom-right taskbar) and choose **Quit**.
2. **Move the folder:**  
   Copy the `de.wardogs.artillery.sdPlugin` folder into your plugin folder:
   ```text
   %appdata%\Elgato\StreamDeck\Plugins\de.wardogs.artillery.sdPlugin
   ```
   *(Full path: `C:\Users\<YourUsername>\AppData\Roaming\Elgato\StreamDeck\Plugins\de.wardogs.artillery.sdPlugin`)*
3. **Restart Stream Deck:**  
   Relaunch the app. You'll see a brand new **WarDogs** category in the action list on the right.
4. **Place your keys:**  
   Drag the three actions side-by-side onto your deck (see layout below).

---

## ⌨️ 2. Recommended Deck Layout

For the smoothest muscle memory during battle, place the three buttons right next to each other:

| Key 1 | Key 2 | Key 3 |
| :---: | :---: | :---: |
| **`[SET POS]`** | **`[SET TARGET]`** | **`[195° / 434 m]`** |
| **YOUR MORTAR** | **TARGET / ENEMY** | **FIRE DATA** |
| Grabs your mortar location straight from clipboard | Grabs target coords straight from clipboard | Shows real-time azimuth (heading) & distance |

### Preview

<p align="center">
  <img src="docs/Demo_StreamDeck.png" alt="Stream Deck Key Layout" width="550">
</p>

---

## 💥 3. In-Game Battle Routine

```text
+-----------------------+     +------------------------+     +------------------------+     +--------------------+
| 01: YOUR POSITION     | --> | 02: TARGET PING        | --> | 03: FIRE SOLUTION      | --> | 04: FIRE AWAY!     |
| Ctrl + C -> [SET POS] |     | Ctrl + C -> [SET TARGET|     | Read Bearing & Range   |     | Aim & send shells! |
+-----------------------+     +------------------------+     +------------------------+     +--------------------+
```

1. **Lock in your mortar location:**  
   Check your mortar position on the map or in chat. Copy the coordinates with <kbd>Ctrl</kbd> + <kbd>C</kbd>, then hit **`[SET POS]`** on your deck. You'll see a green checkmark confirming it's saved.
2. **Tag your target:**  
   When a spotter calls out enemy coordinates or a map ping drops in chat, copy it with <kbd>Ctrl</kbd> + <kbd>C</kbd> and immediately hit **`[SET TARGET]`**.
3. **Read your firing data:**  
   Key 3 instantly updates:
   * **Top line:** Azimuth / Heading in degrees (e.g. `195°`)
   * **Bottom line:** Range in meters (e.g. `434 m`)
4. **Aim & Fire:**  
   Rotate your mortar tube to the compass heading, dial in your elevation for the meter distance, and drop the round!

> 💡 **Pro-Tip for Fast Re-Targeting:**  
> Moving to a new target? You **only need to repeat Step 02**! Your mortar position stays saved until you pack up and move.

---

## 🧠 Smart Coordinate Parsing

You don't need to clean up chat text or worry about strict spacing—the clipboard parser is built to be forgiving. It easily recognizes:

* **Formatted text:** e.g. `X: 84.62 Y: 71.25` or `x84.62 y71.25`
* **Raw number pairs:** e.g. `84.62, 71.25` or `84.62 71.25`
* **Messy chat logs:** Extra spaces, brackets, or surrounding words are ignored automatically.

---

## 📂 Project Structure

```text
de.wardogs.artillery.sdPlugin/
├── bin/
│   ├── calc.js          # Vector math engine (azimuth & distance calculations)
│   ├── clipboard.js     # Clipboard reader & regex coordinate extractor
│   ├── plugin.js        # Stream Deck event loop & lifecycle management
│   └── ws-client.js     # Local WebSocket bridge for Elgato software
├── docs/
│   └── Demo_StreamDeck.png # Visual key layout reference
├── imgs/
│   ├── actions/         # Action icons (SET POS, SET TARGET, Calculation)
│   └── plugin/          # Category banners & Store icons
├── pi/
│   ├── pi.html          # Property Inspector UI (settings pane)
│   └── pi.js            # Property Inspector frontend logic
├── manifest.json        # Stream Deck plugin manifest
└── README.md            # Documentation & setup guide
```

---
*Built with passion by S4CK Software • Artillery Field Manual v1.0*