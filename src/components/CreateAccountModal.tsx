import './CreateAccountModal.css';

interface CreateAccountModalProps {
  email: string;
  password: string;
  onCreateAccount: () => void;
  onCancel: () => void;
}

function CreateAccountModal({ email, password, onCreateAccount, onCancel }: CreateAccountModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Create Account</h3>

        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="confirmEmail">Email</label>
            <input
              id="confirmEmail"
              type="text"
              value={email}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Password</label>
            <input
              id="confirmPassword"
              type="text"
              value={password}
              disabled
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-discard-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-save-btn" onClick={onCreateAccount}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAccountModal;
