import React, { useState } from 'react';

const SuperAdminSystemSettings: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoNotifications, setAutoNotifications] = useState(true);
  const [analyticsEmail, setAnalyticsEmail] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [supabaseServiceRole, setSupabaseServiceRole] = useState('');

  return (
    <div className="superadmin-section-wrapper system-settings">
      <div className="superadmin-section-header">
        <div>
          <h2>Impostazioni piattaforma</h2>
          <p>
            Configura integrazioni, automazioni e strumenti amministrativi. Le modifiche apportate
            qui sono solo illustrative: collega questi campi a un backend sicuro per salvarle in
            modo persistente.
          </p>
        </div>
      </div>

      <div className="superadmin-settings-grid">
        <section className="superadmin-card">
          <header>
            <h3>
              <i className="fas fa-wrench" />
              Modalità manutenzione
            </h3>
            <p>
              Oscura temporaneamente l’accesso agli utenti finali mentre esegui aggiornamenti
              critici.
            </p>
          </header>
          <div className="setting-row">
            <label htmlFor="maintenanceSwitch">Attiva modalità manutenzione</label>
            <button
              id="maintenanceSwitch"
              className={`toggle ${maintenanceMode ? 'on' : 'off'}`}
              onClick={() => setMaintenanceMode((value) => !value)}
            >
              <span />
            </button>
          </div>
          <p className="hint">
            Persisti questo stato in Supabase (es. tabella <code>platform_settings</code>) per
            applicarlo globalmente.
          </p>
        </section>

        <section className="superadmin-card">
          <header>
            <h3>
              <i className="fas fa-bell" />
              Notifiche automatiche
            </h3>
            <p>Invia reminder su votazioni, proposte e scadenze ai partecipanti.</p>
          </header>
          <div className="setting-row">
            <label htmlFor="autoNotificationSwitch">Notifiche email push</label>
            <button
              id="autoNotificationSwitch"
              className={`toggle ${autoNotifications ? 'on' : 'off'}`}
              onClick={() => setAutoNotifications((value) => !value)}
            >
              <span />
            </button>
          </div>
          <div className="setting-row column">
            <label htmlFor="analyticsEmail">Invia report settimanale a</label>
            <input
              id="analyticsEmail"
              type="email"
              placeholder="admin@travel.com"
              value={analyticsEmail}
              onChange={(event) => setAnalyticsEmail(event.target.value)}
            />
          </div>
          <p className="hint">
            Integra con un servizio come Resend o SendGrid e registra le preferenze nella tabella{' '}
            <code>admin_notification_settings</code>.
          </p>
        </section>

        <section className="superadmin-card">
          <header>
            <h3>
              <i className="fas fa-robot" />
              Integrazione AI
            </h3>
            <p>Gestisci chiavi API e prompt utilizzati dall’assistente per estrarre dati.</p>
          </header>
          <div className="setting-row column">
            <label htmlFor="openAiKey">OpenAI API Key</label>
            <input
              id="openAiKey"
              type="password"
              placeholder="sk-********"
              value={openAiKey}
              onChange={(event) => setOpenAiKey(event.target.value)}
            />
          </div>
          <div className="setting-row column">
            <label>Prompt template booking</label>
            <textarea
              rows={4}
              defaultValue={`Analizza il link fornito e restituisci un JSON con: departure_date, arrival_date, cost.amount, cost.currency, info_link, notes.`}
            />
          </div>
          <p className="hint">
            Non memorizzare le chiavi nel frontend. Archivia questi valori in Supabase con RLS o in
            un secret manager (es. Vercel, Doppler).
          </p>
        </section>

        <section className="superadmin-card">
          <header>
            <h3>
              <i className="fas fa-plug" />
              Supabase service role
            </h3>
            <p>
              Utilizza la chiave con privilegi elevati solo dal server per eseguire job
              amministrativi automatizzati.
            </p>
          </header>
          <div className="setting-row column">
            <label htmlFor="serviceRoleKey">Service role key</label>
            <input
              id="serviceRoleKey"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              value={supabaseServiceRole}
              onChange={(event) => setSupabaseServiceRole(event.target.value)}
            />
          </div>
          <ul className="guidelines">
            <li>Non salvare mai la service key nei componenti React visibili al client.</li>
            <li>
              Configura job pianificati (cron) per generare report o inviare reminder utilizzando
              questa chiave.
            </li>
            <li>Limita l’accesso a un ristretto gruppo di superadmin.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminSystemSettings;


