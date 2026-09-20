import re

with open('app/admin/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject handleWithdrawalAction and renderFinances
inject_code = """
  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(id)
      const res = await fetch('/api/admin/withdrawals/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action })
      })
      if (!res.ok) throw new Error()
      
      setData((prev: any) => ({
        ...prev,
        withdrawalRequests: prev.withdrawalRequests.map((req: any) => 
          req.id === id ? { ...req, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : req
        )
      }))
    } catch (e) {
      alert("Failed to process withdrawal.")
    } finally {
      setProcessing(null)
    }
  }

  const renderFinances = () => {
    const requests = data?.withdrawalRequests || []
    const pending = requests.filter((r: any) => r.status === 'PENDING')
    const completed = requests.filter((r: any) => r.status !== 'PENDING')

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Finances & Withdrawals</h2>
            <p className="text-xs text-[#555] mt-1">Manage driver payouts and view revenue.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-[#141414] border border-white/5 rounded-2xl p-5">
             <p className="text-xs font-semibold text-[#888] uppercase">Total Revenue (All Time)</p>
             <p className="text-3xl font-black text-white mt-1">₦{(data?.stats?.totalRevenue || 0).toLocaleString()}</p>
           </div>
           <div className="bg-[#141414] border border-white/5 rounded-2xl p-5">
             <p className="text-xs font-semibold text-[#888] uppercase">Driver Payouts</p>
             <p className="text-3xl font-black text-white mt-1">₦{(data?.stats?.driverPayouts || 0).toLocaleString()}</p>
           </div>
        </div>

        <h3 className="text-sm font-bold text-white mt-8 mb-4">Pending Withdrawal Requests</h3>
        <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
          {pending.length === 0 ? (
            <p className="text-xs text-[#555] text-center py-10">No pending withdrawal requests.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {pending.map((req: any) => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarFallback className="bg-orange-500/20 text-orange-500 font-bold">
                        {req.driver?.user?.firstName?.[0] || 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[#eee]">{req.driver?.user?.firstName} {req.driver?.user?.lastName}</p>
                      <p className="text-xs text-[#888]">{req.driver?.user?.email}</p>
                      <p className="text-[10px] text-[#555] mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                    <p className="text-lg font-black text-green-400">₦{req.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleWithdrawalAction(req.id, 'approve')}
                        disabled={processing === req.id}
                        className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 disabled:opacity-50 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleWithdrawalAction(req.id, 'reject')}
                        disabled={processing === req.id}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="text-sm font-bold text-[#888] mt-8 mb-4">Past Withdrawals</h3>
        <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
          {completed.length === 0 ? (
             <p className="text-xs text-[#555] text-center py-6">No past withdrawals.</p>
          ) : (
            completed.slice(0, 10).map((req: any) => (
               <div key={req.id} className="p-4 border-b border-white/5 last:border-0 flex items-center justify-between">
                  <div>
                     <p className="text-sm font-semibold text-[#eee]">{req.driver?.user?.firstName} {req.driver?.user?.lastName}</p>
                     <p className="text-[10px] text-[#888]">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-bold text-white">₦{req.amount.toLocaleString()}</p>
                     <span className={`text-[10px] font-bold uppercase tracking-wider ${req.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}`}>
                       {req.status}
                     </span>
                  </div>
               </div>
            ))
          )}
        </div>
      </div>
    )
  }
"""

content = content.replace("  const renderSecurity = () => (", inject_code + "\n  const renderSecurity = () => (")

# 2. Update the JSX rendering loop
content = content.replace("{activeTab === 'finances' && renderOverview()}", "{activeTab === 'finances' && renderFinances()}")

with open('app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
