import { useMemo } from 'react'

export default function useSummary(transactions) {
  return useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income')
    const expenses = transactions.filter((t) => t.type === 'expense')

    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
    const netIncome = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0

    const categoryMap = {}
    expenses.forEach((t) => {
      const name = t.categories?.name ?? 'Other'
      const color = t.categories?.color ?? null
      if (!categoryMap[name]) {
        categoryMap[name] = { category_name: name, category_color: color, total: 0 }
      }
      categoryMap[name].total += Number(t.amount)
    })

    const byCategory = Object.values(categoryMap).sort((a, b) => b.total - a.total)

    return { totalIncome, totalExpense, netIncome, savingsRate, byCategory }
  }, [transactions])
}
