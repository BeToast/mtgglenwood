import { useState, useEffect } from 'react';
import { type Period } from '../utils/periodCalculator';
import './PeriodFormModal.css';

interface PeriodFormModalProps {
  period: Period | null;
  onSave: (periodData: Omit<Period, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

function PeriodFormModal({ period, onSave, onCancel }: PeriodFormModalProps) {
  const [weekday, setWeekday] = useState(period?.weekday ?? 2);
  const [hour, setHour] = useState(period?.hour ?? 17);
  const [minute, setMinute] = useState(period?.minute ?? 0);
  const [matchesPerPlayer, setMatchesPerPlayer] = useState(period?.matchesPerPlayer ?? 3);
  const [error, setError] = useState('');

  useEffect(() => {
    if (period) {
      setWeekday(period.weekday);
      setHour(period.hour);
      setMinute(period.minute);
      setMatchesPerPlayer(period.matchesPerPlayer);
    }
  }, [period]);

  const handleSave = () => {
    // Validation
    if (hour < 0 || hour > 23) {
      setError('Hour must be between 0 and 23');
      return;
    }

    if (minute < 0 || minute > 59) {
      setError('Minute must be between 0 and 59');
      return;
    }

    if (matchesPerPlayer < 1 || matchesPerPlayer > 100) {
      setError('Matches per player must be between 1 and 100');
      return;
    }

    onSave({
      weekday,
      hour,
      minute,
      matchesPerPlayer,
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h3>{period ? 'Edit Period' : 'Create Period'}</h3>

        <div className="modal-form">
          <div className="form-field">
            <label>Day of Week</label>
            <div className="weekday-selector-list">
              {WEEKDAYS.map((day) => (
                <div
                  key={day.value}
                  className={`weekday-selector-item ${weekday === day.value ? 'selected' : ''}`}
                  onClick={() => setWeekday(day.value)}
                >
                  {day.label}
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="hour">Hour (0-23)</label>
              <input
                id="hour"
                type="number"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
              />
            </div>

            <div className="form-field">
              <label htmlFor="minute">Minute (0-59)</label>
              <input
                id="minute"
                type="number"
                min="0"
                max="59"
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="matchesPerPlayer">Matches Per Player</label>
            <input
              id="matchesPerPlayer"
              type="number"
              min="1"
              max="100"
              value={matchesPerPlayer}
              onChange={(e) => setMatchesPerPlayer(Number(e.target.value))}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="time-preview">
            <strong>Time (MST):</strong>{' '}
            {WEEKDAYS[weekday].label} {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-discard-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-save-btn" onClick={handleSave}>
            {period ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PeriodFormModal;
