import re

with open('app/driver/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the separated lists definitions
old_requests = "const requests = pendingTrips.filter((t: any) => !declined.includes(t.id))"
new_requests = '''const requests = pendingTrips.filter((t: any) => !declined.includes(t.id))
  const instantReqs = requests.filter((r: any) => !r.isScheduled)
  const scheduledReqs = requests.filter((r: any) => r.isScheduled)

  const instantConfirmed = confirmedTrips.filter((t: any) => !t.isScheduled)
  const scheduledConfirmed = confirmedTrips.filter((t: any) => t.isScheduled)'''

content = content.replace(old_requests, new_requests)

# We will create helper renderers right before the return statement:
old_return = "return (\n    <div style={{ background: '#111111', minHeight: '100vh' }}>"

helper_functions = '''
  const renderRequestSection = (reqs: any[], title: string, emptyMsg: string) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>
          {title}
        </p>
        {reqs.length > 0 && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5"
            style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--orange-brand)', borderRadius: '4px' }}
          >
            {reqs.length} new
          </span>
        )}
      </div>

      {reqs.length === 0 ? (
        <div
          className="rounded-lg"
          style={{ background: '#171717', border: '1px dashed #222', padding: '20px' }}
        >
          <Car className="w-4 h-4 mb-2" style={{ color: '#333' }} />
          <p className="text-sm font-medium" style={{ color: '#555' }}>No {title.toLowerCase()}</p>
          <p className="text-xs mt-0.5" style={{ color: '#444' }}>{emptyMsg}</p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: '#171717', border: '1px solid #222' }}
        >
          {reqs.map((req: any, i: number) => (
            <div
              key={req.id}
              className="px-4 py-3"
              style={{ borderBottom: i < reqs.length - 1 ? '1px solid #1e1e1e' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] font-bold" style={{ background: '#222', color: '#888' }}>
                    {initials(req.rider.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: '#f5f5f5' }}>{req.rider.name}</p>
                  <p className="text-[11px] truncate" style={{ color: '#555' }}>
                    {req.pickup} → {req.destination}
                  </p>
                  <p className="text-[11px]" style={{ color: '#444' }}>{req.isScheduled ? `${req.date} · ${req.time}` : `Instant Pick-Up · ${req.time}`}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={processing === req.id}
                    onClick={() => handleAccept(req.id)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '4px' }}
                  >
                    {processing === req.id ? '...' : 'Accept'}
                  </button>
                  <button
                    disabled={processing === req.id}
                    onClick={() => setDeclined(d => [...d, req.id])}
                    className="text-[11px] font-semibold px-2.5 py-1"
                    style={{ background: '#1e1e1e', color: '#555', borderRadius: '4px' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
              {req.notes && (
                <p className="text-[11px] mt-2 ml-10 px-2 py-1 rounded" style={{ background: '#1e1e1e', color: '#555', borderRadius: '4px' }}>
                  Note: {req.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderConfirmedSection = (trips: any[], title: string, emptyMsg: string) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#555' }}>
          {title}
        </p>
        {trips.length > 0 && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5"
            style={{ background: '#1e1e1e', color: '#888', borderRadius: '4px' }}
          >
            {trips.length}
          </span>
        )}
      </div>

      {trips.length === 0 ? (
        <div
          className="rounded-lg"
          style={{ background: '#171717', border: '1px solid #1e1e1e', padding: '20px' }}
        >
          <p className="text-xs" style={{ color: '#444' }}>{emptyMsg}</p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: '#171717', border: '1px solid #222' }}
        >
          {trips.map((trip: any, i: number) => (
            <div
              key={trip.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < trips.length - 1 ? '1px solid #1e1e1e' : 'none' }}
            >
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="text-[10px] font-bold" style={{ background: '#222', color: '#888' }}>
                  {initials(trip.rider.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: '#f5f5f5' }}>{trip.rider.name}</p>
                <p className="text-[11px] truncate" style={{ color: '#555' }}>
                  {trip.pickup} → {trip.destination}
                </p>
                <p className="text-[11px]" style={{ color: '#444' }}>
                  {trip.isScheduled ? `${trip.date} · ${trip.time}` : `Instant Pick-Up · ${trip.time}`}
                </p>
              </div>
              <button
                disabled={processing === trip.id}
                onClick={() => handleComplete(trip.id)}
                className="text-[11px] font-semibold px-2.5 py-1 shrink-0"
                style={{ background: '#1e1e1e', color: '#22c55e', borderRadius: '4px', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                {processing === trip.id ? '...' : 'Mark Complete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ background: '#111111', minHeight: '100vh' }}>'''

content = content.replace(old_return, helper_functions)

pattern = r"\{\/\* \U0001f4e5 Incoming Requests \U0001f4e5 \*\/}.*?(?=\Z)"
replacement = """{/* 📥 Incoming Requests 📥 */}
        {renderRequestSection(instantReqs, "Instant Requests (Take off immediately)", "No instant pickup requests right now.")}
        {renderRequestSection(scheduledReqs, "Scheduled Requests", "No scheduled rides at the moment.")}

        {/* ✅ Confirmed Trips ✅ */}
        {renderConfirmedSection(instantConfirmed, "Upcoming Confirmed (Instant)", "No confirmed instant pickups.")}
        {renderConfirmedSection(scheduledConfirmed, "Upcoming Confirmed (Scheduled)", "No confirmed scheduled rides.")}
      </div>
    </div>
  )
}
"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('app/driver/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
