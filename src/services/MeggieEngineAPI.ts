import { supabase } from '../lib/supabase';

/**
 * MeggieEngine API Service
 * Gateway centralizzato per chiamate a n8n / servizi esterni
 */
class MeggieEngineAPIService {
  private readonly baseURL: string;
  private readonly version: string;
  private readonly serviceName: string;

  constructor() {
    // URL completo del webhook n8n (deve puntare direttamente al workflow/endpoint desiderato)
    // Esempio: https://n8n.example.com/webhook/travel-api
    const envUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    // Verifica che l'URL non sia vuoto o solo spazi
    if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
      this.baseURL = '';
    } else {
      this.baseURL = envUrl.trim();
    }
    this.version = '1.0.0';
    this.serviceName = 'MeggieEngine';
  }

  /**
   * Metodo core per chiamate action-based verso n8n.
   * Invia: { action, data, metadata }
   */
  async execute(action: string, data: Record<string, any> = {}, metadata: Record<string, any> = {}) {
    // Verifica che l'URL del webhook sia configurato
    if (!this.baseURL || this.baseURL.trim() === '') {
      const error = new Error('WEBHOOK_URL_NOT_CONFIGURED');
      (error as any).code = 'WEBHOOK_URL_NOT_CONFIGURED';
      throw error;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      const session = authData?.session;
      if (authError || !session) {
        throw new Error('Sessione non valida. Effettua il login per utilizzare i servizi.');
      }

      const payload = {
        action,
        data,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          version: this.version,
          client: 'web',
          userId: session.user.id,
          service: this.serviceName,
        },
      };

      const url = this.baseURL;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Meggie-Version': this.version,
          'X-Meggie-Client': 'web',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `Errore HTTP ${response.status}: ${response.statusText}`;
        }
        console.error(`[${this.serviceName}] HTTP Error ${response.status}:`, errorText);
        throw new Error(`${this.serviceName} Error: ${response.status} - ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      // Verifica il content-type della risposta
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Leggi il testo della risposta
      const responseText = await response.text();
      
      // Se la risposta è vuota
      if (!responseText || responseText.trim() === '') {
        console.warn(`[${this.serviceName}] Risposta vuota dal server`);
        return { data: null, message: 'Risposta vuota dal server' };
      }

      // Se non è JSON, restituisci il testo come stringa
      if (!isJson) {
        console.warn(`[${this.serviceName}] Risposta non-JSON ricevuta (content-type: ${contentType})`);
        return { data: { raw_response: responseText }, message: 'Risposta non-JSON' };
      }

      // Prova a parsare come JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[${this.serviceName}] Errore nel parsing JSON:`, parseError);
        console.error(`[${this.serviceName}] Contenuto ricevuto:`, responseText.substring(0, 500));
        throw new Error(`Risposta non valida dal server: formato JSON non valido. Contenuto: ${responseText.substring(0, 200)}...`);
      }

      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] Fatal Error:`, error);
      throw error;
    }
  }

  /**
   * analyzeBooking: analizza un link Booking e restituisce i dati.
   * Mantiene compatibilità con l'attuale flow che richiede { booking_url }
   */
  async analyzeBooking(bookingUrl: string) {
    // Preferisci lo schema action-based; se il tuo n8n attuale usa solo body semplice,
    // puoi adattare il workflow per accettare payload action/data oppure gestirlo lato n8n.
    return this.execute('analyze_booking', { booking_url: bookingUrl });
  }

  // Esempi di metodi futuri (placeholders per evoluzioni):
  async analyzeAirbnb(airbnbUrl: string) {
    return this.execute('analyze_airbnb', { airbnb_url: airbnbUrl });
  }

  /**
   * createDestinationDescription: genera una descrizione per una destinazione usando AI.
   * @param destinationName - Nome della destinazione (stringa)
   * @param options - Opzioni per la generazione (language, style, length)
   */
  async createDestinationDescription(destinationName: string, options: {
    language?: string;
    style?: 'engaging' | 'professional' | 'casual' | 'poetic';
    length?: 'short' | 'medium' | 'long';
  } = {}) {
    return this.execute('create_travel_description', {
      destination: destinationName,
      language: options.language || 'italiano',
      style: options.style || 'engaging',
      length: options.length || 'medium',
    });
  }
}

export const MeggieEngine = new MeggieEngineAPIService();
export default MeggieEngineAPIService;


