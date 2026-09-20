// Liest den Inhalt der System-Zwischenablage aus, ohne externe npm-Pakete.
// Windows: PowerShell Get-Clipboard | macOS: pbpaste | Linux: xclip/xsel (best effort)

const { exec } = require("child_process");

function readClipboard() {
    return new Promise((resolve, reject) => {
        let cmd;
        if (process.platform === "win32") {
            cmd = 'powershell -NoProfile -NonInteractive -Command "Get-Clipboard -Raw"';
        } else if (process.platform === "darwin") {
            cmd = "pbpaste";
        } else {
            cmd = "xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output 2>/dev/null";
        }

        exec(cmd, { timeout: 4000, windowsHide: true }, (err, stdout) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(stdout == null ? "" : String(stdout));
        });
    });
}

module.exports = { readClipboard };
