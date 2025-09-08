"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Calendar, Shield, Clock, Users } from "lucide-react"
import { AnimatedText } from "./animated-text"

const features = [
  {
    icon: Search,
    title: "Smart Medication Search",
    description: "Find providers who prescribe your specific medications using our intelligent search algorithm.",
    badge: "AI-Powered",
    color: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: MapPin,
    title: "Location-Based Results",
    description: "Discover healthcare providers in your area with accurate distance calculations and directions.",
    badge: "GPS Enabled",
    color: "from-green-500/10 to-emerald-500/10",
  },
  {
    icon: Calendar,
    title: "Real-Time Availability",
    description: "Check provider availability and book appointments directly through our platform.",
    badge: "Live Updates",
    color: "from-purple-500/10 to-violet-500/10",
  },
  {
    icon: Shield,
    title: "Verified Providers",
    description: "All healthcare providers are verified and licensed, ensuring quality care and safety.",
    badge: "Certified",
    color: "from-red-500/10 to-rose-500/10",
  },
  {
    icon: Clock,
    title: "Instant Results",
    description: "Get comprehensive search results in seconds with our optimized database queries.",
    badge: "Fast",
    color: "from-yellow-500/10 to-orange-500/10",
  },
  {
    icon: Users,
    title: "Patient Reviews",
    description: "Read authentic patient reviews and ratings to make informed healthcare decisions.",
    badge: "Community",
    color: "from-indigo-500/10 to-blue-500/10",
  },
]

export function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState<boolean[]>(new Array(features.length).fill(false))
  const [sectionVisible, setSectionVisible] = useState(false)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      sectionObserver.observe(sectionRef.current)
    }

    const observers = cardRefs.current.map((ref, index) => {
      if (!ref) return null

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => {
              const newVisible = [...prev]
              newVisible[index] = true
              return newVisible
            })
          }
        },
        { threshold: 0.2 },
      )

      observer.observe(ref)
      return observer
    })

    return () => {
      sectionObserver.disconnect()
      observers.forEach((observer) => observer?.disconnect())
    }
  }, [])

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-accent/5 to-primary/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="container px-4 relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-playfair text-3xl font-bold md:text-4xl">
              <AnimatedText
                text="Why Choose RX Prescribers?"
                animationType="rotate"
                delay={sectionVisible ? 0 : 1000}
                stagger={80}
              />
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              <AnimatedText
                text="Advanced features designed to connect you with the right healthcare providers"
                animationType="slide"
                delay={sectionVisible ? 600 : 1600}
                stagger={25}
              />
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                ref={(el) => { 
                  cardRefs.current[index] = el 
                }}
                className={`group hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer relative overflow-hidden ${
                  visibleCards[index] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <feature.icon className="h-6 w-6 text-accent transition-all duration-300 group-hover:scale-110" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
                    >
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl transition-colors duration-300 group-hover:text-accent">
                    <AnimatedText
                      text={feature.title}
                      animationType="scale"
                      delay={visibleCards[index] ? 200 : 1200}
                      stagger={40}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
