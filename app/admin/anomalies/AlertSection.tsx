'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AlertSection({ title, alerts, color }: { title: string, alerts: any[], color: string }) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (alerts.length === 0) return null;

  const bgMap: Record<string, string> = {
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
    yellow: 'bg-yellow-50 border-yellow-200'
  };

  const textMap: Record<string, string> = {
    red: 'text-red-900',
    orange: 'text-orange-900',
    yellow: 'text-yellow-900'
  };

  const handleAction = async (alertId: string, action: string) => {
    setProcessingId(alertId);
    try {
      const res = await fetch('/api/admin/anomalies/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action })
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Action failed');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className={`font-bold text-lg ${textMap[color]}`}>{title}</h3>
      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-5 rounded-2xl border shadow-sm ${bgMap[color]} ${alert.status !== 'PENDING' ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-lg">{alert.title}</h4>
              <div className="flex items-center gap-2">
                {alert.status !== 'PENDING' && (
                  <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs font-bold uppercase text-gray-700">
                    {alert.status}
                  </span>
                )}
                <span className="font-mono bg-white px-2 py-1 rounded text-sm font-bold border">
                  Score: {alert.riskScore}/100
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold mb-2 opacity-80 uppercase">{alert.category}</p>
            <p className="mb-4 text-gray-700">{alert.details}</p>
            
            {alert.affectedUsers && JSON.parse(alert.affectedUsers).length > 0 && (
              <div className="mb-4 text-sm bg-white/50 p-2 rounded text-gray-700 font-mono break-all">
                <strong>Affected IDs: </strong> {JSON.parse(alert.affectedUsers).join(', ')}
              </div>
            )}

            {alert.recommendedAction && (
              <div className="mb-4 text-sm bg-white/50 p-3 rounded font-medium border text-gray-800">
                <strong>Action: </strong> {alert.recommendedAction}
              </div>
            )}

            {alert.status === 'PENDING' && (
              <div className="flex space-x-2 mt-4">
                {color === 'red' && (
                  <>
                    <button 
                      onClick={() => handleAction(alert.id, 'suspend')}
                      disabled={processingId === alert.id}
                      className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {processingId === alert.id ? 'Processing...' : 'Investigate & Suspend'}
                    </button>
                    <button 
                      onClick={() => handleAction(alert.id, 'dismiss')}
                      disabled={processingId === alert.id}
                      className="bg-white text-gray-700 px-4 py-2 rounded font-bold text-sm border hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {color === 'orange' && (
                  <>
                    <button 
                      onClick={() => handleAction(alert.id, 'dismiss')}
                      disabled={processingId === alert.id}
                      className="bg-orange-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      {processingId === alert.id ? 'Processing...' : 'Mark Investigated'}
                    </button>
                  </>
                )}
                {color === 'yellow' && (
                  <>
                    <button 
                      onClick={() => handleAction(alert.id, 'dismiss')}
                      disabled={processingId === alert.id}
                      className="bg-yellow-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-yellow-700 transition disabled:opacity-50"
                    >
                      {processingId === alert.id ? 'Processing...' : 'Dismiss Alert'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
