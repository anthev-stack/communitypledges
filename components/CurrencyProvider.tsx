'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { getCurrencyFromCountry, convertFromUSD, convertToUSD, formatCurrency, getCurrencySymbol } from '@/lib/currency'

interface CurrencyContextType {
  currency: string
  symbol: string
  convertFromUSD: (amountUSD: number) => number
  convertToUSD: (amount: number) => number
  formatPrice: (amountUSD: number, showCode?: boolean) => string
  isLoading: boolean
  refreshCurrency: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  symbol: '$',
  convertFromUSD: (amountUSD: number) => amountUSD,
  convertToUSD: (amount: number) => amount,
  formatPrice: (amountUSD: number) => `$${amountUSD.toFixed(2)}`,
  isLoading: true,
  refreshCurrency: async () => {},
})

export function useCurrency() {
  return useContext(CurrencyContext)
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [currency, setCurrency] = useState('USD')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserCurrency = async () => {
      if (status === 'loading') {
        return
      }

      if (status === 'authenticated' && session?.user?.id) {
        try {
          const response = await fetch('/api/user/me')
          if (response.ok) {
            const userData = await response.json()
            if (userData.country) {
              const userCurrency = getCurrencyFromCountry(userData.country)
              setCurrency(userCurrency)
            } else {
              setCurrency('USD')
            }
          }
        } catch (error) {
          console.error('Failed to fetch user currency:', error)
        }
      } else {
        // Not logged in, use USD
        setCurrency('USD')
      }
      
      setIsLoading(false)
    }

    fetchUserCurrency()
  }, [session, status])

  const refreshCurrency = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setCurrency('USD')
      return
    }

    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const userData = await response.json()
        if (userData.country) {
          setCurrency(getCurrencyFromCountry(userData.country))
        } else {
          setCurrency('USD')
        }
      }
    } catch (error) {
      console.error('Failed to refresh user currency:', error)
    }
  }

  const symbol = getCurrencySymbol(currency)

  const convertFromUSDFunc = (amountUSD: number) => {
    return convertFromUSD(amountUSD, currency)
  }

  const convertToUSDFunc = (amount: number) => {
    return convertToUSD(amount, currency)
  }

  const formatPrice = (amountUSD: number, showCode = false) => {
    const converted = convertFromUSD(amountUSD, currency)
    return formatCurrency(converted, currency, showCode)
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol,
        convertFromUSD: convertFromUSDFunc,
        convertToUSD: convertToUSDFunc,
        formatPrice,
        isLoading,
        refreshCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}




