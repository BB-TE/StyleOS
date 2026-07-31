import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useI18n } from '../hooks/useI18n.js'

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxBytes = 5 * 1024 * 1024

export function PhotoUpload({ preview, onChange, onRemove }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const { t } = useI18n()

  const chooseFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!acceptedTypes.includes(file.type) || file.size > maxBytes) {
      setError(t('analysisForm.photoInvalid'))
      event.target.value = ''
      return
    }
    setError('')
    onChange(file)
  }

  return (
    <div>
      {preview ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20">
          <img src={preview} alt="" className="max-h-[30rem] w-full object-contain" />
          <button
            type="button"
            className="focus-ring absolute right-3 top-3 inline-flex h-10 items-center gap-2 rounded-full bg-paper/90 px-4 text-xs text-ink backdrop-blur"
            onClick={onRemove}
          >
            <Trash2 size={15} aria-hidden="true" />
            {t('analysisForm.photoRemove')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="focus-ring group flex min-h-[27rem] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/[.025] px-6 text-center transition-colors hover:border-acid/40 hover:bg-acid/[.025]"
          onClick={() => inputRef.current?.click()}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 text-acid transition-transform group-hover:scale-105"><ImagePlus size={25} strokeWidth={1.3} aria-hidden="true" /></span>
          <span className="mt-5 text-sm font-medium">{t('analysisForm.photoAction')}</span>
          <span className="mt-2 text-xs text-stone">{t('analysisForm.photoFormat')}</span>
        </button>
      )}
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} />
      {error ? <p className="mt-3 text-sm text-red-900">{error}</p> : null}
    </div>
  )
}
