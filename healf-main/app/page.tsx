"use client"

import { useState, useEffect } from "react"
import { SearchInterface } from "../components/search-interface"
import { SonarMap } from "../components/sonar-map"
import { PrescriberResults } from "../components/prescriber-results"
import { MolecularBackground } from "../components/molecular-background"
import type { PrescriberResult } from "@/lib/db/queries"

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<PrescriberResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPrescriber, setSelectedPrescriber] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
          // Default to New York City if geolocation fails
          setUserLocation({ lat: 40.7128, lng: -74.006 })
        },
      )
    } else {
      // Default location if geolocation not supported
      setUserLocation({ lat: 40.7128, lng: -74.006 })
    }
  }, [])

  const handleSearch = async (pharmaName: string, radius = 25) => {
    if (!userLocation || !pharmaName.trim()) return

    setIsSearching(true)
    setSearchQuery(pharmaName)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmaName,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius,
        }),
      })

      if (!response.ok) throw new Error("Search failed")

      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error("[v0] Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MolecularBackground />

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header with search */}
        <header className="p-6 border-b border-border/20 backdrop-blur-sm bg-background/80">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground text-balance">PharmaConnect</h1>
                <p className="text-muted-foreground text-pretty">
                  Discover prescribers with revolutionary sonar pulse technology
                </p>
              </div>
            </div>

            <SearchInterface onSearch={handleSearch} isSearching={isSearching} userLocation={userLocation} />
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex">
          {/* Map area */}
          <div className="flex-1 relative">
            <SonarMap
              userLocation={userLocation}
              prescribers={searchResults}
              selectedPrescriber={selectedPrescriber}
              onPrescriberSelect={setSelectedPrescriber}
              isSearching={isSearching}
              searchQuery={searchQuery}
            />
          </div>

          {/* Results sidebar */}
          {searchResults.length > 0 && (
            <div className="w-96 border-l border-border/20 bg-card/50 backdrop-blur-sm">
              <PrescriberResults
                results={searchResults}
                selectedPrescriber={selectedPrescriber}
                onPrescriberSelect={setSelectedPrescriber}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
