'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { AlarmSettings } from '@/components/driver/AlarmSettings'
import { SpotifyConnect } from '@/components/driver/SpotifyConnect'
import { AlarmSounds } from '@/lib/alarm-sounds'

function AccordionItem({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-4 shadow-sm transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-surface-elevated hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-sm font-bold text-foreground">{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="p-5 border-t border-border/50 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

export function ProfileTabClient({
  driverProfile,
  user
}: {
  driverProfile: any
  user: any
}) {
  const [settings, setSettings] = useState({
    alarmEnabled: driverProfile.alarmEnabled,
    alarmTimes: driverProfile.alarmTimes,
    alarmSound: driverProfile.alarmSound,
    alarmVibrate: driverProfile.alarmVibrate,
    spotifyRefreshToken: driverProfile.spotifyRefreshToken
  })

  const triggerTestAlarm = async () => {
    if (settings.alarmSound === 'loud') await AlarmSounds.loud();
    else if (settings.alarmSound === 'urgent') await AlarmSounds.urgent();
    else if (settings.alarmSound === 'gentle') await AlarmSounds.gentle();
    else await AlarmSounds.default();
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      <AccordionItem title="Driver Details" defaultOpen>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Full Name</p>
              <p className="text-sm text-foreground font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Email</p>
              <p className="text-sm text-foreground font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Phone</p>
              <p className="text-sm text-foreground font-medium">{driverProfile.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Status</p>
              <p className="text-sm font-semibold text-green-500">{driverProfile.status}</p>
            </div>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem title="Vehicle Information">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Make & Model</p>
              <p className="text-sm text-foreground font-medium">{driverProfile.carMake} {driverProfile.carModel}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Year</p>
              <p className="text-sm text-foreground font-medium">{driverProfile.carYear}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Color</p>
              <p className="text-sm text-foreground font-medium">{driverProfile.carColor}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Plate Number</p>
              <p className="text-sm font-mono bg-surface-elevated px-2 py-0.5 rounded border border-border inline-block text-foreground">
                {driverProfile.plateNumber}
              </p>
            </div>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem title="App Settings (Alarms & Music)">
        <div className="space-y-8">
          <div className="-mx-5 -my-5">
            {/* Using the existing AlarmSettings component but removing its card styles since we are in an accordion */}
            <div className="p-5 border-b border-border">
              <AlarmSettings 
                driverId={driverProfile.id}
                initialSettings={settings}
                onSave={setSettings}
                onPreviewAlarm={triggerTestAlarm}
              />
            </div>
            <div className="p-5 bg-surface-elevated">
              <SpotifyConnect isConnected={!!settings.spotifyRefreshToken} />
            </div>
          </div>
        </div>
      </AccordionItem>

    </div>
  )
}
