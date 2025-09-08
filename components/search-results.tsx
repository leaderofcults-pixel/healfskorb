"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Lock, Zap, Eye, Check, Star } from "@/lib/simple-icons"
import type { Prescriber, SearchResponse } from "@/lib/api"

interface SearchResultsProps {
  results: SearchResponse | null
  isLoading: boolean
  loadingMessage?: string
  onUpgradeToPremium: () => void
}

interface PricingTier {
  name: string
  price: number
  period: string
  features: string[]
  searchLimit: number | null
  multiDrug: boolean
  multiZipcode: boolean
  controlledSubstances: boolean
  originalPrice?: number
}

type PricingTiers = Record<'freemium' | 'basic' | 'premium' | 'annual', PricingTier>

const PRICING_TIERS: PricingTiers = {
  freemium: {
    name: "Free",
    price: 0,
    period: "forever",
    features: ["Non-controlled substances only", "Single zipcode search", "No radius expansion", "Basic provider info"],
    searchLimit: null,
    multiDrug: false,
    multiZipcode: false,
    controlledSubstances: false,
  },
  basic: {
    name: "Basic",
    price: 9.99,
    period: "month",
    features: ["Single drug searches", "All substance types", "5 searches per month", "Standard API access"],
    searchLimit: 5,
    multiDrug: false,
    multiZipcode: false,
    controlledSubstances: true,
  },
  premium: {
    name: "Premium",
    price: 19.99,
    period: "month",
    features: ["Multiple drugs simultaneously", "Multiple zipcode searches", "Unlimited searches", "Priority support"],
    searchLimit: null,
    multiDrug: true,
    multiZipcode: true,
    controlledSubstances: true,
  },
  annual: {
    name: "Annual Premium",
    price: 199.99,
    period: "year",
    originalPrice: 239.88,
    features: ["Everything in Premium", "2 months free", "Priority customer support", "Early access to new features"],
    searchLimit: null,
    multiDrug: true,
    multiZipcode: true,
    controlledSubstances: true,
  },
}

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

const PayPalButtonsComponent = ({
  onSuccess,
  onError,
  onCancel,
  selectedTier = "basic",
}: {
  onSuccess: () => void
  onError: () => void
  onCancel: () => void
  selectedTier?: keyof typeof PRICING_TIERS
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const tier = PRICING_TIERS[selectedTier]

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || (typeof window !== "undefined" && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_PAYPAL_CLIENT_ID)

  if (!clientId) {
    return (
      <div className="text-center p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600 mb-2">PayPal is not configured</p>
        <Button
          onClick={onSuccess}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Continue with Free Trial
        </Button>
      </div>
    )
  }

  return (
    <PayPalScriptProvider options={{ clientId: clientId, currency: "USD" }}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={async () => {
          const response = await fetch("/api/paypal/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: [{ name: `RX Prescribers ${tier.name}`, price: tier.price, qty: 1 }] }),
          })
          const data = await response.json()
          return data.id
        }}
        onApprove={async (data: any, actions: any) => {
          try {
            const response = await fetch(`/api/paypal/orders/${data.orderID}/capture`, { method: "POST" })
            const details = await response.json()
            onSuccess()
          } catch (err) {
            onError()
          }
        }}
        onError={(err: any) => onError()}
        onCancel={() => onCancel()}
      />
    </PayPalScriptProvider>
  )
}

const PricingModal = ({
  isOpen,
  onClose,
  onSelectTier,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectTier: (tier: keyof typeof PRICING_TIERS) => void
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Choose Your Plan</CardTitle>
          <p className="text-center text-muted-foreground">
            Select the plan that best fits your prescriber search needs
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(PRICING_TIERS).map(([key, tier]) => (
              <Card
                key={key}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  key === "premium" ? "border-purple-500 ring-2 ring-purple-200" : ""
                }`}
                onClick={() => onSelectTier(key as keyof typeof PRICING_TIERS)}
              >
                {key === "premium" && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      ${tier.price}
                      {tier.price > 0 && <span className="text-sm font-normal">/{tier.period}</span>}
                    </div>
                    {tier.originalPrice && (
                      <div className="text-sm text-muted-foreground line-through">${tier.originalPrice}/year</div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      key === "freemium"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : key === "premium"
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {key === "freemium" ? "Current Plan" : "Select Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function SearchResults({ results, isLoading, loadingMessage, onUpgradeToPremium }: SearchResultsProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<keyof typeof PRICING_TIERS>("basic")

  const handleUpgradeClick = useCallback(() => {
    setShowPricingModal(true)
    onUpgradeToPremium()
  }, [onUpgradeToPremium])

  const handleSelectTier = useCallback((tier: keyof typeof PRICING_TIERS) => {
    setSelectedTier(tier)
    setShowPricingModal(false)
    if (tier !== "freemium") {
      setShowUpgradeModal(true)
    }
  }, [])

  const PayPalUpgradeModal = useMemo(() => {
    if (!showUpgradeModal) return null

    const tier = PRICING_TIERS[selectedTier]

    const handleSuccess = () => {
      setShowUpgradeModal(false)
      alert(`Payment successful! You now have ${tier.name} access.`)
      window.location.reload()
    }

    const handleError = () => {
      alert("Payment processing failed. Please try again.")
    }

    const handleCancel = () => {
      // Modal stays open on cancel
    }

    const handleClose = () => {
      setShowUpgradeModal(false)
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md relative">
          <CardHeader>
            <CardTitle className="text-center">Upgrade to {tier.name}</CardTitle>
            <p className="text-center text-muted-foreground">{tier.features.join(", ")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold">${tier.price}</p>
              <p className="text-sm text-muted-foreground">
                {tier.period === "forever" ? "Free forever" : `per ${tier.period}`}
              </p>
              {tier.originalPrice && (
                <p className="text-sm text-green-600">Save ${(tier.originalPrice - tier.price).toFixed(2)}!</p>
              )}
            </div>

            <div className="w-full min-h-[120px] flex items-center justify-center">
              <div className="w-full max-w-[300px]">
                <PayPalButtonsComponent
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onCancel={handleCancel}
                  selectedTier={selectedTier}
                />
              </div>
            </div>

            <Button variant="outline" onClick={handleClose} className="w-full bg-transparent">
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }, [showUpgradeModal, selectedTier])

  const isFreemiumRestricted = (prescriber: Prescriber) => {
    // In freemium, hide controlled substances
    return prescriber.drug.controlled_substance
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">{loadingMessage || "Searching our database of 825K+ providers..."}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-auto max-w-2xl">
          <p className="text-sm text-blue-800 text-center">
            <strong>Did you know?</strong> Each prescriber's prescribing history is vetted and given a score for how
            much experience the prescriber has with your medication, known as % Match
          </p>
        </div>
      </div>
    )
  }

  if (!results) {
    return null
  }

  const filteredPrescribers = results.is_premium
    ? results.prescribers
    : results.prescribers.filter((p) => !isFreemiumRestricted(p))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search Results</h2>
          <p className="text-muted-foreground">
            Found {filteredPrescribers.length} providers in {results.search_location.city},{" "}
            {results.search_location.state} {results.search_location.zip}
            {!results.is_premium && results.prescribers.length > filteredPrescribers.length && (
              <span className="text-orange-600 ml-2">
                ({results.prescribers.length - filteredPrescribers.length} controlled substance providers hidden -
                upgrade to view)
              </span>
            )}
          </p>
        </div>

        {!results.is_premium && (
          <Button
            onClick={handleUpgradeClick}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            View Plans
          </Button>
        )}
      </div>

      {!results.is_premium && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-purple-900">Unlock Premium Features</h3>
                  <p className="text-sm text-purple-700">
                    Multiple drugs, unlimited searches, controlled substances, and full provider details
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUpgradeClick}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100 bg-transparent"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredPrescribers.map((prescriber) => (
          <PrescriberCard
            key={prescriber.npi}
            prescriber={prescriber}
            isPremium={results.is_premium ?? false}
            onUpgrade={handleUpgradeClick}
          />
        ))}
      </div>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectTier={handleSelectTier}
      />
      {PayPalUpgradeModal}
    </div>
  )
}

interface PrescriberCardProps {
  prescriber: Prescriber
  isPremium: boolean
  onUpgrade: () => void
}

function PrescriberCard({ prescriber, isPremium, onUpgrade }: PrescriberCardProps) {
  const getMatchPercentage = (claims: number): number => {
    if (claims < 10) return 25
    if (claims < 20) return 50
    if (claims < 50) return 75
    return 100
  }

  const matchPercentage = getMatchPercentage(prescriber.total_claims)

  const BlurredText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    if (isPremium) {
      return <span className={className}>{children}</span>
    }

    return (
      <span className={`${className} relative`}>
        <span className="blur-sm select-none">{children}</span>
        <Lock className="absolute inset-0 w-3 h-3 text-muted-foreground m-auto" />
      </span>
    )
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${!isPremium ? "relative" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {isPremium ? prescriber.name : <BlurredText>{prescriber.name}</BlurredText>}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{prescriber.specialty}</p>
          </div>

          <div className="text-right space-y-1">
            <Badge variant="secondary" className="text-xs">
              {prescriber.address.city} • {prescriber.distance_miles} miles
            </Badge>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  matchPercentage >= 75 ? "bg-green-500" : matchPercentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                }`}
              ></div>
              <p className="text-xs text-green-600 font-medium">{matchPercentage}% Match</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            {isPremium ? (
              <>
                <p>{prescriber.address.street}</p>
                <p>
                  {prescriber.address.city}, {prescriber.address.state} {prescriber.address.zip}
                </p>
              </>
            ) : (
              <BlurredText>
                <p>{prescriber.address.street}</p>
                <p>
                  {prescriber.address.city}, {prescriber.address.state} {prescriber.address.zip}
                </p>
              </BlurredText>
            )}
          </div>
        </div>

        {prescriber.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <BlurredText className="text-sm">{prescriber.phone}</BlurredText>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Prescription Information</h4>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Brand Name:</span> {prescriber.drug.brand_name}
            </p>
            <p className="text-sm">
              <span className="font-medium">Therapeutic Class:</span> {prescriber.drug.therapeutic_class}
            </p>
            {prescriber.drug.controlled_substance && (
              <Badge variant="destructive" className="text-xs">
                Controlled Substance
              </Badge>
            )}
          </div>
        </div>

        {!isPremium && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock Full Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
