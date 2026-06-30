'use client'

import { useRef, useState } from 'react'
import { FileText, Upload, Loader2, Wand2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api, copyToClipboard } from '@/lib/client'
import { toast } from 'sonner'

const SAMPLE = `Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy stored in glucose. It takes place mainly in the chloroplasts, which contain the green pigment chlorophyll. The overall reaction uses carbon dioxide and water, in the presence of sunlight, to produce glucose and oxygen.

Photosynthesis has two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). The light-dependent reactions occur in the thylakoid membranes, where water is split (photolysis), releasing oxygen, and energy is captured in ATP and NADPH. The Calvin cycle takes place in the stroma, where CO2 is fixed by the enzyme RuBisCO and reduced using ATP and NADPH to form glucose.

Several factors affect the rate of photosynthesis, including light intensity, carbon dioxide concentration, temperature, and water availability. The law of limiting factors states that the rate is constrained by the factor that is in shortest supply. Photosynthesis is vital because it forms the base of most food chains and is responsible for the oxygen in Earth's atmosphere.`

export function NotesSource({
  value,
  onChange,
  minHeight = 220,
}: {
  value: string
  onChange: (v: string) => void
  minHeight?: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setFileName(file.name)
    try {
      const form = new FormData()
      form.append('file', file)
      const data = await api<{ text: string; chars: number; fileName: string }>(
        '/api/pdf/parse',
        { method: 'POST', body: form }
      )
      onChange(data.text)
      toast.success(`Extracted ${data.chars.toLocaleString()} characters from ${data.fileName}`)
    } catch (err) {
      toast.error((err as Error).message || 'Could not read PDF')
      setFileName(null)
    } finally {
      setParsing(false)
      if (fileRef.current) fileRef.current.value = ''
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
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={onFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {parsing ? 'Reading PDF…' : 'Upload PDF'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(SAMPLE)
              setFileName(null)
              toast.success('Sample notes loaded')
            }}
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
                setFileName(null)
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
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your notes here, or upload a PDF to extract its text…"
        className="ssa-scroll resize-y bg-background text-sm leading-relaxed"
        style={{ minHeight }}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {fileName ? `Source: ${fileName}` : 'Paste text or upload a PDF'}
        </span>
        <span>{value.length.toLocaleString()} chars</span>
      </div>
    </div>
  )
}
