import { useUnsavedChanges } from '../context/UnsavedChangesContext';
import './SaveBar.css';

function SaveBar() {
  const { saveCallback, discardCallback } = useUnsavedChanges();

  const handleSave = () => {
    if (saveCallback) {
      saveCallback();
    }
  };

  const handleDiscard = () => {
    if (discardCallback) {
      discardCallback();
    }
  };

  return (
    <div className="save-bar">
      <button className="discard-btn" onClick={handleDiscard}>
        Discard
      </button>
      <button className="save-changes-btn" onClick={handleSave}>
        Save
      </button>
    </div>
  );
}

export default SaveBar;
