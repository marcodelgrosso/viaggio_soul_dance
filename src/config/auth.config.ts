// Configurazione autenticazione votazioni
// QUESTO FILE CONTIENE LA PASSWORD - MODIFICALO CON LA PASSWORD CHE VUOI!

export interface AuthConfig {
  globalPassword: string;
  allowedUsers: string[];
}

export const AUTH_CONFIG: AuthConfig = {
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
export function isUserAllowed(userCode: string): boolean {
  const normalizedUser = (userCode || '').toLowerCase().trim();
  console.log('🔍 Verificando utente:', normalizedUser);
  
  const found = AUTH_CONFIG.allowedUsers.some(allowedUser => {
    const normalizedAllowed = allowedUser.toLowerCase().trim();
    return normalizedAllowed === normalizedUser;
  });
  
  console.log('🔍 Risultato verifica:', found);
  return found;
}

// Funzione per verificare la password
export function verifyPassword(inputPassword: string): boolean {
  return inputPassword === AUTH_CONFIG.globalPassword;
}

// Funzione per autenticare l'utente
export function authenticateUser(userCode: string, password: string): string {
  console.log('🔍 Tentativo login per:', userCode);
  
  const normalizedUserCode = userCode.toLowerCase().trim();
  console.log('🔍 Normalizzato come:', normalizedUserCode);
  console.log('🔍 Utenti disponibili:', AUTH_CONFIG.allowedUsers);
  
  if (!isUserAllowed(normalizedUserCode)) {
    console.error('❌ Utente non trovato:', normalizedUserCode);
    throw new Error('Codice utente non valido. Assicurati di inserire il codice corretto.');
  }
  
  console.log('✅ Utente trovato:', normalizedUserCode);
  
  if (!verifyPassword(password)) {
    console.error('❌ Password errata');
    throw new Error('Password non corretta.');
  }
  
  console.log('✅ Autenticazione riuscita per:', normalizedUserCode);
  return normalizedUserCode;
}


