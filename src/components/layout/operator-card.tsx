import { LiveOrb } from '@/components/ui/live-orb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GATEWAY_BASE_URL, OPERATOR_NAME, OPERATOR_ROLE } from '@/lib/constants'
import { useSidebar } from '@/components/ui/sidebar'
import { useThemeStore, type ThemeMode } from '@/stores/themeStore'
import { Moon, Settings, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function OperatorCard() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const collapsed = useSidebar().state === 'collapsed'
  const navigate = useNavigate()

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <LiveOrb
          size={28}
          variant="custom"
          color="#7C5CFF"
          eyeColor="#FAFAFA"
          interactive
          blink
          className="pointer-events-none"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <LiveOrb
        size={36}
        variant="custom"
        color="#7C5CFF"
        eyeColor="#FAFAFA"
        interactive
        blink
        className="pointer-events-none shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm leading-tight font-medium">
          {OPERATOR_NAME}
        </div>
        <div className="text-[11px] text-muted-foreground">{OPERATOR_ROLE}</div>
      </div>
      <ToggleGroup
        type="single"
        size="sm"
        value={theme}
        onValueChange={(value) => {
          if (value === 'light' || value === 'dark') {
            setTheme(value as ThemeMode)
          }
        }}
        className="shrink-0"
      >
        <ToggleGroupItem value="light" aria-label="Light theme" className="size-7 p-0">
          <Sun className="size-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Dark theme" className="size-7 p-0">
          <Moon className="size-3.5" />
        </ToggleGroupItem>
      </ToggleGroup>
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
