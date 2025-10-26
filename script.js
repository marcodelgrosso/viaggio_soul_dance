// Dati delle destinazioni con itinerari dettagliati per il weekend 6-8 dicembre
const destinations = {
    seville: {
        name: "Siviglia, Spagna",
        image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&h=600&fit=crop&crop=center",
        description: "Il cuore dell'Andalusia tra flamenco e architettura moresca. Siviglia incanta con i suoi vicoli medievali, i palazzi arabi e l'atmosfera calda e accogliente.",
        itinerary: [
            {
                day: "Venerdì 6 Dicembre",
                title: "Arrivo e primo sguardo su Siviglia",
                activities: [
                    "Arrivo all'aeroporto di Siviglia",
                    "Trasferimento in centro",
                    "Check-in in hotel nel centro storico",
                    "Pranzo con tapas tradizionali",
                    "Visita alla Cattedrale di Siviglia",
                    "Passeggiata nel Barrio de Santa Cruz",
                    "Cena con spettacolo di flamenco"
                ]
            },
            {
                day: "Sabato 7 Dicembre",
                title: "I tesori di Siviglia",
                activities: [
                    "Colazione andalusa",
                    "Visita all'Alcázar di Siviglia",
                    "Passeggiata a Plaza de España",
                    "Pranzo tradizionale",
                    "Visita alla Torre del Oro",
                    "Shopping nel centro storico",
                    "Cena in ristorante tipico"
                ]
            },
            {
                day: "Domenica 8 Dicembre",
                title: "Ultimo giorno e partenza",
                activities: [
                    "Colazione in hotel",
                    "Visita al Metropol Parasol",
                    "Passeggiata finale per la città",
                    "Pranzo di arrivederci",
                    "Shopping per souvenir",
                    "Trasferimento all'aeroporto",
                    "Partenza per Roma"
                ]
            }
        ],
        highlights: [
            "Architettura moresca e gotica",
            "Flamenco e cultura andalusa",
            "Tapas e cucina tradizionale",
            "Vicoli medievali e atmosfera",
            "Clima mite e accoglienza"
        ]
    },
    london: {
        name: "Londra, Regno Unito",
        image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&h=600&fit=crop&crop=center",
        description: "La capitale britannica tra storia, cultura e modernità. Un weekend perfetto per immergersi nell'atmosfera londinese tra monumenti iconici, mercati tradizionali e la vivace vita notturna.",
        itinerary: [
            {
                day: "Venerdì 6 Dicembre",
                title: "Arrivo e primo impatto con Londra",
                activities: [
                    "Arrivo all'aeroporto di Heathrow/Luton",
                    "Trasferimento in centro con metropolitana",
                    "Check-in in hotel nel centro",
                    "Pranzo in un pub tradizionale",
                    "Visita al Big Ben e Houses of Parliament",
                    "Passeggiata lungo il Tamigi",
                    "Cena a Covent Garden"
                ]
            },
            {
                day: "Sabato 7 Dicembre",
                title: "I tesori di Londra",
                activities: [
                    "Colazione all'inglese",
                    "Visita al British Museum",
                    "Shopping a Oxford Street",
                    "Pranzo a Borough Market",
                    "Visita alla Tower of London",
                    "Passeggiata a Camden Market",
                    "Cena e spettacolo a West End"
                ]
            },
            {
                day: "Domenica 8 Dicembre",
                title: "Ultimo giorno e partenza",
                activities: [
                    "Colazione in hotel",
                    "Visita al Buckingham Palace",
                    "Passeggiata a Hyde Park",
                    "Pranzo a Notting Hill",
                    "Shopping finale a Portobello Road",
                    "Trasferimento all'aeroporto",
                    "Partenza per Roma"
                ]
            }
        ],
        highlights: [
            "Monumenti iconici e storia millenaria",
            "Mercati tradizionali e shopping",
            "Teatro e cultura britannica",
            "Cucina internazionale e pub",
            "Trasporti efficienti e moderni"
        ]
    },
    birmingham: {
        name: "Birmingham, Regno Unito",
        image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop&crop=center",
        description: "Il cuore industriale dell'Inghilterra con un'anima creativa. Birmingham offre una miscela unica di storia industriale, cultura contemporanea e una scena culinaria in crescita.",
        itinerary: [
            {
                day: "Venerdì 6 Dicembre",
                title: "Arrivo e scoperta del centro",
                activities: [
                    "Arrivo all'aeroporto di Birmingham",
                    "Trasferimento in centro",
                    "Check-in in hotel",
                    "Pranzo in un ristorante locale",
                    "Visita al Birmingham Museum & Art Gallery",
                    "Passeggiata a Victoria Square",
                    "Cena nel quartiere di Digbeth"
                ]
            },
            {
                day: "Sabato 7 Dicembre",
                title: "Storia e cultura di Birmingham",
                activities: [
                    "Colazione tradizionale",
                    "Visita al Thinktank Science Museum",
                    "Passeggiata lungo i canali",
                    "Pranzo a Jewellery Quarter",
                    "Visita alla Cattedrale di Birmingham",
                    "Shopping a Bullring & Grand Central",
                    "Cena e musica dal vivo"
                ]
            },
            {
                day: "Domenica 8 Dicembre",
                title: "Ultimo giorno e partenza",
                activities: [
                    "Colazione in hotel",
                    "Visita al Cadbury World",
                    "Passeggiata a Cannon Hill Park",
                    "Pranzo tradizionale",
                    "Shopping finale",
                    "Trasferimento all'aeroporto",
                    "Partenza per Roma"
                ]
            }
        ],
        highlights: [
            "Storia industriale e innovazione",
            "Musei e gallerie d'arte",
            "Cucina multiculturale",
            "Musica e vita notturna",
            "Parchi e spazi verdi"
        ]
    },
    geneva: {
        name: "Ginevra, Svizzera",
        image: "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=800&h=600&fit=crop&crop=center",
        description: "Elegante città svizzera tra lago e montagne. Ginevra offre un mix perfetto di natura, cultura e lusso, con il Lago di Ginevra e le Alpi come sfondo mozzafiato.",
        itinerary: [
            {
                day: "Venerdì 6 Dicembre",
                title: "Arrivo e primo sguardo su Ginevra",
                activities: [
                    "Arrivo all'aeroporto di Ginevra",
                    "Trasferimento in centro",
                    "Check-in in hotel sul lago",
                    "Pranzo in ristorante con vista lago",
                    "Passeggiata lungo il Quai du Mont-Blanc",
                    "Visita al Jet d'Eau",
                    "Cena in ristorante gourmet"
                ]
            },
            {
                day: "Sabato 7 Dicembre",
                title: "Cultura e natura a Ginevra",
                activities: [
                    "Colazione svizzera",
                    "Visita al Museo d'Arte e Storia",
                    "Passeggiata nella Vieille Ville",
                    "Pranzo tradizionale svizzero",
                    "Escursione in montagna (se tempo permettendo)",
                    "Shopping di lusso",
                    "Cena con vista sulle Alpi"
                ]
            },
            {
                day: "Domenica 8 Dicembre",
                title: "Ultimo giorno e partenza",
                activities: [
                    "Colazione in hotel",
                    "Visita al Palazzo delle Nazioni",
                    "Passeggiata nei giardini botanici",
                    "Pranzo al lago",
                    "Relax finale",
                    "Trasferimento all'aeroporto",
                    "Partenza per Roma"
                ]
            }
        ],
        highlights: [
            "Lago di Ginevra e paesaggi alpini",
            "Cultura internazionale e diplomazia",
            "Lusso e orologi svizzeri",
            "Cucina raffinata e cioccolato",
            "Natura incontaminata e relax"
        ]
    }
};

// Variabili globali
let currentDestination = null;
let currentVote = null;
let authenticatedUser = null; // Utente autenticato
let userVotes = {}; // Cache dei voti dell'utente

// Funzione per caricare i voti dell'utente
async function loadUserVotes() {
    if (!authenticatedUser || typeof window.SUPABASE_CONFIG === 'undefined') {
        return;
    }
    
    try {
        const response = await fetch(
            `${window.SUPABASE_CONFIG.url}/rest/v1/destination_votes?user_code=eq.${authenticatedUser}`,
            {
                headers: {
                    'apikey': window.SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${window.SUPABASE_CONFIG.anonKey}`
                }
            }
        );
        
        if (response.ok) {
            const votes = await response.json();
            
            // Crea un oggetto con destination_id come chiave
            userVotes = {};
            votes.forEach(vote => {
                userVotes[vote.destination_id] = vote;
            });
            
            // Aggiorna i badge nelle card
            updateVoteBadges();
            
            console.log('Voti caricati:', userVotes);
        }
    } catch (error) {
        console.error('Errore nel caricamento dei voti:', error);
    }
}

// Funzione per aggiornare i badge nelle card
function updateVoteBadges() {
    const destinations = ['seville', 'london', 'birmingham', 'geneva'];
    
    destinations.forEach(destId => {
        const vote = userVotes[destId];
        if (vote) {
            addVoteBadgeToCard(destId, vote);
        }
    });
}

// Funzione per aggiungere il badge di voto a una card
function addVoteBadgeToCard(destinationId, vote) {
    const card = document.querySelector(`.destination-card[onclick*="${destinationId}"]`);
    if (!card) return;
    
    // Rimuovi badge esistenti
    const existingBadge = card.querySelector('.user-vote-badge-card');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    const badge = document.createElement('div');
    badge.className = `user-vote-badge-card ${vote.vote_type === 'yes' ? 'vote-yes-card' : 'vote-no-card'}`;
    badge.innerHTML = `
        <i class="fas fa-${vote.vote_type === 'yes' ? 'thumbs-up' : 'thumbs-down'}"></i>
        <span>Hai votato: ${vote.vote_type === 'yes' ? 'Ti piace' : 'Non ti convince'}</span>
    `;
    
    // Aggiungi il badge dopo card-content o nell'apposita posizione
    const cardContent = card.querySelector('.card-content');
    if (cardContent) {
        // Inserisci il badge all'inizio del card-content
        cardContent.insertBefore(badge, cardContent.firstChild);
    }
}

// Funzione per gestire il login
async function handleLogin() {
    const userCode = document.getElementById('loginUserCode').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    errorElement.textContent = '';
    
    if (!userCode || !password) {
        errorElement.textContent = 'Compila tutti i campi';
        return;
    }
    
    try {
        // Autentica l'utente
        const authenticatedUserCode = authenticateUser(userCode, password);
        
        // Salva lo stato di autenticazione
        sessionStorage.setItem('authenticatedUser', authenticatedUserCode);
        sessionStorage.setItem('loginTime', Date.now());
        authenticatedUser = authenticatedUserCode;
        
        // Nasconde lo schermo di login con animazione
        const loginScreen = document.getElementById('loginScreen');
        loginScreen.style.opacity = '0';
        loginScreen.style.transition = 'opacity 0.5s ease-out';
        
        setTimeout(() => {
            loginScreen.style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
        }, 500);
        
        console.log('✅ Login riuscito:', authenticatedUserCode);
        
        // Carica i voti dell'utente dopo il login
        await loadUserVotes();
    } catch (error) {
        console.error('❌ Errore login:', error.message);
        errorElement.textContent = error.message;
    }
}

// Controlla se l'utente è già autenticato
function checkAuthentication() {
    const savedUser = sessionStorage.getItem('authenticatedUser');
    const loginTime = sessionStorage.getItem('loginTime');
    
    // Se c'è un utente salvato e la sessione è valida (24 ore)
    if (savedUser && loginTime && (Date.now() - loginTime) < 86400000) {
        authenticatedUser = savedUser;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        console.log('✅ Utente già autenticato:', authenticatedUser);
        
        // Carica i voti dell'utente
        loadUserVotes();
    } else {
        // Reset se la sessione è scaduta
        if (savedUser) {
            sessionStorage.clear();
        }
    }
}

// Funzione per il logout
function logout() {
    if (confirm('Vuoi uscire?')) {
        sessionStorage.clear();
        authenticatedUser = null;
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('loginScreen').style.opacity = '1';
        
        // Reset form login
        document.getElementById('loginUserCode').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginError').textContent = '';
        
        console.log('✅ Logout effettuato');
    }
}

// Funzioni di utilità
function scrollToDestinations() {
    document.getElementById('destinations').scrollIntoView({
        behavior: 'smooth'
    });
}

async function openDestination(destinationId) {
    currentDestination = destinationId;
    const destination = destinations[destinationId];
    
    if (!destination) {
        console.error('Destinazione non trovata:', destinationId);
        return;
    }
    
    // Recupera il voto esistente dell'utente per questa destinazione
    let existingVote = null;
    if (authenticatedUser && typeof getDestinationVoteCount === 'function') {
        try {
            const response = await fetch(
                `${window.SUPABASE_CONFIG.url}/rest/v1/destination_votes?destination_id=eq.${destinationId}&user_code=eq.${authenticatedUser}`,
                {
                    headers: {
                        'apikey': window.SUPABASE_CONFIG.anonKey,
                        'Authorization': `Bearer ${window.SUPABASE_CONFIG.anonKey}`
                    }
                }
            );
            
            if (response.ok) {
                const votes = await response.json();
                if (votes.length > 0) {
                    existingVote = votes[0];
                }
            }
        } catch (error) {
            console.error('Errore nel recupero del voto:', error);
        }
    }
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = createDestinationDetailHTML(destination, existingVote);
    
    const modal = document.getElementById('destinationModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function createDestinationDetailHTML(destination, existingVote = null) {
    // Se esiste un voto, mostra il badge
    const voteBadge = existingVote ? `
        <div class="user-vote-badge ${existingVote.vote_type === 'yes' ? 'vote-yes-badge' : 'vote-no-badge'}">
            <i class="fas fa-${existingVote.vote_type === 'yes' ? 'thumbs-up' : 'thumbs-down'}"></i>
            <span>Hai già votato: ${existingVote.vote_type === 'yes' ? 'Ti piace!' : 'Non ti convince'}</span>
            ${existingVote.comment ? `<p class="vote-comment">"${existingVote.comment}"</p>` : ''}
        </div>
    ` : '';
    
    return `
        <div class="destination-detail">
            <div class="destination-user-info">
                <i class="fas fa-user-circle"></i>
                <span>Connesso come: <strong>${authenticatedUser || 'N/A'}</strong></span>
            </div>
            ${voteBadge}
            <h2>${destination.name}</h2>
            <img src="${destination.image}" alt="${destination.name}">
            <p>${destination.description}</p>
            
            <div class="itinerary">
                <h3><i class="fas fa-map-marked-alt"></i> Itinerario del viaggio</h3>
                ${destination.itinerary.map(day => `
                    <div class="day-item">
                        <h4>${day.day} - ${day.title}</h4>
                        <ul>
                            ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
            
            <div class="highlights">
                <h3><i class="fas fa-star"></i> Punti salienti</h3>
                <div class="card-features">
                    ${destination.highlights.map(highlight => `
                        <span class="feature">
                            <i class="fas fa-check"></i>
                            ${highlight}
                        </span>
                    `).join('')}
                </div>
            </div>
            
            <button class="vote-button" onclick="openVotingModal()">
                <i class="fas fa-vote-yea"></i>
                ${existingVote ? 'Cambia voto' : 'Vota questa destinazione'}
            </button>
        </div>
    `;
}

function closeModal() {
    const modal = document.getElementById('destinationModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openVotingModal(destinationId = null) {
    // Se viene passato un destinationId, usa quello, altrimenti usa currentDestination
    if (destinationId) {
        currentDestination = destinationId;
    }
    
    // Mostra il nome della destinazione nel modal
    const destinationNameEl = document.getElementById('votingDestinationName');
    if (destinationNameEl && currentDestination) {
        const destinationName = destinations[currentDestination]?.name || '';
        destinationNameEl.textContent = destinationName;
    }
    
    // Mostra l'utente autenticato
    const votingUserInfoEl = document.getElementById('votingUserInfo');
    if (votingUserInfoEl && authenticatedUser) {
        votingUserInfoEl.textContent = authenticatedUser;
    }
    
    const votingModal = document.getElementById('votingModal');
    votingModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeVotingModal() {
    const votingModal = document.getElementById('votingModal');
    votingModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset del form
    currentVote = null;
    document.getElementById('commentText').value = '';
    
    // Reset messaggi di errore
    const authError = document.getElementById('authError');
    if (authError) {
        authError.textContent = '';
    }
    
    // Reset dei pulsanti di voto
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1)';
    });
}

function vote(voteType) {
    currentVote = voteType;
    
    // Reset di tutti i pulsanti
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.style.opacity = '0.6';
        btn.style.transform = 'scale(0.95)';
    });
    
    // Evidenzia il pulsante selezionato
    const selectedBtn = document.querySelector(`.vote-${voteType}`);
    selectedBtn.style.opacity = '1';
    selectedBtn.style.transform = 'scale(1.05)';
    
    // Mostra feedback visivo
    showVoteFeedback(voteType);
}

function showVoteFeedback(voteType) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${voteType === 'yes' ? 'linear-gradient(135deg, #48bb78, #38a169)' : 'linear-gradient(135deg, #f56565, #e53e3e)'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 3000;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    feedback.innerHTML = `
        <i class="fas fa-${voteType === 'yes' ? 'thumbs-up' : 'thumbs-down'}"></i>
        ${voteType === 'yes' ? 'Ottima scelta!' : 'Capisco, grazie per il feedback!'}
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        document.body.removeChild(feedback);
    }, 2000);
}

async function submitVote() {
    console.log('🚀 submitVote() chiamata');
    
    // Reset errori
    const authError = document.getElementById('authError');
    authError.textContent = '';
    
    // Validazione campi obbligatori
    if (!currentVote) {
        console.log('❌ Nessun voto selezionato');
        authError.textContent = 'Per favore, seleziona prima la tua preferenza (Sì o No)';
        return;
    }
    
    console.log('✅ Voto selezionato:', currentVote);
    
    // Usa l'utente già autenticato
    if (!authenticatedUser) {
        console.error('❌ Nessun utente autenticato');
        authError.textContent = 'Errore: sessione non valida. Ricarica la pagina.';
        return;
    }
    
    console.log('✅ Utente autenticato:', authenticatedUser);
    
    const comment = document.getElementById('commentText').value.trim();
    console.log('📝 Commento:', comment || '(nessun commento)');
    
    // Prepara i dati per la votazione
    const voteData = {
        destination: currentDestination,
        vote: currentVote,
        comment: comment,
        userCode: authenticatedUser, // Usa l'utente già autenticato
        timestamp: new Date().toISOString()
    };
    
    console.log('📊 Dati votazione:', voteData);
    
    try {
        console.log('🔍 Verifico se submitVoteToSupabase è disponibile...');
        console.log('typeof submitVoteToSupabase:', typeof submitVoteToSupabase);
        
        // Prova a inviare a Supabase se configurato
        if (typeof submitVoteToSupabase === 'function') {
            console.log('✅ Funzione submitVoteToSupabase trovata, invio votazione...');
            await submitVoteToSupabase(voteData);
            console.log('✅ Votazione salvata su Supabase');
            
            // Ricarica i voti dell'utente per aggiornare i badge
            await loadUserVotes();
        } else {
            console.error('❌ FUNZIONE submitVoteToSupabase NON TROVATA!');
            console.log('Prova a controllare se supabase-config.js è caricato correttamente.');
        }
        
        // Mostra conferma
        showSubmissionConfirmation();
        
        // Chiudi il modal dopo un breve delay
        setTimeout(() => {
            closeVotingModal();
        }, 2000);
    } catch (error) {
        console.error('Errore nell\'invio della votazione:', error);
        
        // Mostra errore specifico
        authError.textContent = 'Errore nell\'invio della votazione. Riprova.';
    }
}

function showSubmissionConfirmation() {
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 2rem 3rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 3000;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: fadeInOut 3s ease-in-out;
    `;
    
    confirmation.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <h3>Votazione inviata con successo!</h3>
        <p>Grazie per il tuo feedback. Aiuterà altri viaggiatori a scegliere la loro prossima destinazione.</p>
    `;
    
    document.body.appendChild(confirmation);
    
    setTimeout(() => {
        document.body.removeChild(confirmation);
    }, 3000);
}

// Gestione eventi
document.addEventListener('DOMContentLoaded', function() {
    // Controlla se l'utente è già autenticato
    checkAuthentication();
    
    // Supporto per il tasto Enter nei campi di login
    document.getElementById('loginUserCode')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    document.getElementById('loginPassword')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Smooth scrolling per i link di navigazione
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Chiudi modal cliccando fuori
    window.addEventListener('click', function(event) {
        const destinationModal = document.getElementById('destinationModal');
        const votingModal = document.getElementById('votingModal');
        
        if (event.target === destinationModal) {
            closeModal();
        }
        
        if (event.target === votingModal) {
            closeVotingModal();
        }
    });
    
    // Animazioni al scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Osserva le card delle destinazioni
    document.querySelectorAll('.destination-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Aggiungi CSS per le animazioni
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
    }
    
    .destination-detail ul {
        list-style: none;
        padding-left: 0;
    }
    
    .destination-detail li {
        padding: 0.3rem 0;
        position: relative;
        padding-left: 1.5rem;
    }
    
    .destination-detail li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: var(--primary-color);
        font-weight: bold;
    }
    
    .highlights {
        margin: 2rem 0;
    }
    
    .highlights h3 {
        color: var(--text-dark);
        margin-bottom: 1rem;
        font-size: 1.3rem;
    }
`;
document.head.appendChild(style);
