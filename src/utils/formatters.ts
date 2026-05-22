const currencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'RON' })
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

export const formatCurrency = (value: number) => currencyFormatter.format(value)

export const formatNumber = (value: number) => numberFormatter.format(value)

export const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split('-')
  return year && monthNumber ? `${monthNumber}-${year}` : month
}
