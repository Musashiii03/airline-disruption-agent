interface CaseStatusProps {
  status?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'WAITING_FOR_CUSTOMER':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'ESCALATED':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const CaseStatus = ({ status = 'ACTIVE' }: CaseStatusProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-semibold text-gray-800 mb-2">Case Status</h3>
      <div className={`inline-block px-3 py-2 rounded-lg border font-medium text-sm ${getStatusColor(status)}`}>
        {status}
      </div>
    </div>
  );
};
