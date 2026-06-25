import type { ReactNode } from 'react'

/** Portal target ID — overlays rendered via createPortal land here, clipped by the phone screen. */
export const PHONE_OVERLAY_ID = 'phone-screen-overlay'

type PhoneFrameProps = {
  children: ReactNode
}

/**
 * iPhone-style device mockup. Renders a fixed-size phone shell with a notch,
 * side buttons, and a single internal scroll area (`.no-scrollbar`).
 * The talent app lives inside this frame.
 */
export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="relative">
      {/* device body */}
      <div className="relative h-[844px] w-[390px] rounded-[54px] bg-ink p-[14px] shadow-phone">
        {/* side buttons */}
        <span className="absolute -left-[3px] top-[120px] h-16 w-[3px] rounded-l bg-ink/70" />
        <span className="absolute -left-[3px] top-[200px] h-10 w-[3px] rounded-l bg-ink/70" />
        <span className="absolute -right-[3px] top-[170px] h-24 w-[3px] rounded-r bg-ink/70" />

        {/* screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[42px] bg-paper">
          {/* notch */}
          <div className="pointer-events-none absolute left-1/2 top-2 z-30 h-7 w-32 -translate-x-1/2 rounded-full bg-ink" />
          {/* scrollable content area */}
          <div className="no-scrollbar h-full w-full overflow-y-auto">{children}</div>
          {/* Portal target for in-phone overlays (interstitials, bottom sheets) */}
          <div id={PHONE_OVERLAY_ID} className="pointer-events-none absolute inset-0 z-20" />
        </div>
      </div>
    </div>
  )
}
