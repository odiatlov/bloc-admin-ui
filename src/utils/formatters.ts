const currencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'RON' })
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
const percentFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, style: 'percent' })

export const formatCurrency = (value: number) => currencyFormatter.format(value)

export const formatNumber = (value: number) => numberFormatter.format(value)

export const formatPercent = (value: number) => percentFormatter.format(value / 100)

export const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split('-')
  return year && monthNumber ? `${monthNumber}-${year}` : month
}
