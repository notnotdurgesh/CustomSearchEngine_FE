"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

export function useVoiceSearch() {
  const [isListening, setIsListening] = useState(false)

  const startListening = useCallback((onResult: (transcript: string) => void) => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Voice search is not supported in your browser")
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      toast.info("Listening...")
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
      setIsListening(false)
      toast.success("Voice input received")
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
      toast.error("Failed to recognize voice input")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [])

  return {
    isListening,
    startListening,
  }
}

