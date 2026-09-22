// WarDogs Artillery Calculator – Property Inspector Logik

let websocket = null;
let uuid = null;
let actionUUID = null;

function resetKeyForAction() {
    if (actionUUID && actionUUID.endsWith("setposition")) return "current";
    if (actionUUID && actionUUID.endsWith("settarget")) return "target";
    return "all";
}

function render(status) {
    const currentEl = document.getElementById("current");
    const targetEl = document.getElementById("target");
    currentEl.textContent = status.current ? `X ${status.current.x}  Y ${status.current.y}` : "– nicht gesetzt –";
    targetEl.textContent = status.target ? `X ${status.target.x}  Y ${status.target.y}` : "– nicht gesetzt –";

    if (actionUUID && actionUUID.endsWith("azimuthrange")) {
        document.getElementById("azimuthSection").style.display = "block";
        const azEl = document.getElementById("azimuthValue");
        if (status.azimuthDeg !== undefined) {
            azEl.textContent = `${status.azimuthDeg}°  /  ${status.azimuthMil} mil  /  ${status.rangeM} m`;
        } else {
            azEl.textContent = "Warte auf Position & Ziel…";
        }
    }
}

function requestStatus() {
    websocket.send(
        JSON.stringify({
            event: "sendToPlugin",
            context: uuid,
            payload: { cmd: "status" },
        })
    );
}

function connectElgatoStreamDeckSocket(inPort, inPropertyInspectorUUID, inRegisterEvent, inInfo, inActionInfo) {
    uuid = inPropertyInspectorUUID;
    const actionInfo = JSON.parse(inActionInfo);
    actionUUID = actionInfo.action;

    websocket = new WebSocket("ws://127.0.0.1:" + inPort);

    websocket.onopen = function () {
        websocket.send(
            JSON.stringify({
                event: inRegisterEvent,
                uuid: inPropertyInspectorUUID,
            })
        );
        requestStatus();
    };

    websocket.onmessage = function (evt) {
        const msg = JSON.parse(evt.data);
        if (msg.event === "sendToPropertyInspector") {
            render(msg.payload);
        }
    };

    document.getElementById("reset").addEventListener("click", function () {
        websocket.send(
            JSON.stringify({
                event: "sendToPlugin",
                context: uuid,
                payload: { cmd: "reset", key: resetKeyForAction() },
            })
        );
    });
}
