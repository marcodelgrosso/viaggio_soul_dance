import React, { useEffect, useState } from 'react';
import { Destination } from '../types/destinations';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface DestinationCardProps {
  destinationId: string;
  destination: Destination;
  onDestinationClick: (destinationId: string) => void;
  onVoteClick: (destinationId: string, e: React.MouseEvent) => void;
}

const DestinationCard: React.FC<DestinationCardProps> = ({
  destinationId,
  destination,
  onDestinationClick,
  onVoteClick,
}) => {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<any>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserVote();
    }
  }, [user, destinationId]);

  const loadUserVote = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('destination_votes')
        .select('*')
        .eq('destination_id', destinationId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, è normale
        console.error('Errore nel caricamento del voto:', error);
        return;
      }

      if (data) {
        setUserVote(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento del voto:', error);
    }
  };

  const getPriceInfo = () => {
    const prices: { [key: string]: string } = {
      seville: '€75-100',
      london: '€89-120',
      birmingham: '€95-130',
      geneva: '€110-150',
    };
    return prices[destinationId] || 'Da definire';
  };

  const getFlightLinks = () => {
    const links: { [key: string]: string } = {
      seville: 'https://www.skyscanner.it/transport/flights/rome/svq/251206/251208/config/11493-2512062125--31915-0-16628-2512070010%7C16628-2512082050--30596-0-11493-2512082335?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=true&outboundaltsenabled=false&inboundaltsenabled=false&sortby=cheapest',
      london: 'https://www.skyscanner.it/transport/flights/rome/lond/251206/251208/config/10525-2512061405--31915-0-16574-2512061550%7C16574-2512080600--31915-0-10525-2512080945?adultsv2=1&childrenv2=&cabinclass=economy&rtn=1&preferdirects=true&outboundaltsenabled=false&inboundaltsenabled=false',
      birmingham: 'https://www.skyscanner.it/trasporti/voli/rome/birm/251206/251208/config/10525-2512061440--31915-0-9909-2512061615%7C9909-2512080715--32174-0-11493-2512081100?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=1&outboundaltsenabled=false&inboundaltsenabled=false&departure-times=450-1439&preferdirects=true',
      geneva: 'https://www.skyscanner.it/trasporti/voli/rome/gene/251206/251208/config/11493-2512061610--32356-0-12015-2512061745%7C12015-2512080650--32356-0-11493-2512080820?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=true&outboundaltsenabled=false&inboundaltsenabled=false',
    };
    return links[destinationId] || '#';
  };

  const fallbackImage = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZjU1NzZjIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EZXN0aW5hemlvbmU8L3RleHQ+Cjwvc3ZnPg==`;

  return (
    <div className="destination-card" onClick={() => onDestinationClick(destinationId)}>
      <div className="card-image">
        <img
          src={imageError ? fallbackImage : destination.image}
          alt={destination.name}
          onError={() => setImageError(true)}
        />
        <div className="price-badge">
          <div className="price-item">
            <i className="fas fa-plane"></i>
            <span>{getPriceInfo()}</span>
          </div>
        </div>
      </div>
      <div className="card-content">
        {userVote && (
          <div className={`user-vote-badge-card ${userVote.vote_type === 'yes' ? 'vote-yes-card' : 'vote-no-card'}`}>
            <i className={`fas fa-${userVote.vote_type === 'yes' ? 'thumbs-up' : 'thumbs-down'}`}></i>
            <span>Hai votato: {userVote.vote_type === 'yes' ? 'Ti piace' : 'Non ti convince'}</span>
          </div>
        )}
        <h3>{destination.name}</h3>
        <p>{destination.description}</p>
        <div className="card-features">
          {destination.highlights.slice(0, 3).map((highlight, index) => (
            <span key={index} className="feature">
              <i className="fas fa-check"></i>
              {highlight}
            </span>
          ))}
        </div>
        <div className="price-details">
          <div className="price-row">
            <span className="price-label"><i className="fas fa-plane"></i> Volo:</span>
            <span className="price-value">{getPriceInfo()}</span>
          </div>
          <div className="price-row">
            <span className="price-label"><i className="fas fa-bed"></i> Hotel:</span>
            <span className="price-value">Da definire</span>
          </div>
          <div className="price-actions">
            <a
              href={getFlightLinks()}
              target="_blank"
              rel="noopener noreferrer"
              className="flight-details-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fas fa-external-link-alt"></i>
              Vedi dettagli volo
            </a>
          </div>
        </div>
        <div className="card-buttons-container">
          <button className="card-button">
            Scopri il viaggio <i className="fas fa-arrow-right"></i>
          </button>
          <button
            className="card-vote-button"
            onClick={(e) => onVoteClick(destinationId, e)}
          >
            <i className="fas fa-vote-yea"></i>
            Vota questa destinazione
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationCard;


