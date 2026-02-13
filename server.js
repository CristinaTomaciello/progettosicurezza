const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const USERS_FILE = path.join(__dirname, 'users.json');        // DB Server (Pubbliche)
const WALLETS_FILE = path.join(__dirname, 'wallets.json');    // SIMULAZIONE Client Secure Enclave (Private)

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Funzioni lettura/scrittura file
function readJsonFile(filename) {
    try {
        if (fs.existsSync(filename)) {
            const data = fs.readFileSync(filename, 'utf8');
            return JSON.parse(data || '{}');
        }
    } catch (err) { console.error(`Errore lettura ${filename}:`, err); }
    return {};
}

function writeJsonFile(filename, data) {
    try { fs.writeFileSync(filename, JSON.stringify(data, null, 2)); }
    catch (err) { console.error(`Errore scrittura ${filename}:`, err); }
}

// 1. GESTIONE WALLET LOCALE (Simulazione Secure Enclave) ---
// Queste rotte vengono chiamate SOLO se il Touch ID ha dato esito positivo lato client

app.post('/client-sim/save-wallet', (req, res) => {
    const { username, keys } = req.body;
    let wallets = readJsonFile(WALLETS_FILE);
    
    // Salviamo le chiavi "blindate" dall'autenticazione biometrica
    wallets[username] = keys; 
    
    writeJsonFile(WALLETS_FILE, wallets);
    console.log(`[SECURE ENCLAVE] Chiavi salvate per: ${username}`);
    res.json({ message: "Wallet salvato" });
});

app.post('/client-sim/load-wallet', (req, res) => {
    const { username } = req.body;
    let wallets = readJsonFile(WALLETS_FILE);
    
    // Se siamo qui, assumiamo che il client abbia superato il check biometrico
    if(wallets[username]) {
        res.json({ keys: wallets[username] });
    } else {
        res.status(404).json({ message: "Nessun wallet trovato per questo utente." });
    }
});

// 2. LOGICA SERVER DI AUTENTICAZIONE (Backend Reale) ---

app.post('/register', (req, res) => {
    const { username, publicKey } = req.body;
    
    if (!username || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
        return res.status(400).json({ message: "Username non valido" });
    }

    let users = readJsonFile(USERS_FILE);
    // Salviamo solo la chiave pubblica
    users[username] = { publicKey: publicKey, currentChallenge: null };
    
    writeJsonFile(USERS_FILE, users);
    console.log(`[SERVER] Utente registrato: ${username}`);
    res.json({ message: "OK" });
});

app.post('/login-challenge', (req, res) => {
    const { username } = req.body;
    let users = readJsonFile(USERS_FILE);

    if (!users[username]) return res.status(404).json({ message: "Utente non trovato nel server" });

    // Genera Nonce casuale
    const challenge = crypto.randomBytes(32).toString('hex');
    users[username].currentChallenge = challenge;
    
    writeJsonFile(USERS_FILE, users);
    res.json({ challenge });
});

app.post('/login-verify', (req, res) => {
    const { username, signature } = req.body;
    let users = readJsonFile(USERS_FILE);
    const user = users[username];

    if (!user || !user.currentChallenge) return res.status(400).json({ message: "Sessione scaduta o invalida" });

    try {
        const pemKey = `-----BEGIN PUBLIC KEY-----\n${user.publicKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
        
        const isValid = crypto.verify(
            "sha256",
            Buffer.from(user.currentChallenge),
            pemKey,
            Buffer.from(signature, 'base64')
        );

        // Brucia la sfida (Replay Attack Protection)
        user.currentChallenge = null;
        writeJsonFile(USERS_FILE, users);

        if (isValid) {
            console.log(`[SERVER] Login SUCCESSO per ${username}`);
            res.json({ message: "Autenticazione riuscita!" });
        } else {
            console.log(`[SERVER] Login FALLITO per ${username}`);
            res.status(401).json({ message: "Firma digitale non valida!" });
        }
    } catch (err) { res.status(500).json({ message: "Errore verifica server" }); }
});

// Reset Totale per pulizia
app.post('/reset-all', (req, res) => {
    writeJsonFile(USERS_FILE, {});
    writeJsonFile(WALLETS_FILE, {});
    res.json({ message: "Reset completato" });
});

app.listen(3000, () => console.log("Server biometrico attivo su http://localhost:3000"));