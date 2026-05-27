import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import useTransactions from '../hooks/useTransactions'
import useSummary from '../hooks/useSummary'
import Card from '../components/ui/Card'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const FALLBACK_COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4',
]

const cad = (val) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val)

function currentMonthStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1)
  )
}

function shiftMonth(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonthStr)
  const { transactions, loading } = useTransactions(month)
  const { totalIncome, totalExpense, netIncome, savingsRate, byCategory } = useSummary(transactions)

  const summaryCards = [
    { label: 'Total Income', value: cad(totalIncome), color: 'text-green-500' },
    { label: 'Total Expenses', value: cad(totalExpense), color: 'text-red-500' },
    { label: 'Net Income', value: cad(netIncome), color: netIncome >= 0 ? 'text-indigo-600' : 'text-red-500' },
    { label: 'Savings Rate', value: `${Math.round(savingsRate)}%`, color: 'text-indigo-600' },
  ]

  const doughnutData = {
    labels: byCategory.map((c) => c.category_name),
    datasets: [
      {
        data: byCategory.map((c) => c.total),
        backgroundColor: byCategory.map(
          (c, i) => c.category_color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
        ),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${cad(ctx.raw)}` } } },
  }

  const barData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderRadius: 6,
        barThickness: 56,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        ticks: { callback: (val) => cad(val) },
        grid: { color: '#f3f4f6' },
        border: { display: false },
      },
      x: { grid: { display: false }, border: { display: false } },
    },
  }

  const recent = transactions.slice(0, 5)

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 text-lg transition-colors"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-700 w-32 text-center">
              {formatMonthLabel(month)}
            </span>
            <button
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 text-lg transition-colors"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(({ label, value, color }) => (
            <Card key={label} className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doughnut — Spending by Category */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Spending by Category</h2>
            {byCategory.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                No expense data this month
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full" style={{ height: '180px' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-sm font-bold text-gray-800">{cad(totalExpense)}</p>
                  </div>
                </div>
                <ul className="w-full flex flex-col gap-1.5">
                  {byCategory.map((c, i) => (
                    <li key={c.category_name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              c.category_color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                          }}
                        />
                        <span className="text-gray-600">{c.category_name}</span>
                      </span>
                      <span className="font-semibold text-gray-700 tabular-nums">
                        {cad(c.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Bar — Income vs Expenses */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Income vs Expenses</h2>
            <Bar data={barData} options={barOptions} />
          </Card>
        </div>

        {/* Recent transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="text-xs text-indigo-500 hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No transactions this month.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((tx) => (
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
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {cad(Number(tx.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
