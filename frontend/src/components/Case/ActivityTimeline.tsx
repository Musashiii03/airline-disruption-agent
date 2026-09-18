import { AuditEvent } from '../../types/api';

interface ActivityTimelineProps {
  events?: AuditEvent[];
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'CONVERSATION_STARTED':
      return '💬';
    case 'CUSTOMER_IDENTIFIED':
      return '👤';
    case 'POLICY_DECISION':
      return '⚖️';
    case 'ACTION_EXECUTION':
      return '✓';
    case 'ESCALATION_CREATED':
      return '⚠️';
    default:
      return '•';
  }
};

const formatEventType = (type: string) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const ActivityTimeline = ({ events }: ActivityTimelineProps) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Activity</h3>
        <p className="text-gray-500 text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Activity</h3>
      <div className="space-y-3">
        {events.map((event, idx) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="text-lg">{getEventIcon(event.eventType)}</div>
              {idx < events.length - 1 && <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>}
            </div>
            <div className="flex-1 pb-2">
              <p className="font-medium text-sm text-gray-900">{formatEventType(event.eventType)}</p>
              <p className="text-xs text-gray-600">
                {new Date(event.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
