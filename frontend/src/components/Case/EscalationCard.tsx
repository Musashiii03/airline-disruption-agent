import { Escalation } from '../../types/api';

interface EscalationCardProps {
  escalations?: Escalation[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'border-red-500 bg-red-50';
    case 'HIGH':
      return 'border-yellow-500 bg-yellow-50';
    case 'NORMAL':
      return 'border-blue-500 bg-blue-50';
    default:
      return 'border-gray-500 bg-gray-50';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'text-red-600';
    case 'IN_PROGRESS':
      return 'text-yellow-600';
    case 'RESOLVED':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

export const EscalationCard = ({ escalations }: EscalationCardProps) => {
  if (!escalations || escalations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {escalations.map((escalation) => (
        <div key={escalation.id} className={`border-l-4 rounded p-3 ${getPriorityColor(escalation.priority)}`}>
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-gray-900">Supervisor Approval Required</h4>
            <span className={`text-xs font-medium ${getStatusColor(escalation.status)}`}>{escalation.status}</span>
          </div>
          <p className="text-sm text-gray-700 mb-1">{escalation.reason}</p>
          <p className="text-xs text-gray-600">Priority: {escalation.priority}</p>
        </div>
      ))}
    </div>
  );
};
