
# IdentityVault: Progetto di Autenticazione Crittografica con Simulazione di Secure Enclave

Il presente lavoro costituisce una **dimostrazione concettuale (PoC)** focalizzata su un'architettura di login avanzata. Il cuore del progetto consiste nella sostituzione delle tradizionali credenziali statiche con un framework di crittografia asimmetrica RSA, la cui esecuzione è subordinata alla verifica dell'identità biometrica tramite lo standard WebAuthn.

## Assunzioni Preliminari

Il progetto è progettato per essere presentato da un'unica macchina, pertanto è necessaria una precisazione sull'architettura:

* **Modello Reale**: L'architettura **FIDO2 / WebAuthn** segue il principio *"1 Dispositivo = 1 Utente"*. In uno scenario reale, Mario userebbe il proprio smartphone con la propria impronta, mentre Luigi userebbe il proprio laptop con il proprio riconoscimento facciale.
* **Scenario di Simulazione**: Poiché la demo avviene su un unico computer, il sistema **simula sequenzialmente dispositivi client diversi**.
* **Impersonificazione**: Quando si effettua il logout da "Mario" e il login come "Luigi", l'utente deve immaginare di aver **fisicamente cambiato dispositivo**. Il fatto che il sensore biometrico del Mac/PC accetti la stessa impronta per entrambi è coerente con la simulazione: in quel momento, l'operatore sta impersonando fisicamente il proprietario del dispositivo di Luigi.

## Obiettivi della Simulazione

Il progetto mira a dimostrare come mitigare le vulnerabilità più critiche nelle web application moderne attraverso tre pilastri:

1. **Eliminazione delle Password**: Rimozione totale dei rischi legati al phishing, al riutilizzo delle password e al furto di credenziali.
2. **Architettura Zero-Trust (Client-Side Privacy)**: La chiave privata non lascia mai il dispositivo dell'utente. Il server conosce solo la chiave pubblica, rendendo il furto del database del server inutile per un attaccante.
3. **Simulazione Secure Enclave**: Dimostrazione di come un'applicazione possa interagire con l'hardware di sicurezza (Touch ID/Face ID) per sbloccare segreti crittografici.

## Scelte Progettuali e Tecnologie

Le seguenti decisioni architteturali confermano gli obiettivi di sicurezza:

* **Protocollo Challenge-Response**: Utilizzo della libreria `crypto` di Node.js per generare Nonce casuali (32 byte). Questo garantisce l'unicità di ogni sessione e la resilienza ai Replay Attacks.
* **WebAuthn API (Biometria)**: Integrazione della tecnologia `navigator.credentials` per forzare il controllo biometrico prima di ogni operazione sensibile (Registrazione e Firma).
* **Separazione delle Responsabilità (SoC)**:
   * **Authentication Server**: Gestisce solo identità e chiavi pubbliche (`users.json`).
   * **Secure Enclave Simulator**: Gestisce le chiavi private in un ambiente isolato (`wallets.json`), simulando il comportamento di un chip TPM/Hardware Wallet.


* **Firma Digitale**: Utilizzo di standard crittografici robusti (RSA 2048 bit con SHA-256) per garantire l'integrità e l'autenticità del login.

## Struttura del Progetto

```text
/progettosicurezza
│
├── server.js               # Server Express (Backend e simulazione Enclave)
├── users.json              # Database Server (Contiene solo Chiavi Pubbliche)
├── wallets.json            # Database Client (Simulazione chiavi private protette)
│
├── public/                 
│   └── index.html          # Interfaccia utente e logica crittografica Client
│
└── package.json            # Dipendenze Node.js

```

## Istruzioni per l'Avvio

### Installazione

Assicurati di avere Node.js installato, quindi esegui:

```bash
npm install

```

### Esecuzione Server

```bash
node server.js

```

Il server sarà attivo su **http://localhost:3000**.

> **Nota Importante**: Per il corretto funzionamento delle API WebAuthn (Biometria), è necessario accedere tramite `localhost` o protocollo HTTPS.

## Come Testare la Sicurezza

Il progetto permette di verificare visivamente i flussi di sicurezza tramite l'interfaccia:

1. **Verifica della Firma Digitale**:
   * Effettua un login. Nella schermata di benvenuto, consulta l'**Audit Log**.
   * Potrai osservare la **Challenge** inviata dal server e la **Firma Digitale** generata dal client: quest'ultima prova che possiedi la chiave privata senza mai averla mostrata al server.


2. **Verifica della Protezione Biometrica**:
   * Tenta di registrarti o accedere. Noterai che il sistema richiede obbligatoriamente l'interazione con il sensore biometrico (o il PIN di sistema) prima di procedere.


3. **Analisi del Database Server**:
   * Apri il file `users.json`. Noterai che il server non memorizza nulla che possa permettere a un hacker di fingersi te (nessuna password, nessuna chiave privata).


4. **Reset di Sistema**:
   * In caso di necessità o per ricominciare la simulazione da zero, utilizza il tasto **RESET DB** presente nell'interfaccia.


