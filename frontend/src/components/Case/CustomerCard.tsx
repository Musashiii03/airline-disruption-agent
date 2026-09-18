import { Customer } from '../../types/api';

interface CustomerCardProps {
  customer?: Customer;
}

export const CustomerCard = ({ customer }: CustomerCardProps) => {
  if (!customer) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Customer</h3>
        <p className="text-gray-500 text-sm">Not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-semibold text-gray-800 mb-3">Customer</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Name:</span>
          <p className="text-gray-900 font-medium">{customer.name}</p>
        </div>
        <div>
          <span className="text-gray-600">PNR:</span>
          <p className="text-gray-900 font-mono">{customer.pnr}</p>
        </div>
        {customer.loyaltyTier && (
          <div>
            <span className="text-gray-600">Loyalty Tier:</span>
            <p className="text-gray-900">{customer.loyaltyTier}</p>
          </div>
        )}
        {customer.contactEmail && (
          <div>
            <span className="text-gray-600">Email:</span>
            <p className="text-blue-600 text-xs">{customer.contactEmail}</p>
          </div>
        )}
      </div>
    </div>
  );
};
