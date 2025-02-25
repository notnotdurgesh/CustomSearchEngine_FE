"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useState, useRef, useEffect } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  RotateCw,
  Chrome,
} from "lucide-react"

interface PreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "document" | "image" | "video" | "audio"
  url: string
  title: string
  onDownload?: () => void
}

export function PreviewDialog({ open, onOpenChange, type, url, title, onDownload }: PreviewDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!open) {
      setIsPlaying(false)
      setCurrentTime(0)
      setZoom(1)
      setRotation(0)
    }
  }, [open])

  const handleTimeUpdate = () => {
    const media = videoRef.current || audioRef.current
    if (media) {
      setCurrentTime(media.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    const media = videoRef.current || audioRef.current
    if (media) {
      setDuration(media.duration)
    }
  }

  const togglePlay = () => {
    const media = videoRef.current || audioRef.current
    if (media) {
      if (isPlaying) {
        media.pause()
      } else {
        media.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const media = videoRef.current || audioRef.current
    if (media) {
      const newVolume = value[0]
      media.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    const media = videoRef.current || audioRef.current
    if (media) {
      media.muted = !isMuted
      setIsMuted(!isMuted)
      if (!isMuted) {
        setVolume(0)
      } else {
        setVolume(1)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleZoom = (factor: number) => {
    setZoom(Math.max(0.5, Math.min(3, zoom + factor)))
  }

  const handleRotate = (degrees: number) => {
    setRotation((rotation + degrees) % 360)
  }

  const renderPreview = () => {
    switch (type) {
      case "document":
        return (
          <div className="w-full h-[80vh] bg-white rounded-lg overflow-hidden">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
              className="w-full h-full"
              title={title}
            />
          </div>
        )

      case "image":
        return (
          <div className="relative w-full h-[80vh] bg-black/50 rounded-lg overflow-hidden">
            <img
              src={url || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-contain transition-transform"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full p-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleZoom(-0.1)}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="text-white text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleZoom(0.1)}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-white/20 mx-2" />
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleRotate(-90)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleRotate(90)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case "audio":
      case "video":
        const videoId = url.includes('youtube.com') 
        ? new URL(url).searchParams.get('v') 
        : url.split('/').pop()
      
      return (
        <div className="relative w-full max-w-4xl mx-auto aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            className="w-full h-full rounded-lg"
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
      // case "audio":
      //   const audioId = url.includes('youtube.com') 
      //   ? new URL(url).searchParams.get('v') 
      //   : url.split('/').pop()
      // return (
      //   <div className="w-full max-w-xl mx-auto bg-black/50 rounded-lg p-6">
      //     <div className="relative w-full h-16 overflow-hidden">
      //       <iframe
      //         src={`https://www.youtube.com/embed/${audioId}?autoplay=${isPlaying ? 1 : 0}&controls=1&modestbranding=1&rel=0&iv_load_policy=3`}
      //         className="w-full h-32 absolute -top-16 left-0" // Shift video up to hide it, showing only controls
      //         title={title}
      //         allow="autoplay; encrypted-media"
      //       />
      //     </div>
      //     <div className="flex items-center gap-4 mt-4">
      //       <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={togglePlay}>
      //         {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      //       </Button>
      //       <div className="flex items-center gap-2">
      //         <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleMute}>
      //           {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      //         </Button>
      //         <Slider
      //           value={[volume]}
      //           max={1}
      //           step={0.1}
      //           onValueChange={handleVolumeChange}
      //           className="w-24 [&>span]:h-1 [&>span]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
      //         />
      //       </div>
      //     </div>
      //   </div>
      // )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          {onDownload && (
            <Button variant="outline" onClick={onDownload}>
              <Chrome className="h-4 w-4 mr-2" />
              Go on Web
            </Button>
          )}
        </div>
        {renderPreview()}
      </DialogContent>
    </Dialog>
  )
}

