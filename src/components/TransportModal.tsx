import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DestinationTransport } from '../types/adventures';
import '../styles/components/Modal.scss';

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
      setError('');
    }
  }, [isOpen, transport]);

  if (!isOpen) return null;

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
              <input
                type="date"
                id="departureDate"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
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
              <input
                type="date"
                id="arrivalDate"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
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
            <label htmlFor="infoLink">
              <i className="fas fa-link"></i>
              Info Link (opzionale)
            </label>
            <input
              type="url"
              id="infoLink"
              value={infoLink}
              onChange={(e) => setInfoLink(e.target.value)}
              placeholder="https://..."
              disabled={loading}
            />
            <small className="form-hint">
              Link esterno per informazioni aggiuntive (es. sito compagnia aerea, booking)
            </small>
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

