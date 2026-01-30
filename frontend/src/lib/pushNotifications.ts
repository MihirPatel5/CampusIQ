
export const pushNotificationManager = {
    requestPermission: async () => {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications')
            return false
        }

        if (Notification.permission === 'granted') {
            return true
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission()
            return permission === 'granted'
        }

        return false
    },

    registerServiceWorker: async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js')
                console.log('Service Worker registered:', registration)
                return registration
            } catch (err) {
                console.error('Service Worker registration failed:', err)
            }
        }
    }
}
