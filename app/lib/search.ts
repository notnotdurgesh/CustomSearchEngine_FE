import type { SearchResult } from "../types"

// Simulated search index
const searchIndex: SearchResult[] = [
  {
    id: "1",
    type: "document",
    title: "Advanced AI Research Paper.pdf",
    preview: "/placeholder.svg?height=200&width=200",
    size: "2.5 MB",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    url: "#",
    content: "This research paper discusses advanced AI techniques...",
    metadata: {
      author: "Dr. Smith",
      pages: "42",
      format: "PDF",
    },
  },
  {
    id: "2",
    type: "image",
    title: "Data Visualization Chart.png",
    preview: "/placeholder.svg?height=200&width=200",
    size: "1.8 MB",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    url: "#",
    metadata: {
      dimensions: "1920x1080",
      format: "PNG",
    },
  },
  {
    id: "3",
    type: "video",
    title: "Machine Learning Tutorial.mp4",
    preview: "/placeholder.svg?height=200&width=200",
    size: "45.2 MB",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    url: "#",
    metadata: {
      duration: "15:30",
      resolution: "1080p",
    },
  },
  // Add more mock data here
]

export async function searchDocuments(query: string, filters: string[], sortBy: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  let results = [...searchIndex]

  // Apply search
  if (query) {
    const searchTerms = query.toLowerCase().split(" ")
    results = results.filter((result) =>
      searchTerms.every(
        (term) =>
          result.title.toLowerCase().includes(term) ||
          result.content?.toLowerCase().includes(term) ||
          Object.values(result.metadata || {}).some((value) => value.toLowerCase().includes(term)),
      ),
    )
  }

  // Apply filters
  if (filters.length > 0) {
    results = results.filter((result) => {
      return filters.some((filter) => {
        if (filter.startsWith("Size:")) {
          const size = Number.parseInt(filter.split(":")[1])
          const resultSize = Number.parseFloat(result.size)
          return resultSize <= size
        }
        return (
          result.type.toLowerCase() === filter.toLowerCase() ||
          filter.includes(new Date(result.date).toLocaleDateString())
        )
      })
    })
  }

  // Apply sorting
  switch (sortBy) {
    case "date":
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      break
    case "size":
      results.sort((a, b) => Number.parseFloat(b.size) - Number.parseFloat(a.size))
      break
    default: // relevance - already sorted by default in our mock data
      break
  }

  return results
}

export function getSuggestions(query: string): string[] {
  const commonQueries = [
    "research papers",
    "data visualization",
    "machine learning",
    "artificial intelligence",
    "neural networks",
    "deep learning",
    "computer vision",
    "natural language processing",
  ]

  if (!query) return []

  return commonQueries
    .filter((q) => q.toLowerCase().includes(query.toLowerCase()))
    .map((q) => q.charAt(0).toUpperCase() + q.slice(1))
    .slice(0, 5)
}

