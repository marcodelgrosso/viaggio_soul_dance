// Configurazione autenticazione votazioni
// QUESTO FILE CONTIENE LA PASSWORD - MODIFICALO CON LA PASSWORD CHE VUOI!

const AUTH_CONFIG = {
    // MODIFICA QUESTA PASSWORD CON UNA TUA SICURA!
    globalPassword: 'SOUL_DANCE_2025', // ⚠️ CAMBIA QUESTA PASSWORD!
    
    // Lista degli utenti ammessi al sistema di votazione
    allowedUsers: [
        'marco.delgrosso', // Admin
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
    // Normalizza anche l'utente in input
    const normalizedUser = (userCode || '').toLowerCase().trim();
    console.log('🔍 Verificando utente:', normalizedUser);
    
    // Controlla se è nella lista (tutti gli utenti sono già lowercase)
    const found = AUTH_CONFIG.allowedUsers.some(allowedUser => {
        const normalizedAllowed = allowedUser.toLowerCase().trim();
        return normalizedAllowed === normalizedUser;
    });
    
    console.log('🔍 Risultato verifica:', found);
    return found;
}

// Funzione per verificare la password
function verifyPassword(inputPassword) {
    return inputPassword === AUTH_CONFIG.globalPassword;
}

// Funzione per autenticare l'utente
function authenticateUser(userCode, password) {
    console.log('🔍 Tentativo login per:', userCode);
    
    // Normalizza il codice utente (lowercase e trim)
    const normalizedUserCode = userCode.toLowerCase().trim();
    console.log('🔍 Normalizzato come:', normalizedUserCode);
    console.log('🔍 Utenti disponibili:', AUTH_CONFIG.allowedUsers);
    
    // Verifica che l'utente sia nella lista
    if (!isUserAllowed(normalizedUserCode)) {
        console.error('❌ Utente non trovato:', normalizedUserCode);
        throw new Error('Codice utente non valido. Assicurati di inserire il codice corretto.');
    }
    
    console.log('✅ Utente trovato:', normalizedUserCode);
    
    // Verifica la password
    if (!verifyPassword(password)) {
        console.error('❌ Password errata');
        throw new Error('Password non corretta.');
    }
    
    console.log('✅ Autenticazione riuscita per:', normalizedUserCode);
    return normalizedUserCode;
}

