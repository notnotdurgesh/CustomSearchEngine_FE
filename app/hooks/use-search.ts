"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { SearchState } from "../types"
import { storage } from "../lib/storage"
import { toast } from "sonner"

const initialState: SearchState = {
  query: "",
  searchType: "all",
  filters: [],
  sortBy: "relevance",
  view: "grid",
  results: [],
  isLoading: false,
  error: null,
  page: 1,
  nextPageToken: null,
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BEURL || "http://localhost:4400"

export function useSearch() {
  const [state, setState] = useState<SearchState>(initialState)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastSearchParams = useRef<string>("")

  // Create a unique key for search parameters to prevent duplicate requests
  const getSearchKey = useCallback(() => {
    return `${state.query}:${state.searchType}:${state.filters.join(',')}:${state.sortBy}:${state.page}`
  }, [state.query, state.searchType, state.filters, state.sortBy, state.page])

  const performSearch = useCallback(async () => {
    const currentSearchKey = getSearchKey()
    if (!state.query && state.filters.length === 0) {
      setState((prev) => ({ ...prev, results: [], isLoading: false }))
      return
    }

    // Prevent duplicate searches
    if (currentSearchKey === lastSearchParams.current) {
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const params = new URLSearchParams({
        q: state.query,
        type: state.searchType,
        filters: state.filters.join(' '),
        sortBy: state.sortBy,
        page: state.page.toString(),
        pageToken: state.nextPageToken || '',
      })

      const response = await fetch(`${BACKEND_URL}/api/search?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Search failed')

      setState((prev) => ({
        ...prev,
        results: state.page === 1 ? data.results : [...prev.results, ...data.results],
        nextPageToken: data.nextPageToken || null,
        isLoading: false,
      }))

      lastSearchParams.current = currentSearchKey

      if (state.query) {
        storage.addRecentSearch(state.query)
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to perform search. Please try again.',
      }))
      toast.error(error.message || 'Search failed. Please try again.')
    }
  }, [state.query, state.searchType, state.filters, state.sortBy, state.page, state.nextPageToken, getSearchKey])

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      performSearch()
    }, 500)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [state.query, state.searchType, state.filters, state.sortBy, state.page, performSearch])

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query, page: 1, nextPageToken: null }))
  }, [])

  const setSearchType = useCallback((searchType: string) => {
    setState((prev) => ({ ...prev, searchType, page: 1, nextPageToken: null }))
  }, [])

  const toggleFilter = useCallback((filter: string) => {
    setState((prev) => ({
      ...prev,
      filters: prev.filters.includes(filter) 
        ? prev.filters.filter((f) => f !== filter) 
        : [...prev.filters, filter],
      page: 1,
      nextPageToken: null,
    }))
  }, [])

  const setSortBy = useCallback((sortBy: string) => {
    setState((prev) => ({ ...prev, sortBy, page: 1, nextPageToken: null }))
  }, [])

  const setView = useCallback((view: "grid" | "list" | "compact") => {
    setState((prev) => ({ ...prev, view }))
  }, [])

  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: [], page: 1, nextPageToken: null }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
    lastSearchParams.current = ""
  }, [])

  const nextPage = useCallback(() => {
    setState((prev) => ({ ...prev, page: prev.page + 1 }))
  }, [])

  return {
    ...state,
    setQuery,
    setSearchType,
    toggleFilter,
    setSortBy,
    setView,
    clearFilters,
    reset,
    nextPage,
    performSearch
  }
}