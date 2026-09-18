import { CaseSnapshot } from '../../types/api';
import { CustomerCard } from './CustomerCard';
import { BookingCard } from './BookingCard';
import { CaseStatus } from './CaseStatus';
import { ActionList } from './ActionList';
import { EscalationCard } from './EscalationCard';
import { ActivityTimeline } from './ActivityTimeline';

interface CasePanelProps {
  caseSnapshot?: CaseSnapshot | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CasePanel = ({ caseSnapshot, isOpen = true, onClose }: CasePanelProps) => {
  if (!isOpen) return null;

  if (!caseSnapshot) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Case Information</h2>
        <p className="text-gray-500">Start a conversation to see case details</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Case Information</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-blue-100 text-xl"
            aria-label="Close case panel"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        <CustomerCard customer={caseSnapshot.customer} />
        <BookingCard booking={caseSnapshot.booking} />
        <CaseStatus status={caseSnapshot.status} />
        <ActionList actions={caseSnapshot.actions} />
        {caseSnapshot.escalations && caseSnapshot.escalations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Escalation</h3>
            <EscalationCard escalations={caseSnapshot.escalations} />
          </div>
        )}
        <ActivityTimeline events={caseSnapshot.auditEvents} />
      </div>
    </div>
  );
};
