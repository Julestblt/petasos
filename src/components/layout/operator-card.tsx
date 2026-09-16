import { useEffect, useRef, useState } from 'react'
import { GazeHero, type GazeState } from '@/components/ui/gaze-hero'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { GATEWAY_BASE_URL, OPERATOR_NAME, OPERATOR_ROLE } from '@/lib/constants'
import { useChatStore } from '@/stores/chatStore'
import { useThemeStore } from '@/stores/themeStore'
import { Moon, Settings, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SUCCESS_MS = 1200

export function OperatorCard() {
  const theme = useThemeStore((state) => state.theme)
  const toggle = useThemeStore((state) => state.toggle)
  const isSending = useChatStore((state) => state.isSending)
  const loadingMessages = useChatStore((state) => state.loadingMessages)
  const collapsed = useSidebar().state === 'collapsed'
  const navigate = useNavigate()
  const [gaze, setGaze] = useState<GazeState>('idle')
  const wasSending = useRef(false)

  useEffect(() => {
    if (isSending) {
      wasSending.current = true
      setGaze('thinking')
      return
    }

    if (wasSending.current) {
      wasSending.current = false
      setGaze('success')
      const timer = window.setTimeout(() => setGaze('idle'), SUCCESS_MS)
      return () => window.clearTimeout(timer)
    }

    if (loadingMessages) {
      setGaze('attention')
      return
    }

    setGaze('idle')
  }, [isSending, loadingMessages])

  if (collapsed) {
    return <GazeHero size={28} state={gaze} interactive />
  }

  return (
    <div className="flex items-center gap-2.5">
      <GazeHero size={36} state={gaze} interactive className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm leading-tight font-medium">
          {OPERATOR_NAME}
        </div>
        <div className="text-[11px] text-muted-foreground">{OPERATOR_ROLE}</div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        aria-label={
          theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        }
        onClick={toggle}
      >
        {theme === 'dark' ? (
          <Sun className="size-3.5" />
        ) : (
          <Moon className="size-3.5" />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label="Settings"
          >
            <Settings className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuLabel>Petasos</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/status')}>
            Status
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/skills')}>
            Skills
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => void navigator.clipboard.writeText(GATEWAY_BASE_URL)}
          >
            Copy gateway URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
