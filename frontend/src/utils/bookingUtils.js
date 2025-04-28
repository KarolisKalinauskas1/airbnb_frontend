/**
 * Booking utilities to help with data normalization across the application
 */

/**
 * Normalize booking data to ensure consistent format
 * @param {Object} booking - The booking object to normalize
 * @returns {Object} Normalized booking object
 */
export const normalizeBooking = (booking) => {
  if (!booking) return null;
  
  return {
    booking_id: booking.booking_id || booking.id || 0,
    start_date: booking.start_date || null,
    end_date: booking.end_date || null,
    cost: booking.cost || booking.price || 0,
    number_of_guests: booking.number_of_guests || booking.guests || 1,
    status_id: getStatusId(booking),
    camping_spot: booking.camping_spot || booking.campingSpot || booking.spot || {},
    ...booking
  };
};

/**
 * Get a consistent status ID from various booking formats
 * @param {Object} booking - The booking object
 * @returns {number} The status ID (1-5)
 */
export const getStatusId = (booking) => {
  if (booking.status_id) return booking.status_id;
  
  if (booking.status) {
    const status = booking.status.toUpperCase();
    if (status === 'CONFIRMED') return 2;
    if (status === 'CANCELLED') return 3;
    if (status === 'COMPLETED') return 4;
    if (status === 'UNAVAILABLE') return 5;
    if (status === 'PENDING') return 1;
  }
  
  if (booking.status_booking_transaction?.status) {
    const status = booking.status_booking_transaction.status.toUpperCase();
    if (status === 'CONFIRMED') return 2;
    if (status === 'CANCELLED') return 3;
    if (status === 'COMPLETED') return 4;
    if (status === 'UNAVAILABLE') return 5;
    if (status === 'PENDING') return 1;
  }
  
  return 1; // Default to pending
};

/**
 * Format a date in a consistent way
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a date range and include nights count
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  return `${formatDate(start)} - ${formatDate(end)} · ${days} night${days !== 1 ? 's' : ''}`;
};

/**
 * Format a price value
 * @param {number|string} price - The price to format
 * @returns {string} Formatted price with 2 decimal places
 */
export const formatPrice = (price) => {
  if (!price) return '0.00';
  return parseFloat(price).toFixed(2);
};

/**
 * Categorize bookings into upcoming and previous
 * @param {Array} bookings - Array of booking objects
 * @returns {Object} Object with upcoming and previous booking arrays
 */
export const categorizeBookings = (bookings) => {
  if (!bookings || !Array.isArray(bookings)) return { upcoming: [], previous: [] };
  
  const now = new Date();
  const normalized = bookings.map(normalizeBooking).filter(b => b !== null);
  
  const upcoming = normalized.filter(booking => {
    const startDate = new Date(booking.start_date);
    return startDate > now && booking.status_id === 2; // Only confirmed future bookings
  });
  
  const previous = normalized.filter(booking => {
    const endDate = new Date(booking.end_date);
    return booking.status_id === 3 || booking.status_id === 4 || endDate <= now;
  });
  
  // Sort by date - upcoming in ascending order, previous in descending order
  upcoming.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  previous.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  
  return { upcoming, previous };
};
