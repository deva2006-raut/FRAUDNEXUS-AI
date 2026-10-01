/** Shared inline SVG icon set (stroke-based, consistent 24px grid). */
const I = ({ children, size = 18, className = "" }: { children: React.ReactNode; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export const IconDashboard = (p: { size?: number; className?: string }) => (
  <I {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></I>
);
export const IconTx = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M3 7h13M13 3l4 4-4 4" /><path d="M21 17H8M11 21l-4-4 4-4" /></I>
);
export const IconAlert = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M12 3l9.5 16.5H2.5L12 3z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></I>
);
export const IconInvestigation = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /><path d="M8 10.5h5M10.5 8v5" /></I>
);
export const IconAgents = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="18" r="2.2" /><path d="M11 7l-4.5 9M13 7l4.5 9M7.2 18h9.6" /></I>
);
export const IconCustomers = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.6a3.5 3.5 0 010 6.8M21.5 20c0-3-1.8-5.1-4.5-5.8" /></I>
);
export const IconEvidence = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /><path d="M9 12h7M9 16h7" /></I>
);
export const IconGraph = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M7.8 7.6L10.5 16M16.2 7.6L13.5 16M8.5 6h7" /></I>
);
export const IconRisk = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></I>
);
export const IconReports = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" /><path d="M9 8h6M9 12h6M9 16h4" /></I>
);
export const IconLab = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M10 3v6L4.5 18.5A2 2 0 006.2 21h11.6a2 2 0 001.7-2.5L14 9V3" /><path d="M8.5 3h7" /><path d="M7 15h10" /></I>
);
export const IconBell = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M18 9a6 6 0 10-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" /><path d="M10 20a2.2 2.2 0 004 0" /></I>
);
export const IconSettings = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34h.09a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v.09a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" /></I>
);
export const IconSearch = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></I>
);
export const IconPlay = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M6 4l14 8-14 8V4z" /></I>
);
export const IconShield = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></I>
);
export const IconRefresh = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M21 12a9 9 0 11-2.6-6.3" /><path d="M21 3v6h-6" /></I>
);
export const IconDownload = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 21h16" /></I>
);
export const IconPrint = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M7 8V3h10v5" /><rect x="4" y="8" width="16" height="8" rx="2" /><path d="M7 14h10v7H7z" /></I>
);
export const IconShare = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="5.5" r="2.5" /><circle cx="17" cy="18.5" r="2.5" /><path d="M8.3 10.8l6.4-4M8.3 13.2l6.4 4" /></I>
);
export const IconArrowRight = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M5 12h14M13 6l6 6-6 6" /></I>
);
export const IconCheck = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M4 12.5l5 5L20 6.5" /></I>
);
export const IconClock = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></I>
);
export const IconDevice = (p: { size?: number; className?: string }) => (
  <I {...p}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></I>
);
export const IconPin = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></I>
);
export const IconUser = (p: { size?: number; className?: string }) => (
  <I {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></I>
);
export const IconZap = (p: { size?: number; className?: string }) => (
  <I {...p}><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" /></I>
);
