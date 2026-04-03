'use client'
import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  messages: Array<{ from_role: string; created_at: string; message_type: string }>
  conversations: Array<{ status: string; created_at: string }>
}

const COLORS = ['#00a884', '#374045', '#8696a0']

export default function AnalyticsClient({ messages, conversations }: Props) {
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {}
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      return d.toISOString().split('T')[0]
    })
    last30.forEach(d => { map[d] = 0 })
    messages.forEach(m => {
      const d = m.created_at.split('T')[0]
      if (map[d] !== undefined) map[d]++
    })
    return last30.map(d => ({ date: d.slice(5), messages: map[d] }))
  }, [messages])

  const hourlyData = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, count: 0 }))
    messages.forEach(m => {
      const h = new Date(m.created_at).getHours()
      counts[h].count++
    })
    return counts
  }, [messages])

  const pieData = useMemo(() => {
    const ai = messages.filter(m => m.from_role === 'ai').length
    const staff = messages.filter(m => m.from_role === 'staff').length
    const total = messages.length
    return [
      { name: 'AI replied', value: ai },
      { name: 'Staff replied', value: staff },
      { name: 'Customer', value: total - ai - staff },
    ].filter(d => d.value > 0)
  }, [messages])

  const totalMessages = messages.length
  const aiMessages = messages.filter(m => m.from_role === 'ai').length
  const voiceMessages = messages.filter(m => m.message_type === 'audio').length
  const resolvedConvs = conversations.filter(c => c.status === 'resolved').length

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#e9edef]">Analytics</h1>
        <p className="text-[#8696a0] text-sm mt-1">Last 30 days</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total messages', value: totalMessages },
          { label: 'AI handled', value: `${totalMessages ? Math.round(aiMessages / totalMessages * 100) : 0}%` },
          { label: 'Voice messages', value: voiceMessages },
          { label: 'Resolved', value: resolvedConvs },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111b21] border border-[#374045] rounded-2xl p-5">
            <div className="font-mono text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-[#8696a0] text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-5">
          <h3 className="text-[#e9edef] font-medium mb-4">Messages per day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374045" />
              <XAxis dataKey="date" tick={{ fill: '#8696a0', fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fill: '#8696a0', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1f2c34', border: '1px solid #374045', borderRadius: 8, color: '#e9edef' }} />
              <Line type="monotone" dataKey="messages" stroke="#00a884" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-5">
          <h3 className="text-[#e9edef] font-medium mb-4">Messages by hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374045" />
              <XAxis dataKey="hour" tick={{ fill: '#8696a0', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: '#8696a0', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1f2c34', border: '1px solid #374045', borderRadius: 8, color: '#e9edef' }} />
              <Bar dataKey="count" fill="#00a884" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-5">
          <h3 className="text-[#e9edef] font-medium mb-4">Reply breakdown</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[#8696a0] text-sm">{d.name}</span>
                    <span className="text-white text-sm font-medium ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-[#8696a0] text-sm">No data yet</div>
          )}
        </div>

        <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-5">
          <h3 className="text-[#e9edef] font-medium mb-4">Conversation outcomes</h3>
          <div className="space-y-3">
            {[
              { label: 'Resolved', count: conversations.filter(c => c.status === 'resolved').length, color: '#00a884' },
              { label: 'AI Active', count: conversations.filter(c => c.status === 'ai_active').length, color: '#374045' },
              { label: 'Manual', count: conversations.filter(c => c.status === 'manual').length, color: '#8696a0' },
              { label: 'Needs Human', count: conversations.filter(c => c.status === 'needs_human').length, color: '#ef4444' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#8696a0]">{item.label}</span>
                  <span className="text-white">{item.count}</span>
                </div>
                <div className="h-1.5 bg-[#374045] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: conversations.length ? `${item.count / conversations.length * 100}%` : '0%', background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
