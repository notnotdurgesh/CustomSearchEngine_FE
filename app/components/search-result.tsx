"use client"

import { useState } from "react"
import { Search, Chrome, FileText, ImageIcon, Video, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { PreviewDialog } from "./preview-dialog"

interface SearchResultProps {
  id: string
  type: "document" | "image" | "video" | "audio"
  title: string
  preview: string
  size: string
  date: string
  url: string
  view: "grid" | "list" | "compact"
}

export function SearchResult({ type, title, preview, size, date, view, url }: SearchResultProps) {
  const [showPreview, setShowPreview] = useState(false)

  const icons = {
    document: FileText,
    image: ImageIcon,
    video: Video,
    audio: Music,
  }
  const Icon = icons[type]

  const handlePreview = () => {
    setShowPreview(true)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = url
    link.download = title
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Starting download...")
  }

  if (view === "grid") {
    return (
      <>
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:scale-102 hover:bg-white/10">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                onClick={handlePreview}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                onClick={handleDownload}
              >
                <Chrome className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div 
            className="aspect-square overflow-hidden"
            onClick={handlePreview}
          >
            <img
              src={preview || "/placeholder.svg"}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-white">
              <Icon className="h-4 w-4 text-white/70" />
              <h3 className="font-medium">{title}</h3>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
              <span>{size}</span>
              <span>•</span>
              <span>{new Date(date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <PreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          type={type}
          url={url}
          title={title}
          onDownload={handleDownload}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 transition-all hover:bg-white/10">
        <div className="h-16 w-16 overflow-hidden rounded-lg">
          <img src={preview || "/placeholder.svg"} alt={title} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-white">
            <Icon className="h-4 w-4 text-white/70" />
            <h3 className="font-medium">{title}</h3>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
            <span>{size}</span>
            <span>•</span>
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={handlePreview}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleDownload}
          >
            <Chrome className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <PreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        type={type}
        url={url}
        title={title}
        onDownload={handleDownload}
      />
    </>
  )
}

