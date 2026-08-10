'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Car, CheckCircle, SlidersHorizontal } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { BookingProgress } from '@/components/booking-progress'
import { SkeletonDriverCard } from '@/components/shared/SkeletonVariants'

const DRIVERS = [
  { id: 1, name: 'Emeka Nwosu', rating: 4.9, trips: 312, vehicle: 'Toyota Corolla (Sedan)', verified: true, available: true },
  { id: 2, name: 'Kofi Mensah', rating: 4.8, trips: 204, vehicle: 'Honda Fit (Hatchback)', verified: true, available: true },
  { id: 3, name: 'Amina Suleiman', rating: 4.7, trips: 165, vehicle: 'Hyundai Tucson (SUV)', verified: true, available: true },
  { id: 4, name: 'David Osei', rating: 4.6, trips: 98, vehicle: 'Kia Rio (Sedan)', verified: true, available: true },
  { id: 5, name: 'Fatima Al-Hassan', rating: 4.8, trips: 277, vehicle: 'Toyota RAV4 (SUV)', verified: true, available: false },
  { id: 6, name: 'Yaw Boateng', rating: 4.5, trips: 54, vehicle: 'Honda Civic (Sedan)', verified: true, available: true },
]


export default function DriversPage() {
  const [sort, setSort] = useState('rating')
  const [selected, setSelected] = useState<number | null>(null)
  const [loading] = useState(false)

  const sorted = [...DRIVERS].sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating
    if (sort === 'trips') return b.trips - a.trips
    return 0
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <BookingProgress currentStep={2} />

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-secondary">Available Drivers</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Showing {DRIVERS.filter((d) => d.available).length} drivers for your route
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <Select value={sort} onValueChange={(val) => val && setSort(val)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="trips">Most Trips</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Driver cards */}
          <div className="space-y-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonDriverCard key={i} />)
              : sorted.map((driver) => (
                  <div
                    key={driver.id}
                    className={`bg-surface-elevated border rounded-2xl p-5 transition-all ${
                      selected === driver.id
                        ? 'border-purple-brand ring-1 ring-purple-brand'
                        : 'border-border-default hover:border-purple-brand/40'
                    } ${!driver.available ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar with overlap badge */}
                      <div className="relative shrink-0">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback
                            className="text-sm font-bold"
                            style={{ background: 'var(--surface-card)', color: 'var(--text-secondary)' }}
                          >
                            {driver.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {driver.verified && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-status-success border-2 border-surface-elevated">
                            <CheckCircle className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <h3 className="font-bold text-text-primary text-base">{driver.name}</h3>
                          {!driver.available && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm bg-status-neutral/10 text-status-neutral border border-status-neutral/20">
                              Unavailable
                            </span>
                          )}
                        </div>

                        {/* Dense data rows */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">Rating</p>
                            <p className="text-sm font-medium flex items-center gap-1.5 text-text-primary">
                              <Star className="w-3.5 h-3.5 fill-orange-brand text-orange-brand" />
                              {driver.rating}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">Trips</p>
                            <p className="text-sm font-medium text-text-primary">
                              {driver.trips.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">Vehicle</p>
                            <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-text-muted" />
                              {driver.vehicle}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-subtle">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">
                        1 Drop Booking Fee
                      </p>
                      {selected === driver.id ? (
                        <Link 
                          href="/book/confirm"
                          className={buttonVariants({ 
                            size: "sm", 
                            className: "bg-purple-brand hover:bg-purple-brand/90 text-white font-semibold rounded-lg h-8 px-4" 
                          })}
                        >
                          Continue →
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border-default text-text-secondary hover:text-white hover:border-purple-brand/40 bg-surface-card rounded-lg h-8 px-4"
                          onClick={() => setSelected(driver.id)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
          </div>

          {/* Empty state */}
          {!loading && sorted.filter((d) => d.available).length === 0 && (
            <div className="text-center py-16">
              <Car className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-secondary">No drivers available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different date or time — new drivers join daily.
              </p>
              <Link 
                href="/book" 
                className={buttonVariants({ 
                  className: "mt-5 bg-primary hover:bg-primary/90 text-white" 
                })}
              >
                Change Trip Details
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
