import React, { useEffect, useState } from 'react';
import { destinations } from '../types/destinations';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import VotingModal from './VotingModal';
import '../styles/components/Modal.scss';

interface DestinationModalProps {
  destinationId: string;
  onClose: () => void;
}

const DestinationModal: React.FC<DestinationModalProps> = ({ destinationId, onClose }) => {
  const { user, email } = useAuth();
  const [existingVote, setExistingVote] = useState<any>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadExistingVote();
    }
  }, [user, destinationId]);

  const loadExistingVote = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('destination_votes')
        .select('*')
        .eq('destination_id', destinationId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Errore nel recupero del voto:', error);
        return;
      }

      if (data) {
        setExistingVote(data);
      }
    } catch (error) {
      console.error('Errore nel recupero del voto:', error);
    }
  };

  const destination = destinations[destinationId];

  if (!destination) {
    return null;
  }

  return (
    <>
      <div className="modal" style={{ display: 'block' }} onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={onClose}>&times;</span>
          <div className="destination-detail">
            <div className="destination-user-info">
              <i className="fas fa-user-circle"></i>
              <span>Connesso come: <strong>{email || 'N/A'}</strong></span>
            </div>
            {existingVote && (
              <div className={`user-vote-badge ${existingVote.vote_type === 'yes' ? 'vote-yes-badge' : 'vote-no-badge'}`}>
                <i className={`fas fa-${existingVote.vote_type === 'yes' ? 'thumbs-up' : 'thumbs-down'}`}></i>
                <span>Hai già votato: {existingVote.vote_type === 'yes' ? 'Ti piace!' : 'Non ti convince'}</span>
                {existingVote.comment && (
                  <p className="vote-comment">"{existingVote.comment}"</p>
                )}
              </div>
            )}
            <h2>{destination.name}</h2>
            <img src={destination.image} alt={destination.name} />
            <p>{destination.description}</p>

            <div className="itinerary">
              <h3><i className="fas fa-map-marked-alt"></i> Itinerario del viaggio</h3>
              {destination.itinerary.map((day, index) => (
                <div key={index} className="day-item">
                  <h4>{day.day} - {day.title}</h4>
                  <ul>
                    {day.activities.map((activity, actIndex) => (
                      <li key={actIndex}>{activity}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="highlights">
              <h3><i className="fas fa-star"></i> Punti salienti</h3>
              <div className="card-features">
                {destination.highlights.map((highlight, index) => (
                  <span key={index} className="feature">
                    <i className="fas fa-check"></i>
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            <button className="vote-button" onClick={() => setShowVotingModal(true)}>
              <i className="fas fa-vote-yea"></i>
              {existingVote ? 'Cambia voto' : 'Vota questa destinazione'}
            </button>
          </div>
        </div>
      </div>

      {showVotingModal && (
        <VotingModal
          destinationId={destinationId}
          onClose={() => {
            setShowVotingModal(false);
            loadExistingVote();
          }}
        />
      )}
    </>
  );
};

export default DestinationModal;

