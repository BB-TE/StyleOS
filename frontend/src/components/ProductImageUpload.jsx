import { ImagePlus, LockKeyhole, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../hooks/useI18n.js'
import { formatFileSize, IMAGE_ACCEPT, validateImageFile } from '../utils/imageUpload.js'

export function ProductImageUpload({ file, onSelect, onRemove }) {
  const { t } = useI18n()
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const choose = (nextFile) => {
    const validation = validateImageFile(nextFile)
    if (!validation.valid) {
      setError(t('productImage.invalid'))
      return
    }
    setError('')
    onSelect(nextFile)
  }

  const onInput = (event) => {
    choose(event.target.files?.[0])
    event.target.value = ''
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    choose(event.dataTransfer.files?.[0])
  }

  if (file && previewUrl) {
    return (
      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <div className="relative aspect-[4/3] overflow-hidden bg-black/30">
          <img src={previewUrl} alt={file.name} className="h-full w-full object-contain" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-acid/30 bg-paper/90 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[.12em] text-acid backdrop-blur">
            <LockKeyhole size={11} /> {t('productImage.localBadge')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/10 p-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink">{file.name}</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[.1em] text-stone">{formatFileSize(file.size)}</p>
          </div>
          <button type="button" onClick={onRemove} className="button-copy focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 px-4 text-stone hover:border-danger/40 hover:text-danger">
            <Trash2 size={13} /> {t('productImage.remove')}
          </button>
        </div>
        <p className="border-t border-white/10 px-4 py-3 text-[11px] leading-5 text-stone">{t('productImage.notScored')}</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={`focus-ring flex min-h-48 w-full flex-col items-center justify-center rounded-3xl border border-dashed px-5 text-center transition-colors ${dragging ? 'border-acid bg-acid/[.06]' : 'border-white/15 bg-white/[.02] hover:border-acid/45 hover:bg-acid/[.025]'}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-acid/25 text-acid"><ImagePlus size={19} /></span>
        <span className="mt-4 text-sm text-ink">{t('productImage.action')}</span>
        <span className="mt-2 max-w-sm text-xs leading-5 text-stone">{t('productImage.format')}</span>
        <span className="button-copy mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-stone"><Upload size={13} /> {t('productImage.drop')}</span>
      </button>
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={onInput} />
      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-stone"><LockKeyhole size={13} className="mt-0.5 shrink-0 text-acid" />{t('productImage.localOnly')}</p>
    </div>
  )
}
