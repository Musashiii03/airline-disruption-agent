import { Action } from '../../types/api';

interface ActionListProps {
  actions?: Action[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'EXECUTED':
      return '✓';
    case 'ESCALATED':
      return '⚠';
    case 'DENIED':
      return '✗';
    case 'FAILED':
      return '✗';
    case 'REQUESTED':
      return '◌';
    default:
      return '?';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'EXECUTED':
      return 'text-green-600';
    case 'ESCALATED':
      return 'text-yellow-600';
    case 'DENIED':
      return 'text-red-600';
    case 'FAILED':
      return 'text-red-600';
    case 'REQUESTED':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

const formatActionType = (type: string) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const ActionList = ({ actions }: ActionListProps) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Actions</h3>
        <p className="text-gray-500 text-sm">No actions taken yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-semibold text-gray-800 mb-3">Actions</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action.id} className="flex items-start gap-2 text-sm">
            <span className={`font-bold ${getStatusColor(action.status)}`}>{getStatusIcon(action.status)}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{formatActionType(action.actionType)}</p>
              <p className={`text-xs ${getStatusColor(action.status)}`}>{action.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
