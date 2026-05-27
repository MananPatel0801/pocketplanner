import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

export default function useTransactions(month) {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user || !month) return
    setLoading(true)
    const [y, m] = month.split('-').map(Number)
    const start = `${month}-01`
    const next = new Date(y, m, 1) // first day of next month
    const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`

    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name, color)')
      .eq('user_id', user.id)
      .gte('date', start)
      .lt('date', end)
      .order('date', { ascending: false })

    setTransactions(data ?? [])
    setLoading(false)
  }, [user, month])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { transactions, loading, refetch }
}
