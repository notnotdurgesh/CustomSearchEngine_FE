"use client"

import { useState, useEffect } from "react";
import { AutoSizer, List } from 'react-virtualized';
import {
  Search,
  ImageIcon,
  FileText,
  Music,
  Video,
  X,
  Command,
  Sparkles,
  Grid,
  Mic,
  History,
  Star,
  MoveUpRight,
  SlidersHorizontal,
  ChevronDown,
  Settings,
  Keyboard,
  List as ListIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useSearch } from "./hooks/use-search"
import { useVoiceSearch } from "./hooks/use-voice-search"
import { storage } from "./lib/storage"
import type { UserPreferences } from "./types"
import { SearchResult } from "./components/search-result"
import AIThinkingWebSocket from "./components/WebSocketNotifications";
import { debounce } from 'lodash';

const BACKEND_URL = process.env.NEXT_PUBLIC_BEURL || "http://localhost:4400"

export default function NextGenSearch() {
  const search = useSearch()
  const { isListening, startListening } = useVoiceSearch()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<string[]>([])
  const [preferences, setPreferences] = useState<UserPreferences>(storage.getUserPreferences())
  const [currentTab, setCurrentTab] = useState("all")
  const [isFocused, setIsFocused] = useState(false)
  const tabToType: any = {
    all: "all",
    documents: "document",
    images: "image",
    videos: "video",
    audio: "audio",
  }

  const debouncedFetchSuggestions = debounce((query: string) => {
    if (!query || query.length < 2 || !preferences.searchSuggestions || !isFocused) {
      setSuggestions([]);
      return;
    }
  
    fetch(`${BACKEND_URL}/api/suggestions?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setSuggestions(data.slice(0, 5)))
      .catch((error) => {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      });
  }, 300); // adjust delay (300ms) as needed
  

  useEffect(() => {
    if (preferences.searchSuggestions) {
      debouncedFetchSuggestions(search.query);
    } else {
      setSuggestions([]);
    }
    // Cleanup debounced call on unmount or when query changes
    return () => {
      debouncedFetchSuggestions.cancel();
    };
  }, [search.query, preferences.searchSuggestions, isFocused]);
  
  // Update search type when tab changes
  useEffect(() => {
    search.setSearchType(tabToType[currentTab])
  }, [currentTab, search.setSearchType])

  // Load saved data on mount
  useEffect(() => {
    setRecentSearches(storage.getRecentSearches())
    setSavedSearches(storage.getSavedSearches())
  }, [])

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    search.setQuery(suggestion);
    setSuggestions([]); // Clear suggestions immediately
    search.performSearch(); // Trigger search
  };

  // Handle preference changes
  const updatePreference = (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    storage.setUserPreferences(newPreferences)
    toast.success("Preferences updated")
  }

  // Handle voice search
  const handleVoiceSearch = () => {
    startListening((transcript) => {
      search.setQuery(transcript)
    })
  }

  // Handle save search
  const handleSaveSearch = (query: string) => {
    const isSaved = storage.toggleSavedSearch(query)
    setSavedSearches(storage.getSavedSearches())
    toast.success(isSaved ? "Search saved" : "Search removed from saved")
  }

  // Handle export
  const handleExport = async (format: "csv" | "pdf") => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const filename = `search-results-${new Date().toISOString().split("T")[0]}.${format}`
      const content = search.results.map((r) => `${r.title},${r.type},${r.size},${r.date}`).join("\n")
      const blob = new Blob([content], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Results exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`)
    }
  }

  const rowRenderer = ({ index, key, style }: { index: any, key: any, style: any }) => (
    <div key={key} style={style}>
      <SearchResult {...search.results[index]} view={search.view} />
    </div>
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        document.getElementById("search-input")?.focus()
      }
      if (e.key === "v" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        search.setView(search.view === "grid" ? "list" : "grid")
      }
    }
    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [search.view, search.setView])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-red-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header with Settings */}
        <div className="flex justify-end mb-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Search Preferences</SheetTitle>
                <SheetDescription>Customize your search experience</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-8">
                <div className="flex items-center justify-between">
                  <span>Safe Search</span>
                  <Switch
                    checked={preferences.safeSearch}
                    onCheckedChange={(checked) => updatePreference("safeSearch", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Search Suggestions</span>
                  <Switch
                    checked={preferences.searchSuggestions}
                    onCheckedChange={(checked) => updatePreference("searchSuggestions", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Save Search History</span>
                  <Switch
                    checked={preferences.saveHistory}
                    onCheckedChange={(checked) => updatePreference("saveHistory", checked)}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Hero Search Section */}
        <div className="flex flex-col items-center gap-8 py-12">
          <div className="flex items-center gap-3 text-white mb-3 z-10">
            <Sparkles className="h-8 w-8" />
            <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 via-green-400 to-red-400 bg-clip-text text-transparent">
              ASSE Search
            </h1>
          </div>

          {/* Search Bar with Voice and Shortcuts */}
          <div className="w-full max-w-4xl z-30">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative flex gap-2 p-1 bg-black/40 backdrop-blur-xl rounded-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
                  <Input
                    id="search-input"
                    className="pl-12 h-12 text-lg bg-transparent border-0 ring-0 focus-visible:ring-0 text-white placeholder:text-white/70"
                    placeholder="Search anything... (⌘ + /)"
                    value={search.query}
                    onChange={(e) => search.setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        search.performSearch();
                        setSuggestions([]); // Clear suggestions on Enter
                      }
                    }}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl rounded-lg border border-white/10 overflow-hidden z-[1000] max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition-all duration-150 flex items-center gap-2"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <Search className="h-4 w-4 opacity-50" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`text-white/70 hover:text-white hover:bg-white/10 ${isListening ? "animate-pulse text-red-400" : ""}`}
                  onClick={handleVoiceSearch}
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                  disabled={search.isLoading}
                  onClick={() => {
                    search.performSearch();
                    setSuggestions([]); // Clear suggestions on search button click
                  }}
                >
                  <Command className="h-5 w-5 mr-2" />
                  {search.isLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  <Keyboard className="h-4 w-4 mr-2" />
                  Shortcuts
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Keyboard Shortcuts</DialogTitle>
                  <DialogDescription>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex justify-between">
                        <span>Focus Search</span>
                        <kbd className="px-2 py-1 bg-muted rounded">⌘ + /</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Toggle View</span>
                        <kbd className="px-2 py-1 bg-muted rounded">⌘ + V</kbd>
                      </div>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  <History className="h-4 w-4 mr-2" />
                  Recent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recent Searches</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {recentSearches.map((query, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <button className="text-left hover:underline" onClick={() => search.setQuery(query)}>
                        {query}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => handleSaveSearch(query)}>
                        <Star className={`h-4 w-4 ${savedSearches.includes(query) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  <Star className="h-4 w-4 mr-2" />
                  Saved
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Saved Searches</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {savedSearches.map((query, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <button className="text-left hover:underline" onClick={() => search.setQuery(query)}>
                        {query}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => handleSaveSearch(query)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active Filters */}
          {search.filters.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {search.filters.map((filter) => (
                <Badge
                  key={filter}
                  className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm px-3 py-1 gap-2"
                >
                  {filter}
                  <button onClick={() => search.toggleFilter(filter)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
                onClick={search.clearFilters}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-[240px_1fr] gap-6 mt-8">
          {/* Filters Sidebar */}
          <div className="hidden md:block space-y-6 bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-white/90 font-semibold">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
                onClick={search.clearFilters}
              >
                Reset
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-white/90 font-semibold">Content Type</h3>
              <div className="space-y-1">
                {[
                  { icon: FileText, label: "Documents" },
                  { icon: ImageIcon, label: "Images" },
                  { icon: Video, label: "Videos" },
                  { icon: Music, label: "Audio" },
                ].map(({ icon: Icon, label }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    className={`w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10 ${search.filters.includes(label) ? "bg-white/10" : ""}`}
                    onClick={() => search.toggleFilter(label)}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Button>
                ))}
              </div>
            </div>

            {["all", "document"].includes(search.searchType) && (
              <div className="space-y-2">
                <h3 className="text-white/90 font-semibold">File Type</h3>
                <div className="space-y-1">
                  {["PDF", "DOC", "TXT", "PPT"].map((fileType) => (
                    <Button
                      key={fileType}
                      variant="ghost"
                      className={`w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10 ${search.filters.includes(`filetype:${fileType.toLowerCase()}`) ? "bg-white/10" : ""}`}
                      onClick={() => search.toggleFilter(`filetype:${fileType.toLowerCase()}`)}
                    >
                      {fileType}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-white/90 font-semibold">Time Range</h3>
              <div className="space-y-1">
                {["Last 24 hours", "Past week", "Past month", "Past year"].map((range) => (
                  <Button
                    key={range}
                    variant="ghost"
                    className={`w-full justify-start text-white/70 hover:text-white hover:bg-white/10 ${search.filters.includes(range) ? "bg-white/10" : ""}`}
                    onClick={() => search.toggleFilter(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-white/90 font-semibold">Advanced Filters</h3>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    const dialog = document.createElement("dialog")
                    dialog.innerHTML = `
                      <div class="p-4">
                        <h3 class="text-lg font-bold">Advanced Search Syntax</h3>
                        <ul class="mt-2 space-y-1">
                          <li>"exact phrase"</li>
                          <li>-exclude</li>
                          <li>site:example.com</li>
                          <li>filetype:pdf</li>
                        </ul>
                      </div>
                    `
                    document.body.appendChild(dialog)
                    dialog.showModal()
                  }}
                >
                  Advanced Search Syntax
                </Button>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-white/70">{search.results.length.toLocaleString()} results</span>
                <span className="text-white/70">({search.isLoading ? "Searching..." : null})</span>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Sort by: {search.sortBy}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => search.setSortBy("relevance")}>Relevance</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => search.setSortBy("date")}>Date</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => search.setSortBy("size")}>Size</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`text-white/70 hover:text-white ${search.view === "grid" ? "bg-white/10" : ""}`}
                    onClick={() => search.setView("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`text-white/70 hover:text-white ${search.view === "list" ? "bg-white/10" : ""}`}
                    onClick={() => search.setView("list")}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                      <MoveUpRight className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>Export as PDF</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="bg-white/5 border-b border-white/10 w-full justify-start rounded-none p-0 h-auto">
                {["All", "Documents", "Images", "Videos", "Audio"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase()}
                    className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-none border-b-2 border-transparent data-[state=active]:border-white px-4 py-2"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="mt-6">
              {search.isLoading ? (
                <div className="flex items-center justify-center h-64">Loading...</div>
              ) : search.error ? (
                <div className="text-center text-white/70">{search.error}</div>
              ) : search.results.length === 0 ? (
                <div className="text-center text-white/70">No results found</div>
              ) : search.view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {search.results.map(result => (
                    <SearchResult key={result.id} {...result} view={search.view} />
                  ))}
                </div>
              ) : (
                <div style={{ height: "500px" }}>
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        width={width}
                        height={height}
                        rowCount={search.results.length}
                        rowHeight={100}
                        rowRenderer={rowRenderer}
                      />
                    )}
                  </AutoSizer>
                </div>
              )}
              {search.results.length > 0 && (
                <Button onClick={search.nextPage} className="mt-4">Load More</Button>
              )}
            </div>
          </div>
        </div>
        <AIThinkingWebSocket />
      </div>
    </div>
  )
}