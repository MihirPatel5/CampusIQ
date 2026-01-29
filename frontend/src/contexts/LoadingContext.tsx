import { createContext, useContext, useState, ReactNode } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'

interface LoadingContextType {
    isLoading: boolean
    startLoading: () => void
    stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)
    const [_loadingCount, setLoadingCount] = useState(0)

    const startLoading = () => {
        setLoadingCount((prev) => {
            if (prev === 0) setIsLoading(true)
            return prev + 1
        })
    }

    const stopLoading = () => {
        setLoadingCount((prev) => {
            const newCount = Math.max(0, prev - 1)
            if (newCount === 0) setIsLoading(false)
            return newCount
        })
    }

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {isLoading && <LoadingScreen />}
            {children}
        </LoadingContext.Provider>
    )
}

export function useGlobalLoading() {
    const context = useContext(LoadingContext)
    if (context === undefined) {
        throw new Error('useGlobalLoading must be used within a LoadingProvider')
    }
    return context
}
