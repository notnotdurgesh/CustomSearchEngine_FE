export interface SearchResult {
    id: string
    type: "document" | "image" | "video" | "audio"
    title: string
    preview: string
    size: string
    date: string
    url: string
    content?: string
    metadata?: {
      [key: string]: string
    }
  }
  
  export interface SearchState {
    query: string
    filters: string[]
    sortBy: string
    view: "grid" | "list" | "compact"
    results: SearchResult[]
    isLoading: boolean
    error: string | null
    page?: any
    nextPageToken?: any
    searchType: string;
  }
  
  export interface UserPreferences {
    safeSearch: boolean
    searchSuggestions: boolean
    saveHistory: boolean
    theme: "light" | "dark" | "system"
    compactView: boolean
  }
  
  