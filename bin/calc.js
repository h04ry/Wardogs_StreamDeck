// Extrahiert X/Y-Koordinaten aus einem beliebigen Zwischenablage-Text
// und berechnet Azimut (Grad + Mil) sowie Reichweite nach der
// Pythagoras-Methode (Distanz = √(ΔX² + ΔY²) × 100).

function toNumber(str) {
    return parseFloat(String(str).replace(",", "."));
}

function parseCoordinates(text) {
    if (!text) return null;

    // 1. Versuch: explizit beschriftete Werte, z. B. "X: 84.62" / "Y: 71.25"
    //    (Reihenfolge im Text egal, Groß-/Kleinschreibung egal)
    const xMatch = text.match(/\bX\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)/i);
    const yMatch = text.match(/\bY\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)/i);
    if (xMatch && yMatch) {
        return { x: toNumber(xMatch[1]), y: toNumber(yMatch[1]) };
    }

    // 2. Fallback: die ersten beiden Zahlen im Text, in der gefundenen
    //    Reihenfolge (deckt Formate wie "84.62, 71.25" oder "84.62;71.25" ab)
    const nums = text.match(/-?\d+(?:[.,]\d+)?/g);
    if (nums && nums.length >= 2) {
        return { x: toNumber(nums[0]), y: toNumber(nums[1]) };
    }

    return null;
}

function calcAzimuthRange(current, target) {
    const dx = target.x - current.x;
    const dy = target.y - current.y;

    const rangeM = Math.sqrt(dx * dx + dy * dy) * 100;

    // Azimut im Uhrzeigersinn ab Norden (0°). Annahme: Y wächst nach Norden.
    // Falls die Karte umgekehrt orientiert ist, einfach current/target tauschen
    // oder in calc.js das Vorzeichen von dy anpassen.
    let azimuthDeg = Math.atan2(dx, dy) * (180 / Math.PI);
    if (azimuthDeg < 0) azimuthDeg += 360;

    const azimuthMil = azimuthDeg * (6400 / 360);

    return { azimuthDeg, azimuthMil, rangeM };
}

module.exports = { parseCoordinates, calcAzimuthRange, toNumber };
