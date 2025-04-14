import axios from '@/axios'

export const debugHelper = {
  async testBookingEndpoint() {
    console.log('Testing booking endpoint...')
    
    try {
      // Test basic connection
      const testResponse = await axios.post('/api/bookings/test-connection', {
        test: true,
        timestamp: new Date().toISOString()
      })
      
      console.log('Basic API connection:', testResponse.data)
      
      // Create a minimal booking request to test
      const minimalBooking = {
        camping_spot_id: 1,
        user_id: 1,
        start_date: '2025-07-01',
        end_date: '2025-07-03',
        number_of_guests: 2,
        base_price: '200.00',
        service_fee: '20.00',
        total_amount: '220.00'
      }
      
      try {
        const bookingResponse = await axios.post('/api/bookings/create-checkout-session', minimalBooking)
        console.log('Booking endpoint response:', bookingResponse.data)
        return {
          success: true,
          testResult: testResponse.data,
          bookingResult: bookingResponse.data
        }
      } catch (bookingError) {
        console.error('Booking endpoint error:', bookingError)
        return {
          success: false,
          testResult: testResponse.data,
          bookingError: {
            status: bookingError.response?.status,
            data: bookingError.response?.data,
            message: bookingError.message
          }
        }
      }
    } catch (error) {
      console.error('Test connection error:', error)
      return {
        success: false,
        error: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        }
      }
    }
  }
}
