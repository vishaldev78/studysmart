'use client'

import { useRef, useState } from 'react'
import { FileText, Upload, Loader2, Wand2, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/client'
import { toast } from 'sonner'

const SAMPLE = `Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy stored in glucose. It takes place mainly in the chloroplasts, which contain the green pigment chlorophyll. The overall reaction uses carbon dioxide and water, in the presence of sunlight, to produce glucose and oxygen.

Photosynthesis has two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). The light-dependent reactions occur in the thylakoid membranes, where water is split (photolysis), releasing oxygen, and energy is captured in ATP and NADPH. The Calvin cycle takes place in the stroma, where CO2 is fixed by the enzyme RuBisCO and reduced using ATP and NADPH to form glucose.

Several factors affect the rate of photosynthesis, including light intensity, carbon dioxide concentration, temperature, and water availability. The law of limiting factors states that the rate is constrained by the factor that is in shortest supply. Photosynthesis is vital because it forms the base of most food chains and is responsible for the oxygen in Earth's atmosphere.`

type SourceMeta = { label: string; tone: 'pdf' | 'image' | 'sample' | 'text' } | null

export function NotesSource({
  value,
  onChange,
  minHeight = 220,
}: {
  value: string
  onChange: (v: string) => void
  minHeight?: number
}) {
  const pdfRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<null | 'pdf' | 'image'>(null)
  const [meta, setMeta] = useState<SourceMeta>(null)

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy('pdf')
    try {
      const form = new FormData()
      form.append('file', file)
      const data = await api<{
        text: string
        chars: number
        fileName: string
        pages: number
        totalPages: number
        truncated: boolean
        maxPages: number
      }>('/api/pdf/parse', { method: 'POST', body: form })
      onChange(data.text)
      setMeta({ label: `${data.fileName} · ${data.pages} page${data.pages > 1 ? 's' : ''}`, tone: 'pdf' })
      const note = data.truncated
        ? `Extracted ${data.chars.toLocaleString()} chars from first ${data.maxPages} pages of ${data.fileName} (PDF has ${data.totalPages} pages total).`
        : `Extracted ${data.chars.toLocaleString()} characters from ${data.fileName}.`
      toast.success(note)
    } catch (err) {
      toast.error((err as Error).message || 'Could not read PDF')
      setMeta(null)
    } finally {
      setBusy(null)
      if (pdfRef.current) pdfRef.current.value = ''
    }
  }

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy('image')
    try {
      const form = new FormData()
      form.append('file', file)
      const data = await api<{ text: string; chars: number; fileName: string }>(
        '/api/image/ocr',
        { method: 'POST', body: form }
      )
      onChange(data.text)
      setMeta({ label: `${data.fileName} · image OCR`, tone: 'image' })
      toast.success(`Read ${data.chars.toLocaleString()} characters from ${data.fileName}`)
    } catch (err) {
      toast.error((err as Error).message || 'Could not read image')
      setMeta(null)
    } finally {
      setBusy(null)
      if (imgRef.current) imgRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="size-4 text-primary" />
          Your Notes
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <input ref={pdfRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPdf} />
          <input
            ref={imgRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp"
            className="hidden"
            onChange={onImage}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => pdfRef.current?.click()} disabled={!!busy}>
            {busy === 'pdf' ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {busy === 'pdf' ? 'Reading PDF…' : 'Upload PDF'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => imgRef.current?.click()} disabled={!!busy}>
            {busy === 'image' ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
            {busy === 'image' ? 'Reading image…' : 'Upload Image'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(SAMPLE)
              setMeta({ label: 'Sample notes', tone: 'sample' })
              toast.success('Sample notes loaded')
            }}
            disabled={!!busy}
          >
            <Wand2 className="size-4" />
            Sample
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('')
                setMeta(null)
              }}
            >
              <Trash2 className="size-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (meta && meta.tone !== 'text') setMeta(null)
        }}
        placeholder="Paste your notes here, upload a PDF, or upload a photo of your notes…"
        className="ssa-scroll resize-y bg-background text-sm leading-relaxed"
        style={{ minHeight }}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{meta ? `Source: ${meta.label}` : 'Paste text, upload a PDF or an image'}</span>
        <span>{value.length.toLocaleString()} chars</span>
      </div>
    </div>
  )
}
