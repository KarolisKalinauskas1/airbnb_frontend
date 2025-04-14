import axios from '@/axios'

export const stripeDebugger = {
  /**
   * Test connection to the backend
   */
  async testConnection() {
    try {
      const { data } = await axios.post('/api/bookings/test-connection', {
        testField: 'Test value',
        timestamp: new Date().toISOString()
      })
      console.log('Connection test result:', data)
      return data
    } catch (error) {
      console.error('Connection test error:', error)
      return { error: error.message }
    }
  },
  
  /**
   * Test creating a minimal checkout session
   */
  async testCheckoutSession() {
    try {
      // Create a minimal test booking for a day in the future
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      
      const testBooking = {
        camper_id: 1, // Use a valid camping spot ID
        user_id: 1,   // Use a valid user ID
        start_date: tomorrow.toISOString().split('T')[0],
        end_date: dayAfterTomorrow.toISOString().split('T')[0],
        number_of_guests: 1,
        cost: '100.00',
        service_fee: '10.00',
        total: '110.00',
        spot_name: 'Test Spot',
        spot_image: 'https://via.placeholder.com/150'
      }
      
      console.log('Testing checkout session with data:', testBooking)
      
      const { data } = await axios.post('/api/bookings/create-checkout-session', testBooking)
      console.log('Checkout session result:', data)
      return data
    } catch (error) {
      console.error('Checkout session test error:', error)
      return { 
        error: error.message,
        response: error.response?.data
      }
    }
  }
}
