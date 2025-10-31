import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/components/Modal.scss';

interface AdminVotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminVotesModal: React.FC<AdminVotesModalProps> = ({ isOpen, onClose }) => {
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAllVotes();
    }
  }, [isOpen]);

  const loadAllVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('destination_votes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setVotes(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei voti:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const destinationNames: { [key: string]: string } = {
    'seville': 'Siviglia, Spagna',
    'london': 'Londra, Regno Unito',
    'birmingham': 'Birmingham, Regno Unito',
    'geneva': 'Ginevra, Svizzera',
  };

  const stats: { [key: string]: { total: number; yes: number; no: number } } = {};
  votes.forEach(vote => {
    if (!stats[vote.destination_id]) {
      stats[vote.destination_id] = { total: 0, yes: 0, no: 0 };
    }
    stats[vote.destination_id].total++;
    if (vote.vote_type === 'yes') stats[vote.destination_id].yes++;
    else stats[vote.destination_id].no++;
  });

  return (
    <div className="modal" style={{ display: 'block' }} onClick={onClose}>
      <div className="modal-content admin-votes-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <div className="admin-votes-content">
          <h2><i className="fas fa-chart-bar"></i> Tutte le votazioni</h2>
          {loading ? (
            <p>Caricamento votazioni...</p>
          ) : votes.length === 0 ? (
            <div className="no-votes-message">
              <i className="fas fa-inbox"></i>
              <p>Nessuna votazione ancora registrata.</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📊 Statistiche</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {Object.keys(stats).map(destId => {
                    const stat = stats[destId];
                    const percentage = stat.total > 0 ? Math.round((stat.yes / stat.total) * 100) : 0;
                    return (
                      <div key={destId} style={{ background: 'var(--light-bg)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                          {destinationNames[destId] || destId}
                        </div>
                        <div>✓ Voti positivi: <strong>{stat.yes}</strong></div>
                        <div>✗ Voti negativi: <strong>{stat.no}</strong></div>
                        <div style={{ marginTop: '0.5rem', color: 'var(--text-light)' }}>
                          Totale: <strong>{stat.total}</strong> ({percentage}% positivi)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="votes-table-container">
                <table className="votes-table">
                  <thead>
                    <tr>
                      <th>Utente</th>
                      <th>Destinazione</th>
                      <th>Voto</th>
                      <th>Commento</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {votes.map((vote, index) => (
                      <tr key={index}>
                        <td><strong>{vote.user_email || vote.user_id || 'N/A'}</strong></td>
                        <td>{destinationNames[vote.destination_id] || vote.destination_id}</td>
                        <td className={`vote-type-${vote.vote_type}`}>
                          {vote.vote_type === 'yes' ? 'Ti piace' : 'Non ti convince'}
                        </td>
                        <td className="vote-comment-cell" title={vote.comment || ''}>
                          {vote.comment || '-'}
                        </td>
                        <td>{new Date(vote.created_at).toLocaleDateString('it-IT')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVotesModal;

