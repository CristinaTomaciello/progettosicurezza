const crypto = require('crypto');

const auth = {
    // Genera una sfida casuale (nonce) per evitare Replay Attacks
    generateChallenge: () => {
        return crypto.randomBytes(32).toString('hex');
    },

    // Verifica la firma inviata dal client usando la chiave pubblica salvata
    verifySignature: (challenge, signature, publicKey) => {
        const verifier = crypto.createVerify('sha256');
        verifier.update(challenge);
        verifier.end();
        return verifier.verify(publicKey, signature, 'hex');
    }
};

module.exports = auth;