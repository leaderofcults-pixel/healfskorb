import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Database, Users, Award } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <div className="container px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold md:text-5xl">About RX Prescribers</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Connecting patients with healthcare providers who have experience prescribing their medications
            </p>
          </div>

          <div className="mt-16 mx-auto max-w-3xl">
            <div className="prose prose-lg mx-auto">
              <p className="text-muted-foreground">
                RX Prescribers was created to solve a critical problem in healthcare: helping patients find providers
                who have real experience prescribing their specific medications. Our platform leverages a comprehensive
                database of prescription records to match patients with the most qualified healthcare providers.
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Comprehensive Data</h3>
                <p className="text-muted-foreground">
                  3 million prescription records from 200,000+ verified healthcare providers
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">HIPAA Compliant</h3>
                <p className="text-muted-foreground">
                  All data is handled with the highest security standards and privacy protection
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Providers</h3>
                <p className="text-muted-foreground">
                  Every healthcare provider in our database is verified and licensed
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Experience-Based</h3>
                <p className="text-muted-foreground">
                  Our % Match system shows provider experience with specific medications
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-8">Our Mission</h2>
            <div className="prose prose-lg mx-auto text-center">
              <p className="text-muted-foreground">
                We believe that finding the right healthcare provider shouldn&apos;t be a guessing game. By providing
                transparent data about provider experience with specific medications, we empower patients to make
                informed decisions about their healthcare and connect with providers who truly understand their patients&apos; needs.
              </p>
            </div>
          </div>

          <div className="mt-16 mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-8">Why It Matters</h2>
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Better Patient Outcomes</h3>
                <p className="text-muted-foreground">
                  When patients see providers with experience in their specific medications, they receive more informed
                  care and better treatment outcomes.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Reduced Healthcare Costs</h3>
                <p className="text-muted-foreground">
                  Finding the right provider the first time reduces unnecessary visits, tests, and medication changes.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Improved Access</h3>
                <p className="text-muted-foreground">
                  Our platform helps patients discover qualified providers they might not have found otherwise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
