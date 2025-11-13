import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DestinationTransport } from '../types/adventures';
import SingleDatePicker from './SingleDatePicker';
import '../styles/components/Modal.scss';
import '../styles/components/TransportModal.scss';

interface TransportModalProps {
  isOpen: boolean;
  destinationId: string;
  transport?: DestinationTransport | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TransportModal: React.FC<TransportModalProps> = ({
  isOpen,
  destinationId,
  transport,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [transportType, setTransportType] = useState<'flight' | 'train' | 'hotel' | 'bus' | 'car' | 'other'>('flight');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [cost, setCost] = useState('');
  const [costType, setCostType] = useState<'fixed' | 'estimated' | 'variable'>('estimated');
  const [infoLink, setInfoLink] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractingInfo, setExtractingInfo] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (transport) {
        setTransportType(transport.transport_type);
        setDepartureDate(transport.departure_date || '');
        setDepartureTime(transport.departure_time || '');
        setArrivalDate(transport.arrival_date || '');
        setArrivalTime(transport.arrival_time || '');
        setCost(transport.cost?.toString() || '');
        setCostType(transport.cost_type);
        setInfoLink(transport.info_link || '');
        setNotes(transport.notes || '');
      } else {
        // Reset per nuova inserzione
        setTransportType('flight');
        setDepartureDate('');
        setDepartureTime('');
        setArrivalDate('');
        setArrivalTime('');
        setCost('');
        setCostType('estimated');
        setInfoLink('');
        setNotes('');
      }
      setExtractError('');
      setExtractedData(null);
      setExtractingInfo(false);
      setError('');
    }
  }, [isOpen, transport]);

  if (!isOpen) return null;

  const parseDateFromString = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const explicitMatch = trimmed.match(/(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2,4})/);
    if (explicitMatch) {
      let [, day, month, year] = explicitMatch;
      if (!day || !month || !year) return null;
      if (year.length === 2) {
        year = `20${year}`;
      }
      const isoCandidate = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      return isoCandidate;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const iso = parsed.toISOString().split('T')[0];
      return iso;
    }

    return null;
  };

  const parsePriceFromString = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    let sanitized = trimmed.replace(/[^0-9,\.]/g, '');
    if (!sanitized) return null;

    if (sanitized.includes(',') && sanitized.includes('.')) {
      if (sanitized.lastIndexOf('.') > sanitized.lastIndexOf(',')) {
        sanitized = sanitized.replace(/,/g, '');
      } else {
        sanitized = sanitized.replace(/\./g, '').replace(',', '.');
      }
    } else if (sanitized.includes(',')) {
      sanitized = sanitized.replace(',', '.');
    }

    const amount = parseFloat(sanitized);
    if (Number.isNaN(amount)) return null;

    return amount.toFixed(2);
  };

  const handleExtractInfo = async () => {
    if (!infoLink.trim()) {
      setExtractError('Inserisci un link valido prima di estrarre le informazioni.');
      return;
    }

    setExtractError('');
    setError('');
    setExtractingInfo(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Sessione non valida: impossibile ottenere il token di autenticazione.');
      }

      const response = await fetch('https://n8n.srv1072753.hstgr.cloud/webhook-test/booking-parser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ booking_url: infoLink.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Risposta non valida dal servizio (status ${response.status})`);
      }

      const parsedResponse = await response.json();
      setExtractedData(parsedResponse);

      const rawData = parsedResponse?.data ?? {};
      const formattedData = parsedResponse?.formatted ?? {};

      if (transportType !== 'hotel') {
        setTransportType('hotel');
      }

      const pickIsoDate = (value?: string | null) => {
        if (!value) return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return trimmed;
        }
        return parseDateFromString(trimmed);
      };

      const checkIn =
        pickIsoDate(rawData.check_in_date) ??
        pickIsoDate(rawData.check_in) ??
        pickIsoDate(formattedData['Check-in']);
      const checkOut =
        pickIsoDate(rawData.check_out_date) ??
        pickIsoDate(rawData.check_out) ??
        pickIsoDate(formattedData['Check-out']);

      const numericPrice =
        typeof rawData.prezzo_numerico === 'number'
          ? rawData.prezzo_numerico.toFixed(2)
          : undefined;
      const price =
        numericPrice ??
        parsePriceFromString(rawData.prezzo_totale) ??
        parsePriceFromString(formattedData['Prezzo totale']) ??
        parsePriceFromString(formattedData['Prezzo']);

      if (checkIn) {
        setArrivalDate(checkIn);
      }
      if (checkOut) {
        setDepartureDate(checkOut);
      }
      if (price) {
        setCost(price);
        setCostType('fixed');
      }

      const details: string[] = [];
      const hotelName = formattedData['Hotel'] ?? rawData.hotel;
      if (hotelName) details.push(`Hotel: ${hotelName}`);

      const guests =
        formattedData['Ospiti'] ?? rawData.ospiti ?? rawData.adulti ?? rawData.bambini;
      if (guests) details.push(`Ospiti: ${guests}`);

      const rooms = formattedData['Camere'] ?? rawData.camere;
      if (rooms) details.push(`Camere: ${rooms}`);

      const duration = formattedData['Durata'] ?? rawData.durata_notti;
      if (duration) details.push(`Durata: ${duration}${typeof rawData.durata_notti === 'number' ? ' notti' : ''}`);

      if (details.length) {
        setNotes((prev) => {
          if (!prev) {
            return `Dettagli estratti:\n${details.join('\n')}`;
          }
          if (prev.includes('Dettagli estratti:')) {
            return prev;
          }
          return `${prev}\n\nDettagli estratti:\n${details.join('\n')}`;
        });
      }
    } catch (err: any) {
      console.error('Errore durante l\'estrazione delle info Booking:', err);
      setExtractError(err?.message || 'Errore durante l\'estrazione delle informazioni.');
    } finally {
      setExtractingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const transportData = {
        destination_id: destinationId,
        transport_type: transportType,
        departure_date: departureDate || null,
        departure_time: departureTime || null,
        arrival_date: arrivalDate || null,
        arrival_time: arrivalTime || null,
        cost: cost ? parseFloat(cost) : null,
        cost_type: costType,
        info_link: infoLink.trim() || null,
        notes: notes.trim() || null,
        created_by: user.id,
      };

      if (transport) {
        // Update
        const { error: updateError } = await supabase
          .from('destination_transport')
          .update(transportData)
          .eq('id', transport.id);

        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('destination_transport')
          .insert(transportData);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore nel salvataggio del trasporto:', err);
      setError(err.message || 'Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const transportTypes = [
    { value: 'flight', label: 'Volo', icon: 'fa-plane' },
    { value: 'train', label: 'Treno', icon: 'fa-train' },
    { value: 'hotel', label: 'Albergo', icon: 'fa-hotel' },
    { value: 'bus', label: 'Bus', icon: 'fa-bus' },
    { value: 'car', label: 'Auto', icon: 'fa-car' },
    { value: 'other', label: 'Altro', icon: 'fa-ellipsis-h' },
  ];

  return (
    <div className="modal open" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className={`fas fa-${transportTypes.find(t => t.value === transportType)?.icon || 'plane'}`}></i>
            {transport ? 'Modifica' : 'Aggiungi'} Trasporto/Alloggio
          </h2>
          <button className="close-button" onClick={onClose} aria-label="Chiudi">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="transport-form">
          <div className="form-group">
            <label htmlFor="transportType">
              <i className="fas fa-tag"></i>
              Tipo <span className="required">*</span>
            </label>
            <div className="transport-types-grid">
              {transportTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`transport-type-btn ${transportType === type.value ? 'active' : ''}`}
                  onClick={() => setTransportType(type.value as any)}
                >
                  <i className={`fas ${type.icon}`}></i>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="departureDate">
                <i className="fas fa-calendar-check"></i>
                Data Partenza
              </label>
              <SingleDatePicker
                value={departureDate}
                onChange={(date) => setDepartureDate(date || '')}
                placeholder="Seleziona data partenza"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="departureTime">
                <i className="fas fa-clock"></i>
                Ora Partenza
              </label>
              <input
                type="time"
                id="departureTime"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="arrivalDate">
                <i className="fas fa-calendar-times"></i>
                Data Arrivo
              </label>
              <SingleDatePicker
                value={arrivalDate}
                onChange={(date) => setArrivalDate(date || '')}
                placeholder="Seleziona data arrivo"
                minDate={departureDate || undefined}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="arrivalTime">
                <i className="fas fa-clock"></i>
                Ora Arrivo
              </label>
              <input
                type="time"
                id="arrivalTime"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cost">
                <i className="fas fa-euro-sign"></i>
                Costo (€)
              </label>
              <input
                type="number"
                id="cost"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="costType">
                <i className="fas fa-info-circle"></i>
                Tipo Costo <span className="required">*</span>
              </label>
              <select
                id="costType"
                value={costType}
                onChange={(e) => setCostType(e.target.value as any)}
                disabled={loading}
                required
              >
                <option value="estimated">Stimato</option>
                <option value="fixed">Fisso</option>
                <option value="variable">Variabile</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-with-ai">
              <label htmlFor="infoLink">
                <i className="fas fa-link"></i>
                Info Link (opzionale)
              </label>
              <button
                type="button"
                className="generate-ai-btn extract-info-btn"
                onClick={handleExtractInfo}
                disabled={loading || extractingInfo}
                title="Estrai informazioni dalla pagina Booking"
              >
                {extractingInfo ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Estrazione...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>Estrai info</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="url"
              id="infoLink"
              value={infoLink}
              onChange={(e) => setInfoLink(e.target.value)}
              placeholder="https://..."
              disabled={loading || extractingInfo}
            />
            <small className="form-hint">
              Link esterno per informazioni aggiuntive (es. sito compagnia aerea, booking)
            </small>
            {extractError && (
              <div className="alert-message warning" role="alert">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{extractError}</span>
              </div>
            )}
            {extractedData && (
              <div className="extracted-info-preview">
                <div className="preview-header">
                  <i className="fas fa-file-alt"></i>
                  <span>Dati estratti (preview JSON)</span>
                </div>
                <pre>{JSON.stringify(extractedData, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">
              <i className="fas fa-comment"></i>
              Note (opzionali)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi informazioni aggiuntive..."
              rows={3}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="alert-message error" role="alert">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Salvataggio...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Salva
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransportModal;

