'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDropzone } from 'react-dropzone'

interface FAQ { id: string; question: string; answer: string; display_order: number }
interface Doc { id: string; filename: string; file_size?: number; processing_status: string; created_at: string }

const DEFAULT_INSTRUCTIONS = `You are the official AI assistant for [Business Name] on WhatsApp.

COMMUNICATION RULES:
- Do NOT use casual greetings. Address queries directly and professionally.
- For pricing enquiries, confirm the specific product before quoting.
- For complaints, offer to escalate to a human team member.
- Keep all replies under 150 words.
- End every reply with: "How may I further assist you?"
- Never discuss competitor products or pricing.`

const tabs = ['Documents', 'FAQs', 'AI Instructions']

export default function TrainingPage() {
  const supabase = createClient()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [docs, setDocs] = useState<Doc[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS)
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' })
  const [addingFaq, setAddingFaq] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingInstructions, setSavingInstructions] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [testReply, setTestReply] = useState('')
  const [testing, setTesting] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('id, custom_instructions').eq('user_id', user.id).single()
      if (!biz) return
      setBusinessId(biz.id)
      if (biz.custom_instructions) setInstructions(biz.custom_instructions)

      const [{ data: docsData }, { data: faqsData }] = await Promise.all([
        supabase.from('training_docs').select('id, filename, file_size, processing_status, created_at').eq('business_id', biz.id).order('created_at', { ascending: false }),
        supabase.from('faqs').select('*').eq('business_id', biz.id).order('display_order'),
      ])
      setDocs(docsData || [])
      setFaqs(faqsData || [])
    }
    init()
  }, [])

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!businessId || !accepted.length) return
    setUploading(true)
    for (const file of accepted) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessId)
      const res = await fetch('/api/training/documents', { method: 'POST', body: formData })
      if (res.ok) {
        const { doc } = await res.json()
        setDocs(prev => [doc, ...prev])
      }
    }
    setUploading(false)
  }, [businessId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'], 'text/csv': ['.csv'] },
    maxSize: 10 * 1024 * 1024,
  })

  const deleteDoc = async (id: string) => {
    if (!businessId) return
    await supabase.from('training_docs').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const addFaq = async () => {
    if (!businessId || !newFaq.question || !newFaq.answer) return
    const { data } = await supabase.from('faqs').insert({ business_id: businessId, question: newFaq.question, answer: newFaq.answer, display_order: faqs.length }).select().single()
    if (data) { setFaqs(prev => [...prev, data]); setNewFaq({ question: '', answer: '' }); setAddingFaq(false) }
  }

  const updateFaq = async (id: string, updates: Partial<FAQ>) => {
    await supabase.from('faqs').update(updates).eq('id', id)
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const deleteFaq = async (id: string) => {
    await supabase.from('faqs').delete().eq('id', id)
    setFaqs(prev => prev.filter(f => f.id !== id))
  }

  const saveInstructions = async () => {
    if (!businessId) return
    setSavingInstructions(true)
    await fetch('/api/training/instructions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, instructions }) })
    setSavingInstructions(false)
  }

  const testAI = async () => {
    if (!testMessage || !businessId) return
    setTesting(true)
    const res = await fetch('/api/demo-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: testMessage, history: [], businessId }) })
    const data = await res.json()
    setTestReply(data.reply)
    setTesting(false)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { queued: 'bg-yellow-500/20 text-yellow-400', processing: 'bg-blue-500/20 text-blue-400', trained: 'bg-green-500/20 text-green-400', failed: 'bg-red-500/20 text-red-400' }
    return map[status] || map.queued
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#e9edef]">Training</h1>
        <p className="text-[#8696a0] text-sm mt-1">Teach your AI about your business</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111b21] border border-[#374045] rounded-xl p-1 w-fit">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-[#2a3942] text-[#e9edef]' : 'text-[#8696a0] hover:text-white'}`}>{tab}</button>
        ))}
      </div>

      {/* Documents tab */}
      {activeTab === 0 && (
        <div className="space-y-4">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[#00a884] bg-[#00a884]/5' : 'border-[#374045] hover:border-[#00a884]/40'}`}>
            <input {...getInputProps()} />
            <svg className="w-10 h-10 text-[#374045] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            {uploading ? <p className="text-[#8696a0]">Uploading...</p> : isDragActive ? <p className="text-[#00a884]">Drop files here</p> : (
              <div>
                <p className="text-[#e9edef] font-medium">Drop files here or click to upload</p>
                <p className="text-[#8696a0] text-sm mt-1">PDF, DOCX, TXT, CSV — up to 10MB each</p>
              </div>
            )}
          </div>

          {docs.length > 0 && (
            <div className="bg-[#111b21] border border-[#374045] rounded-2xl overflow-hidden">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#374045] last:border-0">
                  <div className="w-8 h-8 bg-[#1f2c34] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#e9edef] text-sm font-medium truncate">{doc.filename}</div>
                    {doc.file_size && <div className="text-[#8696a0] text-xs">{(doc.file_size / 1024).toFixed(1)} KB</div>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(doc.processing_status)}`}>{doc.processing_status}</span>
                  <button onClick={() => deleteDoc(doc.id)} className="text-[#374045] hover:text-red-400 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAQs tab */}
      {activeTab === 1 && (
        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-[#111b21] border border-[#374045] rounded-xl p-4">
              <input
                value={faq.question}
                onChange={e => updateFaq(faq.id, { question: e.target.value })}
                className="w-full bg-transparent text-[#e9edef] text-sm font-medium outline-none border-b border-[#374045] pb-2 mb-2 focus:border-[#00a884]/50"
                placeholder="Question"
              />
              <div className="flex gap-2">
                <textarea
                  value={faq.answer}
                  onChange={e => updateFaq(faq.id, { answer: e.target.value })}
                  rows={2}
                  className="flex-1 bg-transparent text-[#8696a0] text-sm outline-none resize-none"
                  placeholder="Answer"
                />
                <button onClick={() => deleteFaq(faq.id)} className="text-[#374045] hover:text-red-400 self-start p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}

          {addingFaq && (
            <div className="bg-[#111b21] border border-[#00a884]/30 rounded-xl p-4 space-y-3">
              <input value={newFaq.question} onChange={e => setNewFaq(p => ({ ...p, question: e.target.value }))} placeholder="Question" className="w-full bg-[#1f2c34] border border-[#374045] rounded-lg px-3 py-2 text-[#e9edef] text-sm outline-none focus:border-[#00a884]/50" />
              <textarea value={newFaq.answer} onChange={e => setNewFaq(p => ({ ...p, answer: e.target.value }))} rows={2} placeholder="Answer" className="w-full bg-[#1f2c34] border border-[#374045] rounded-lg px-3 py-2 text-[#e9edef] text-sm outline-none resize-none focus:border-[#00a884]/50" />
              <div className="flex gap-2">
                <button onClick={() => setAddingFaq(false)} className="flex-1 py-2 border border-[#374045] text-[#8696a0] text-sm rounded-lg">Cancel</button>
                <button onClick={addFaq} disabled={!newFaq.question || !newFaq.answer} className="flex-1 py-2 bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-50 text-white text-sm rounded-lg transition-all">Save FAQ</button>
              </div>
            </div>
          )}

          <button onClick={() => setAddingFaq(true)} className="flex items-center gap-2 text-[#00a884] text-sm hover:text-[#00c49a] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add FAQ
          </button>
        </div>
      )}

      {/* AI Instructions tab */}
      {activeTab === 2 && (
        <div className="space-y-4">
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={16}
            className="w-full bg-[#111b21] border border-[#374045] rounded-2xl px-5 py-4 text-[#e9edef] font-mono text-sm outline-none focus:border-[#00a884]/50 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={saveInstructions} disabled={savingInstructions} className="bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-xl transition-all">
              {savingInstructions ? 'Saving...' : 'Save & Apply'}
            </button>
            <button onClick={() => setInstructions(DEFAULT_INSTRUCTIONS)} className="border border-[#374045] text-[#8696a0] text-sm px-5 py-2.5 rounded-xl hover:text-white transition-colors">Reset to default</button>
            <button onClick={() => setShowTestModal(true)} className="border border-[#00a884]/30 text-[#00a884] text-sm px-5 py-2.5 rounded-xl hover:bg-[#00a884]/10 transition-colors ml-auto">Test your AI</button>
          </div>

          {showTestModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-[#111b21] border border-[#374045] rounded-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#e9edef] font-medium">Test your AI</h3>
                  <button onClick={() => { setShowTestModal(false); setTestReply('') }} className="text-[#8696a0] hover:text-white">✕</button>
                </div>
                <input value={testMessage} onChange={e => setTestMessage(e.target.value)} placeholder="Type a test customer message..." className="w-full bg-[#1f2c34] border border-[#374045] rounded-xl px-4 py-3 text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:border-[#00a884]/50" />
                {testReply && <div className="bg-[#1f2c34] rounded-xl p-4 text-[#e9edef] text-sm leading-relaxed">{testReply}</div>}
                <button onClick={testAI} disabled={!testMessage || testing} className="w-full bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-50 text-white py-3 rounded-xl text-sm transition-all">
                  {testing ? 'Thinking...' : 'Send test message'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
