import api from './api'
import { Event } from '@/types'

export const eventService = {
    getEvents: async () => {
        const response = await api.get('/core/events/')
        return response.data
    },

    createEvent: async (data: Partial<Event>) => {
        const response = await api.post('/core/events/', data)
        return response.data
    },

    deleteEvent: async (id: number) => {
        const response = await api.delete(`/core/events/${id}/`)
        return response.data
    },

    subscribeToPush: async (subscription: PushSubscription, browser: string, deviceType: string) => {
        const subJson = subscription.toJSON()
        const payload = {
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
            browser,
            device_type: deviceType
        }
        const response = await api.post('/core/push-subscriptions/', payload)
        return response.data
    }
}
