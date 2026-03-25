import { Cloud } from 'lucide-react'

export function PoweredByBadge() {
  return (
    <a
      href='https://cloud-station.io'
      target='_blank'
      rel='noopener noreferrer'
      className='fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-background hover:text-foreground hover:shadow-md'
    >
      <Cloud className='size-3.5' />
      <span>Built by CloudStation</span>
    </a>
  )
}
