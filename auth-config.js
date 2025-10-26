// Configurazione autenticazione votazioni
// QUESTO FILE CONTIENE LA PASSWORD - MODIFICALO CON LA PASSWORD CHE VUOI!

const AUTH_CONFIG = {
    // MODIFICA QUESTA PASSWORD CON UNA TUA SICURA!
    globalPassword: 'SOUL_DANCE_2025', // ⚠️ CAMBIA QUESTA PASSWORD!
    
    // Lista degli utenti ammessi al sistema di votazione
    allowedUsers: [
        'roberta.denoto',
        'cinzia.carriero',
        'cecilia.tinti',
        'angelo.mazzuolo',
        'francesca.franzini',
        'gianluca.raffa',
        'raffaello.fiorentini',
        'vanessa.proietti',
        'barbara.napoli',
        'rosanna',
        'mary.russo',
        'ciccio.palma'
    ]
};

// Funzione per verificare se l'utente esiste
function isUserAllowed(userCode) {
    return AUTH_CONFIG.allowedUsers.includes(userCode.toLowerCase());
}

// Funzione per verificare la password
function verifyPassword(inputPassword) {
    return inputPassword === AUTH_CONFIG.globalPassword;
}

// Funzione per autenticare l'utente
function authenticateUser(userCode, password) {
    // Normalizza il codice utente (lowercase e trim)
    const normalizedUserCode = userCode.toLowerCase().trim();
    
    // Verifica che l'utente sia nella lista
    if (!isUserAllowed(normalizedUserCode)) {
        throw new Error('Codice utente non valido. Assicurati di inserire il codice corretto.');
    }
    
    // Verifica la password
    if (!verifyPassword(password)) {
        throw new Error('Password non corretta.');
    }
    
    return normalizedUserCode;
}

