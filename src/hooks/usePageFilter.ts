import React from 'react'
import { useLocation } from 'react-router-dom'
import { RoleContext } from '../contexts/RoleContext'

const matchesShape = (value: unknown, fallback: unknown): boolean => {
  if (fallback === null) return value === null || typeof value === 'string'
  if (Array.isArray(fallback)) return Array.isArray(value)
  if (typeof fallback === 'object') return typeof value === 'object' && value !== null
    && Object.entries(fallback).every(([key, item]) => matchesShape((value as Record<string, unknown>)[key], item))
  return typeof value === typeof fallback && (typeof value !== 'number' || Number.isFinite(value))
}

/** Remember filter controls per user, role, route and control, within this browser tab. */
export function usePageFilter<T>(name: string, initialValue: T | (() => T), initialOverride?: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { account, role, accountsLoading, isAuthenticated } = React.useContext(RoleContext)
  const { pathname } = useLocation()
  const storageKey = JSON.stringify(['page-filters-v1', account.id, role, pathname, name])
  const [fallback] = React.useState<T>(() => typeof initialValue === 'function'
    ? (initialValue as () => T)() : initialValue)
  const overrideKey = initialOverride === undefined ? null : JSON.stringify(initialOverride) ?? null
  const stateKey = JSON.stringify([storageKey, overrideKey])
  const restored = React.useMemo(() => {
    if (overrideKey !== null) return JSON.parse(overrideKey) as T
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw !== null) {
        const value: unknown = JSON.parse(raw)
        if (matchesShape(value, fallback)) return value as T
      }
    } catch { /* Disabled storage and obsolete/corrupt entries use defaults. */ }
    return fallback
  }, [storageKey, fallback, overrideKey])
  const [state, setState] = React.useState(() => ({ key: stateKey, value: restored }))
  const value = state.key === stateKey ? state.value : restored
  const setValue = React.useCallback<React.Dispatch<React.SetStateAction<T>>>((next) => {
    setState(previous => ({ key: stateKey, value: typeof next === 'function'
      ? (next as (value: T) => T)(previous.key === stateKey ? previous.value : restored) : next }))
  }, [stateKey, restored])
  React.useEffect(() => {
    if (accountsLoading || !isAuthenticated) return
    try { sessionStorage.setItem(storageKey, JSON.stringify(value)) }
    catch { /* Filters continue to work in memory when storage is unavailable. */ }
  }, [storageKey, value, accountsLoading, isAuthenticated])
  return [value, setValue]
}
