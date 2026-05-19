import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const today = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM = {
  amount: '',
  type: 'expense',
  category_id: '',
  description: '',
  date: today(),
}

export default function Transactions() {
  const { user } = useAuthStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .or(`is_system.eq.true,user_id.eq.${user.id}`)
      .order('name')
    setCategories(data ?? [])
  }, [user.id])

  const fetchTransactions = useCallback(async () => {
    const { data } = await supabase
      .from('transactions')
      .select('id, date, description, amount, type, categories(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setTransactions(data ?? [])
  }, [user.id])

  useEffect(() => {
    fetchCategories()
    fetchTransactions()
  }, [fetchCategories, fetchTransactions])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError('Amount must be greater than 0.')
      return
    }
    if (!form.category_id) {
      setFormError('Please select a category.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount: Number(form.amount),
      type: form.type,
      category_id: form.category_id,
      description: form.description || null,
      date: form.date,
    })
    setSubmitting(false)
    if (error) {
      setFormError(error.message)
    } else {
      setForm({ ...EMPTY_FORM, date: today() })
      fetchTransactions()
    }
  }

  async function handleDelete(id) {
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>

        {/* Add transaction form */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add transaction</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Amount */}
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setField('amount', e.target.value)}
              required
            />

            {/* Type toggle */}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Type</span>
              <div className="flex gap-2">
                {['expense', 'income'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setField('type', t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                      ${form.type === t
                        ? t === 'income'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setField('category_id', e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <Input
              label="Description (optional)"
              type="text"
              placeholder="e.g. Coffee with friends"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />

            {/* Date */}
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              required
            />

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <Button type="submit" disabled={submitting} className="w-full justify-center">
              {submitting ? 'Adding…' : 'Add transaction'}
            </Button>
          </form>
        </Card>

        {/* Transaction list */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">History</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No transactions yet. Add one above.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {tx.description || tx.categories?.name || '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.date} · {tx.categories?.name}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-2"
                    aria-label="Delete transaction"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
