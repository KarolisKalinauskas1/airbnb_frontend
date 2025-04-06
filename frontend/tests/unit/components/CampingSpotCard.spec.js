import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import CampingSpotCard from '@/components/CampingSpotCard.vue'
import { createRouter, createWebHistory } from 'vue-router'

describe('CampingSpotCard.vue', () => {
  let router;

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/camper/:id', component: { template: '<div>Camper</div>' } }
      ]
    })
  })

  // Test data
  const mockSpot = {
    camping_spot_id: 1,
    title: 'Test Camping Spot',
    price_per_night: 100,
    description: 'A lovely camping spot',
    images: [{ image_url: 'image1.jpg' }],
    max_guests: 4,
    location: {
      city: 'Test City',
      country: { name: 'Test Country' }
    },
    camping_spot_amenities: [
      { amenity: { name: 'WiFi' } }
    ]
  }

  it('renders spot details correctly', () => {
    const wrapper = mount(CampingSpotCard, {
      props: {
        spot: mockSpot
      },
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain(mockSpot.title)
    expect(wrapper.text()).toContain(mockSpot.price_per_night)
    expect(wrapper.text()).toContain(mockSpot.location.city)
  })

  it('has correct router link', () => {
    const wrapper = mount(CampingSpotCard, {
      props: {
        spot: mockSpot
      },
      global: {
        plugins: [router]
      }
    })

    const routerLink = wrapper.find('RouterLink') // Changed from 'router-link' to 'RouterLink'
    expect(routerLink.exists()).toBe(true)
    expect(routerLink.attributes('to')).toBe(`/camper/${mockSpot.camping_spot_id}`)
  })
})
