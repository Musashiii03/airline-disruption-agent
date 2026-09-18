import { Booking } from '../../types/api';

interface BookingCardProps {
  booking?: Booking;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'DELAYED':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const BookingCard = ({ booking }: BookingCardProps) => {
  if (!booking) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Booking</h3>
        <p className="text-gray-500 text-sm">Not available</p>
      </div>
    );
  }

  const primarySegment = booking.segments?.[0];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-semibold text-gray-800 mb-3">Booking</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">PNR:</span>
          <p className="text-gray-900 font-mono">{booking.pnr}</p>
        </div>
        {primarySegment && (
          <>
            <div>
              <span className="text-gray-600">Flight:</span>
              <p className="text-gray-900 font-medium">{primarySegment.flightNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Route:</span>
              <p className="text-gray-900">
                {primarySegment.departure} → {primarySegment.arrival}
              </p>
            </div>
            {primarySegment.delayHours !== undefined && primarySegment.delayHours > 0 && (
              <div>
                <span className="text-gray-600">Delay:</span>
                <p className="text-red-600 font-medium">{primarySegment.delayHours} hours</p>
              </div>
            )}
          </>
        )}
        <div>
          <span className="text-gray-600">Status:</span>
          <p className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(booking.status)}`}>
            {booking.status}
          </p>
        </div>
      </div>
    </div>
  );
};
