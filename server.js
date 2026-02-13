const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Funzione per leggere gli utenti dal file senza perderli
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data || '{}'); 
        }
    } catch (err) {
        console.error("Errore lettura file:", err);
    }
    return {};
}

// 1. Registrazione (con aggiunta al file esistente)
app.post('/register', (req, res) => {
    const { username, publicKey } = req.body;
    if (!username || !publicKey) return res.status(400).json({ message: "Dati mancanti" });

    // Carichiamo gli utenti attuali dal file
    let currentUsers = loadUsers();
    
    // Aggiungiamo il nuovo utente (o aggiorniamo se esiste già)
    currentUsers[username] = { publicKey: publicKey, currentChallenge: null };

    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(currentUsers, null, 2));
        console.log(`Utente ${username} registrato con successo.`);
        res.json({ message: "Registrazione completata e salvata!" });
    } catch (err) {
        res.status(500).json({ message: "Errore nel salvataggio" });
    }
});

// 2. Login Fase 1: Genera Challenge
app.post('/login-challenge', (req, res) => {
    const { username } = req.body;
    let currentUsers = loadUsers(); // Rileggiamo dal file per sicurezza

    if (!currentUsers[username]) return res.status(404).json({ message: "Utente non trovato" });

    const challenge = crypto.randomBytes(32).toString('hex');
    currentUsers[username].currentChallenge = challenge;
    
    // Salviamo temporaneamente la challenge nel file
    fs.writeFileSync(USERS_FILE, JSON.stringify(currentUsers, null, 2));
    
    res.json({ challenge });
});

// 3. Login Fase 2: Verifica Firma
app.post('/login-verify', (req, res) => {
    const { username, signature } = req.body;
    let currentUsers = loadUsers();
    const user = currentUsers[username];

    if (!user || !user.currentChallenge) return res.status(400).json({ message: "Sessione non valida" });

    try {
        const pemKey = `-----BEGIN PUBLIC KEY-----\n${user.publicKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
        const isValid = crypto.verify(
            "sha256",
            Buffer.from(user.currentChallenge),
            pemKey,
            Buffer.from(signature, 'base64')
        );
        // INDIPENDENTEMENTE dall'esito (valido o no), bruciamo la sfida
        user.currentChallenge = null;
        // Salviamo subito il database con il campo a null
        fs.writeFileSync(USERS_FILE, JSON.stringify(currentUsers, null, 2));

        if (isValid) {
            console.log(`Login riuscito per: ${username}`);
            res.json({ message: "Autenticazione riuscita!" });
        } else {
            console.log(`Login FALLITO (firma errata) per: ${username}`);
            res.status(401).json({ message: "Firma non valida!" });
        }
    } catch (err) {
        res.status(500).json({ message: "Errore nella verifica" });
    }
});

app.listen(3000, () => console.log("Server avviato su http://localhost:3000"));