import { cn } from '@/lib/utils'
import { useThemeStore } from '@/stores/themeStore'

export function BrandMark({
  className,
  size = 28,
  alt = 'Petasos',
}: {
  className?: string
  size?: number
  alt?: string
}) {
  const theme = useThemeStore((state) => state.theme)
  const src =
    theme === 'dark' ? '/brand/logo-on-dark.png' : '/brand/logo-on-light.png'

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('select-none object-contain', className)}
      draggable={false}
    />
  )
}
