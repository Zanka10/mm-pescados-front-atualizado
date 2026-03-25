export const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const formatPhone = (value: string) => {
  const cleanPhone = value.replace(/\D/g, '')
  if (cleanPhone.length === 0) return ''
  
  let formatted = `(${cleanPhone.slice(0, 2)}`
  if (cleanPhone.length > 2) formatted += `) ${cleanPhone.slice(2, 7)}`
  if (cleanPhone.length > 7) formatted += `-${cleanPhone.slice(7, 11)}`
  return formatted
}

export const formatCep = (value: string) => {
  const cleanCep = value.replace(/\D/g, '')
  if (cleanCep.length > 5) return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5, 8)}`
  return cleanCep
}

export const formatDate = (ts: number) => {
  return new Date(ts).toLocaleDateString('pt-BR')
}

export const formatTime = (ts: number) => {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
