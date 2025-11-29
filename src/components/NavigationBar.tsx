import { useUnsavedChanges } from '../context/UnsavedChangesContext';
import BottomNav from './BottomNav';
import SaveBar from './SaveBar';

function NavigationBar() {
  const { hasUnsavedChanges } = useUnsavedChanges();

  return hasUnsavedChanges ? <SaveBar /> : <BottomNav />;
}

export default NavigationBar;
