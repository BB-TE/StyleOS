import { CircleHelp, LifeBuoy, Send, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n.js'
import { track } from '../utils/analytics.js'
import { submitSupportRequest } from '../utils/apiClient.js'

const categories = ['feature', 'decision', 'privacy', 'image', 'other']

export function SupportCenter() {
  const { language, t } = useI18n()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('feature')
  const [message, setMessage] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const show = () => {
    setOpen(true)
    track('support_opened', { page: location.pathname })
  }

  const submit = async (event) => {
    event.preventDefault()
    const note = message.trim()
    if (note.length < 10 || !acknowledged) {
      setError(t('support.validation'))
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const response = await submitSupportRequest({
        category,
        message: note,
        page: location.pathname,
        language,
      })
      setReceipt({ id: response.data.id, mode: response.mode })
      setMessage('')
      setAcknowledged(false)
      track('support_submitted', { category, mode: response.mode, page: location.pathname })
    } catch {
      setError(t('support.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" onClick={show} className="focus-ring fixed bottom-5 right-5 z-30 inline-flex h-12 items-center gap-2 rounded-full border border-acid/35 bg-paper/95 px-4 text-xs font-medium text-acid shadow-2xl shadow-black/35 backdrop-blur-xl transition hover:border-acid hover:bg-acid hover:text-paper sm:bottom-7 sm:right-7" aria-label={t('support.open')}>
        <LifeBuoy size={16} />
        <span>{t('support.open')}</span>
      </button>

      {open ? <div className="fixed inset-0 z-[70] flex items-end justify-end bg-black/70 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
        <aside className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-paper p-5 shadow-2xl sm:m-5 sm:max-w-xl sm:rounded-[2rem] sm:p-7" aria-label={t('support.title')}>
          <header className="flex items-start justify-between gap-5 border-b border-white/10 pb-6">
            <div><p className="signal-label text-acid">SUPPORT / V1</p><h2 className="mt-3 font-display text-4xl tracking-[-.045em]">{t('support.title')}</h2><p className="mt-3 max-w-md text-sm leading-6 text-stone">{t('support.intro')}</p></div>
            <button type="button" onClick={() => setOpen(false)} className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-stone hover:text-ink" aria-label={t('support.close')}><X size={17} /></button>
          </header>

          <section className="mt-5 rounded-2xl border border-acid/20 bg-acid/[.045] p-4">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-acid" size={17} /><div><p className="text-sm font-medium">{t('support.modeTitle')}</p><p className="mt-1 text-xs leading-5 text-stone">{t('support.modeBody')}</p></div></div>
          </section>

          <section className="mt-7">
            <div className="flex items-center gap-2"><CircleHelp size={15} className="text-acid" /><h3 className="signal-label">{t('support.faqTitle')}</h3></div>
            <div className="mt-3 space-y-2">
              {['data', 'image', 'charge'].map((item) => <details key={item} className="group rounded-2xl border border-white/10 bg-white/[.025] p-4"><summary className="cursor-pointer list-none pr-7 text-sm font-medium">{t(`support.faq.${item}Title`)}</summary><p className="mt-3 text-xs leading-6 text-stone">{t(`support.faq.${item}Body`)}</p></details>)}
            </div>
          </section>

          <form onSubmit={submit} className="mt-8 border-t border-white/10 pt-7">
            <h3 className="signal-label">{t('support.formTitle')}</h3>
            <label className="mt-4 block"><span className="text-xs text-stone">{t('support.categoryLabel')}</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="focus-ring mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[.035] px-4 text-sm outline-none">{categories.map((item) => <option key={item} value={item}>{t(`support.categories.${item}`)}</option>)}</select></label>
            <label className="mt-4 block"><span className="text-xs text-stone">{t('support.messageLabel')}</span><textarea value={message} maxLength={1200} onChange={(event) => setMessage(event.target.value)} className="focus-ring mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm leading-6 outline-none placeholder:text-stone/50" placeholder={t('support.placeholder')} /><span className="mt-1 block text-right font-mono text-[9px] text-stone">{message.length} / 1200</span></label>
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 accent-[#d7ff45]" /><span className="text-xs leading-5 text-stone">{t('support.consent')}</span></label>
            {error ? <p className="mt-3 rounded-2xl border border-danger/25 bg-danger/[.05] p-3 text-xs text-danger">{error}</p> : null}
            {receipt ? <div className="mt-3 rounded-2xl border border-acid/25 bg-acid/[.05] p-4"><p className="text-sm font-medium text-acid">{t('support.successTitle')}</p><p className="mt-1 text-xs leading-5 text-stone">{t(receipt.mode === 'api' ? 'support.successApi' : 'support.successLocal')}</p><p className="mt-2 font-mono text-[9px] text-stone">{t('support.ticket')}: {receipt.id}</p></div> : null}
            <button type="submit" disabled={submitting} className="acid-button mt-4 h-12 w-full gap-3 text-[10px] uppercase tracking-[.13em] disabled:opacity-60"><Send size={14} />{t(submitting ? 'support.submitting' : 'support.submit')}</button>
          </form>
        </aside>
      </div> : null}
    </>
  )
}
