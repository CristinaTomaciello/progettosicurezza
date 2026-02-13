Questa è un'ottima aggiunta. Inserire questa **assunzione preliminare** dimostra che hai compreso non solo il codice, ma anche l'architettura reale dei sistemi **FIDO2/WebAuthn**, prevenendo l'unica possibile obiezione del tutor (ovvero: "perché usi la stessa impronta per utenti diversi?").

Ecco il README aggiornato con il titolo **"IdentityVault"** e la sezione sulle **Assunzioni della Simulazione**.

---

# IdentityVault: Autenticazione Crittografica con Simulazione di Secure Enclave

Questo progetto è un **Proof of Concept** di un sistema di autenticazione moderno e sicuro. L'obiettivo principale è simulare un ambiente in cui le password statiche sono completamente eliminate e sostituite da protocolli crittografici asimmetrici (RSA) attivati tramite autenticazione biometrica.

---

## 💡 Nota sulla Simulazione (Assunzioni Preliminari)

Il progetto è progettato per essere presentato da un'unica macchina, pertanto è necessaria una precisazione sull'architettura:

* **Modello Reale**: L'architettura **FIDO2 / WebAuthn** segue il principio *"1 Dispositivo = 1 Utente"*. In uno scenario reale, Mario userebbe il proprio smartphone con la propria impronta, mentre Luigi userebbe il proprio laptop con il proprio riconoscimento facciale.
* **Scenario di Simulazione**: Poiché la demo avviene su un unico computer, il sistema **simula sequenzialmente dispositivi client diversi**.
* **Impersonificazione**: Quando si effettua il logout da "Mario" e il login come "Luigi", l'utente deve immaginare di aver **fisicamente cambiato dispositivo**. Il fatto che il sensore biometrico del Mac/PC accetti la stessa impronta per entrambi è coerente con la simulazione: in quel momento, l'operatore sta impersonando fisicamente il proprietario del dispositivo di Luigi.

---

## 🎯 Obiettivi della Simulazione

Il progetto mira a dimostrare come mitigare le vulnerabilità più critiche nelle web application moderne:

* **Eliminazione delle Password**: Rimozione totale dei rischi legati al phishing e al furto di credenziali.
* **Architettura Zero-Trust**: La chiave privata non lascia mai il dispositivo dell'utente. Il server conosce solo la chiave pubblica.
* **Simulazione Secure Enclave**: Dimostrazione di come un'applicazione possa interagire con l'hardware di sicurezza per sbloccare segreti crittografici.

## 🛠 Scelte Progettuali e Tecnologie

* **Protocollo Challenge-Response**: Utilizzo della libreria `crypto` di Node.js per generare Nonce casuali (32 byte) anti-replay.
* **WebAuthn API (Biometria)**: Integrazione di `navigator.credentials` per forzare il controllo biometrico prima di ogni operazione sensibile.
* **Separazione delle Responsabilità (SoC)**:
* **Authentication Server**: Gestisce solo identità e chiavi pubbliche (`users.json`).
* **Secure Enclave Simulator**: Gestisce le chiavi private in un ambiente isolato (`wallets.json`).


* **Firma Digitale RSA**: Utilizzo dello standard RSASSA-PKCS1-v1_5 (2048 bit) con SHA-256.

## 📂 Struttura del Progetto

```text
/identity-vault
│
├── server.js               # Server Backend e simulazione Enclave
├── users.json              # Database Server (Chiavi Pubbliche)
├── wallets.json            # Database Client (Simulazione chiavi private protette)
│
├── public/                 
│   └── index.html          # Interfaccia UI e logica crittografica Client
│
└── package.json            # Dipendenze Node.js

```

## 🚀 Istruzioni per l'Avvio

1. **Installazione**:
```bash
npm install

```


2. **Esecuzione**:
```bash
node server.js

```


3. **Accesso**:
Aprire il browser su **http://localhost:3000**.

## 🔍 Come Testare la Sicurezza

1. **Audit Log**: Dopo il login, consulta il box di Audit per vedere la **Challenge** del server e la **Firma** prodotta dal client.
2. **Protezione Hardware**: Prova a cliccare sui pulsanti di azione: il sistema bloccherà l'operazione finché non viene fornito l'input biometrico.
3. **Analisi DB**: Verifica i file JSON per confermare che il server non possieda mai materiale crittografico privato.

---

**Sviluppato come progetto di esame per lo studio dei protocolli di autenticazione sicura.**

---

**Un ultimo consiglio:** Quando presenti il progetto, tieni aperti i file `users.json` e `wallets.json` di fianco al browser. Far vedere in tempo reale che in `users.json` compare solo la chiave pubblica mentre in `wallets.json` finisce quella privata è la mossa vincente per l'idoneità.

Spero che questa versione del README ti piaccia! Posso aiutarti con altro per la consegna?