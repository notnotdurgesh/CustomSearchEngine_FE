import type { UserPreferences } from "../types"

const RECENT_SEARCHES_KEY = "recent-searches"
const SAVED_SEARCHES_KEY = "saved-searches"
const USER_PREFERENCES_KEY = "user-preferences"

export const storage = {
  getRecentSearches(): string[] {
    if (typeof window === "undefined") return []
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY)
    return searches ? JSON.parse(searches) : []
  },

  addRecentSearch(query: string) {
    if (typeof window === "undefined") return
    const searches = this.getRecentSearches()
    const newSearches = [query, ...searches.filter((s) => s !== query)].slice(0, 10)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches))
  },

  getSavedSearches(): string[] {
    if (typeof window === "undefined") return []
    const searches = localStorage.getItem(SAVED_SEARCHES_KEY)
    return searches ? JSON.parse(searches) : []
  },

  toggleSavedSearch(query: string): boolean {
    if (typeof window === "undefined") return false
    const searches = this.getSavedSearches()
    const isAlreadySaved = searches.includes(query)

    if (isAlreadySaved) {
      const newSearches = searches.filter((s) => s !== query)
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSearches))
      return false
    } else {
      const newSearches = [...searches, query]
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSearches))
      return true
    }
  },

  getUserPreferences(): UserPreferences {
    if (typeof window === "undefined") return defaultPreferences
    const prefs = localStorage.getItem(USER_PREFERENCES_KEY)
    return prefs ? JSON.parse(prefs) : defaultPreferences
  },

  setUserPreferences(preferences: UserPreferences) {
    if (typeof window === "undefined") return
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences))
  },
}

const defaultPreferences: UserPreferences = {
  safeSearch: true,
  searchSuggestions: true,
  saveHistory: true,
  theme: "system",
  compactView: false,
}

