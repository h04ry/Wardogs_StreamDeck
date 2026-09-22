// WarDogs Artillery Calculator – Plugin-Backend (Node.js)
//
// 3 Aktionen:
//  - de.wardogs.artillery.setposition   -> liest Zwischenablage, speichert "current"
//  - de.wardogs.artillery.settarget     -> liest Zwischenablage, speichert "target"
//  - de.wardogs.artillery.azimuthrange  -> zeigt Azimut (Grad + Mil) und Reichweite

const { connect } = require("./ws-client");
const { readClipboard } = require("./clipboard");
const { parseCoordinates, calcAzimuthRange } = require("./calc");

const ACTION_SET_POS = "de.wardogs.artillery.setposition";
const ACTION_SET_TARGET = "de.wardogs.artillery.settarget";
const ACTION_AZIMUTH = "de.wardogs.artillery.azimuthrange";

// -- Kommandozeilen-Parameter von Stream Deck einlesen --------------------
const args = process.argv.slice(2);
function getArg(name) {
    const idx = args.indexOf("-" + name);
    return idx !== -1 ? args[idx + 1] : null;
}
const port = getArg("port");
const pluginUUID = getArg("pluginUUID");
const registerEvent = getArg("registerEvent");

// -- Zustand ---------------------------------------------------------------
let globalSettings = {}; // { current: {x,y}, target: {x,y} }
const posContexts = new Set();
const targetContexts = new Set();
const azimuthContexts = new Set();

// -- Verbindung --------------------------------------------------------------
const ws = connect("ws://127.0.0.1:" + port);

function send(obj) {
    ws.send(JSON.stringify(obj));
}

function logToSD(message) {
    send({ event: "logMessage", payload: { message: String(message) } });
}

function setTitle(context, title) {
    send({ event: "setTitle", context, payload: { title, target: 0 } });
}

function showOk(context) {
    send({ event: "showOk", context });
}

function showAlert(context) {
    send({ event: "showAlert", context });
}

function persistGlobalSettings() {
    send({ event: "setGlobalSettings", context: pluginUUID, payload: globalSettings });
}

function formatCoordTitle(prefix, coords) {
    if (!coords) return prefix;
    return `X ${coords.x}\nY ${coords.y}`;
}

function formatAzimuthTitle() {
    const { current, target } = globalSettings;
    if (!current || !target) return "Warte auf\nPosition...";
    const { azimuthDeg, rangeM } = calcAzimuthRange(current, target);
    // Azimut bekommt eine eigene, große Zeile (bei 3-stelligen Gradwerten
    // wie 195° kann die führende Ziffer sonst auf der kleinen Taste
    // abgeschnitten wirken und z.B. als "95°" gelesen werden). Mil steht
    // weiterhin unverkürzt im Property Inspector.
    return `${Math.round(azimuthDeg)}°\n${Math.round(rangeM)} m`;
}

function refreshAllButtons() {
    posContexts.forEach((ctx) => setTitle(ctx, formatCoordTitle("Set\nPosition", globalSettings.current)));
    targetContexts.forEach((ctx) => setTitle(ctx, formatCoordTitle("Set\nTarget", globalSettings.target)));
    azimuthContexts.forEach((ctx) => setTitle(ctx, formatAzimuthTitle()));
}

function buildStatusPayload() {
    const { current, target } = globalSettings;
    const payload = { current: current || null, target: target || null };
    if (current && target) {
        const { azimuthDeg, azimuthMil, rangeM } = calcAzimuthRange(current, target);
        payload.azimuthDeg = Math.round(azimuthDeg);
        payload.azimuthMil = Math.round(azimuthMil);
        payload.rangeM = Math.round(rangeM);
    }
    return payload;
}

async function handlePositionCapture(context, key) {
    try {
        const text = await readClipboard();
        const coords = parseCoordinates(text);
        if (!coords) {
            showAlert(context);
            logToSD("WarDogs Artillery: Keine Koordinaten in der Zwischenablage gefunden: " + JSON.stringify(text));
            return;
        }
        globalSettings[key] = coords;
        persistGlobalSettings();
        showOk(context);
        refreshAllButtons();
    } catch (err) {
        showAlert(context);
        logToSD("WarDogs Artillery: Fehler beim Lesen der Zwischenablage: " + (err && err.message));
    }
}

ws.onopen(() => {
    send({ event: registerEvent, uuid: pluginUUID });
    send({ event: "getGlobalSettings", context: pluginUUID });
});

ws.onmessage((data) => {
    let msg;
    try {
        msg = JSON.parse(data);
    } catch (e) {
        return;
    }
    const { event, action, context, payload } = msg;

    switch (event) {
        case "didReceiveGlobalSettings": {
            globalSettings = (payload && payload.settings) || {};
            refreshAllButtons();
            break;
        }

        case "willAppear": {
            if (action === ACTION_SET_POS) {
                posContexts.add(context);
                setTitle(context, formatCoordTitle("Set\nPosition", globalSettings.current));
            } else if (action === ACTION_SET_TARGET) {
                targetContexts.add(context);
                setTitle(context, formatCoordTitle("Set\nTarget", globalSettings.target));
            } else if (action === ACTION_AZIMUTH) {
                azimuthContexts.add(context);
                setTitle(context, formatAzimuthTitle());
            }
            break;
        }

        case "willDisappear": {
            posContexts.delete(context);
            targetContexts.delete(context);
            azimuthContexts.delete(context);
            break;
        }

        case "keyDown": {
            if (action === ACTION_SET_POS) {
                handlePositionCapture(context, "current");
            } else if (action === ACTION_SET_TARGET) {
                handlePositionCapture(context, "target");
            } else if (action === ACTION_AZIMUTH) {
                // Manuelles Neu-Berechnen/Aktualisieren per Tastendruck
                setTitle(context, formatAzimuthTitle());
            }
            break;
        }

        case "sendToPlugin": {
            const cmd = payload && payload.cmd;
            if (cmd === "status") {
                send({ event: "sendToPropertyInspector", context, payload: buildStatusPayload() });
            } else if (cmd === "reset") {
                const key = payload.key;
                if (key === "all") {
                    globalSettings = {};
                } else {
                    delete globalSettings[key];
                }
                persistGlobalSettings();
                refreshAllButtons();
                send({ event: "sendToPropertyInspector", context, payload: buildStatusPayload() });
            }
            break;
        }
    }
});
