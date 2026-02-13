const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const USERS_FILE = path.join(__dirname, 'users.json');        // DB Server (Solo Pubbliche)
const WALLETS_FILE = path.join(__dirname, 'wallets.json');    // SIMULAZIONE Client (Private)

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Funzione generica per leggere JSON
function readJsonFile(filename) {
    try {
        if (fs.existsSync(filename)) {
            const data = fs.readFileSync(filename, 'utf8');
            return JSON.parse(data || '{}');
        }
    } catch (err) { console.error(`Errore lettura ${filename}:`, err); }
    return {};
}

// Funzione generica per scrivere JSON
function writeJsonFile(filename, data) {
    try { fs.writeFileSync(filename, JSON.stringify(data, null, 2)); }
    catch (err) { console.error(`Errore scrittura ${filename}:`, err); }
}

// --- 1. ROTTE LATO SERVER (Il vero Backend) ---

// Registrazione (Salva solo Chiave Pubblica)
app.post('/register', (req, res) => {
    const { username, publicKey } = req.body;
    
    // Validazione
    if (!username || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
        return res.status(400).json({ message: "Username non valido" });
    }

    let users = readJsonFile(USERS_FILE);
    users[username] = { publicKey: publicKey, currentChallenge: null };
    
    writeJsonFile(USERS_FILE, users);
    console.log(`[SERVER] Utente registrato nel DB: ${username}`);
    res.json({ message: "OK" });
});

// Login Fase 1: Challenge
app.post('/login-challenge', (req, res) => {
    const { username } = req.body;
    let users = readJsonFile(USERS_FILE);

    if (!users[username]) return res.status(404).json({ message: "Utente non trovato nel Server" });

    const challenge = crypto.randomBytes(32).toString('hex');
    users[username].currentChallenge = challenge;
    
    writeJsonFile(USERS_FILE, users);
    res.json({ challenge });
});

// Login Fase 2: Verifica
app.post('/login-verify', (req, res) => {
    const { username, signature } = req.body;
    let users = readJsonFile(USERS_FILE);
    const user = users[username];

    if (!user || !user.currentChallenge) return res.status(400).json({ message: "Sessione invalida" });

    try {
        const pemKey = `-----BEGIN PUBLIC KEY-----\n${user.publicKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
        const isValid = crypto.verify("sha256", Buffer.from(user.currentChallenge), pemKey, Buffer.from(signature, 'base64'));

        // Brucia la sfida
        user.currentChallenge = null;
        writeJsonFile(USERS_FILE, users);

        if (isValid) {
            console.log(`[SERVER] Login SUCCESSO: ${username}`);
            res.json({ message: "Autenticazione riuscita!" });
        } else {
            console.log(`[SERVER] Login FALLITO: ${username}`);
            res.status(401).json({ message: "Firma non valida!" });
        }
    } catch (err) { res.status(500).json({ message: "Errore verifica" }); }
});

// --- 2. ROTTE SIMULAZIONE CLIENT (Il finto Hard Disk dell'utente) ---

// Salva le chiavi nel "Portafoglio" simulato
app.post('/client-sim/save-wallet', (req, res) => {
    const { username, keys } = req.body; // keys contiene sia privata che pubblica (JWK)
    let wallets = readJsonFile(WALLETS_FILE);
    wallets[username] = keys;
    writeJsonFile(WALLETS_FILE, wallets);
    console.log(`[CLIENT-SIM] Chiavi salvate nel wallet sicuro di: ${username}`);
    res.json({ message: "Wallet aggiornato" });
});

// Leggi le chiavi dal "Portafoglio" simulato
app.post('/client-sim/load-wallet', (req, res) => {
    const { username } = req.body;
    let wallets = readJsonFile(WALLETS_FILE);
    if(wallets[username]) {
        res.json({ keys: wallets[username] });
    } else {
        res.status(404).json({ message: "Nessuna chiave trovata nel wallet locale" });
    }
});

// --- 3. ROTTA RESET TOTALE (Risolve i problemi di sincronizzazione) ---
app.post('/reset-all', (req, res) => {
    writeJsonFile(USERS_FILE, {});
    writeJsonFile(WALLETS_FILE, {});
    console.log("--- SISTEMA RESETTATO (DB e Wallets puliti) ---");
    res.json({ message: "Sistema resettato con successo!" });
});

app.listen(3000, () => console.log("Server avviato su http://localhost:3000"));