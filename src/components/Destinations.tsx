import React, { useState } from 'react';
import { destinations } from '../types/destinations';
import DestinationCard from './DestinationCard';
import DestinationModal from './DestinationModal';
import VotingModal from './VotingModal';
import { useAuth } from '../context/AuthContext';
import '../styles/components/Destinations.scss';

const Destinations: React.FC = () => {
  const { user } = useAuth();
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [votingDestination, setVotingDestination] = useState<string | null>(null);

  const handleDestinationClick = (destinationId: string) => {
    if (!user) {
      return;
    }
    setSelectedDestination(destinationId);
    setShowDestinationModal(true);
  };

  const handleVoteClick = (destinationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      return;
    }
    setVotingDestination(destinationId);
    setShowVotingModal(true);
  };

  const destinationIds = ['seville', 'london', 'birmingham', 'geneva'];

  return (
    <>
      <section id="destinations" className="destinations">
        <div className="container">
          <h2>Le nostre destinazioni</h2>
          <p className="section-subtitle">Scegli la tua prossima avventura</p>

          <div className="destinations-grid">
            {destinationIds.map((destId) => {
              const destination = destinations[destId];
              return (
                <DestinationCard
                  key={destId}
                  destinationId={destId}
                  destination={destination}
                  onDestinationClick={handleDestinationClick}
                  onVoteClick={handleVoteClick}
                />
              );
            })}
          </div>
        </div>
      </section>

      {showDestinationModal && selectedDestination && (
        <DestinationModal
          destinationId={selectedDestination}
          onClose={() => {
            setShowDestinationModal(false);
            setSelectedDestination(null);
          }}
        />
      )}

      {showVotingModal && votingDestination && (
        <VotingModal
          destinationId={votingDestination}
          onClose={() => {
            setShowVotingModal(false);
            setVotingDestination(null);
          }}
        />
      )}
    </>
  );
};

export default Destinations;


