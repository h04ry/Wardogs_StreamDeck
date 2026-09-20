// Minimaler WebSocket-Client für die Verbindung zum lokalen Stream-Deck-Server.
// Nur Node-Bordmittel (net + crypto) – kein npm install nötig. Getestet gegen
// einen eigenen RFC6455-Testserver (Handshake + maskierte/unmaskierte Frames).
const net = require('net');
const crypto = require('crypto');

function connect(url) {
    const m = /^ws:\/\/([^:/]+):(\d+)/.exec(url);
    const host = m[1];
    const port = parseInt(m[2], 10);
    const key = crypto.randomBytes(16).toString('base64');

    const emitter = {
        _onOpen: null, _onMessage: null, _onClose: null,
        onopen(fn) { this._onOpen = fn; },
        onmessage(fn) { this._onMessage = fn; },
        onclose(fn) { this._onClose = fn; },
    };

    const socket = net.createConnection({ host, port }, () => {
        const req =
            `GET / HTTP/1.1\r\n` +
            `Host: ${host}:${port}\r\n` +
            `Upgrade: websocket\r\n` +
            `Connection: Upgrade\r\n` +
            `Sec-WebSocket-Key: ${key}\r\n` +
            `Sec-WebSocket-Version: 13\r\n\r\n`;
        socket.write(req);
    });

    let handshakeDone = false;
    let buffer = Buffer.alloc(0);

    function parseFrame(buf) {
        if (buf.length < 2) return null;
        const byte0 = buf[0];
        const byte1 = buf[1];
        const opcode = byte0 & 0x0f;
        const masked = !!(byte1 & 0x80);
        let len = byte1 & 0x7f;
        let offset = 2;
        if (len === 126) {
            if (buf.length < 4) return null;
            len = buf.readUInt16BE(2);
            offset = 4;
        } else if (len === 127) {
            if (buf.length < 10) return null;
            len = Number(buf.readBigUInt64BE(2));
            offset = 10;
        }
        let maskKey;
        if (masked) {
            if (buf.length < offset + 4) return null;
            maskKey = buf.slice(offset, offset + 4);
            offset += 4;
        }
        if (buf.length < offset + len) return null;
        let payload = buf.slice(offset, offset + len);
        if (masked) {
            const unmasked = Buffer.alloc(len);
            for (let i = 0; i < len; i++) unmasked[i] = payload[i] ^ maskKey[i % 4];
            payload = unmasked;
        }
        return { opcode, payload, total: offset + len };
    }

    function sendFrame(payload, opcode) {
        const len = payload.length;
        let header;
        if (len < 126) {
            header = Buffer.alloc(2);
            header[0] = 0x80 | opcode;
            header[1] = 0x80 | len;
        } else if (len < 65536) {
            header = Buffer.alloc(4);
            header[0] = 0x80 | opcode;
            header[1] = 0x80 | 126;
            header.writeUInt16BE(len, 2);
        } else {
            header = Buffer.alloc(10);
            header[0] = 0x80 | opcode;
            header[1] = 0x80 | 127;
            header.writeUInt32BE(0, 2);
            header.writeUInt32BE(len, 6);
        }
        const mask = crypto.randomBytes(4);
        const masked = Buffer.alloc(len);
        for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i % 4];
        socket.write(Buffer.concat([header, mask, masked]));
    }

    socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        if (!handshakeDone) {
            const idx = buffer.indexOf('\r\n\r\n');
            if (idx === -1) return;
            handshakeDone = true;
            buffer = buffer.slice(idx + 4);
            if (emitter._onOpen) emitter._onOpen();
        }
        while (true) {
            const frame = parseFrame(buffer);
            if (!frame) break;
            buffer = buffer.slice(frame.total);
            if (frame.opcode === 0x1) {
                if (emitter._onMessage) emitter._onMessage(frame.payload.toString('utf8'));
            } else if (frame.opcode === 0x9) {
                sendFrame(frame.payload, 0xA);
            } else if (frame.opcode === 0x8) {
                socket.end();
            }
        }
    });

    socket.on('close', () => { if (emitter._onClose) emitter._onClose(); });

    emitter.send = (str) => sendFrame(Buffer.from(str, 'utf8'), 0x1);
    emitter.close = () => socket.end();

    return emitter;
}

module.exports = { connect };
