/**
 * Ré-exports des seules icônes utilisées, en imports profonds.
 *
 * Le barrel `lucide-react` ré-exporte plus de 1700 modules. Rolldown, le bundler
 * de Vite 8, doit alors tous les résoudre et finit par se bloquer indéfiniment en
 * phase de transformation : `vite build` ne rend jamais la main, sans message
 * d'erreur. Les chemins directs ramènent le graphe aux icônes réellement utilisées.
 */
export { default as Activity } from 'lucide-react/dist/esm/icons/activity.js';
export { default as AlertCircle } from 'lucide-react/dist/esm/icons/circle-alert.js';
export { default as AlertTriangle } from 'lucide-react/dist/esm/icons/triangle-alert.js';
export { default as ArrowDownWideNarrow } from 'lucide-react/dist/esm/icons/arrow-down-wide-narrow.js';
export { default as ArrowLeft } from 'lucide-react/dist/esm/icons/arrow-left.js';
export { default as Ban } from 'lucide-react/dist/esm/icons/ban.js';
export { default as Banknote } from 'lucide-react/dist/esm/icons/banknote.js';
export { default as CalendarClock } from 'lucide-react/dist/esm/icons/calendar-clock.js';
export { default as ChartColumn } from 'lucide-react/dist/esm/icons/chart-column.js';
export { default as Check } from 'lucide-react/dist/esm/icons/check.js';
export { default as CheckCircle2 } from 'lucide-react/dist/esm/icons/circle-check-big.js';
export { default as ChevronRight } from 'lucide-react/dist/esm/icons/chevron-right.js';
export { default as Cigarette } from 'lucide-react/dist/esm/icons/cigarette.js';
export { default as Circle } from 'lucide-react/dist/esm/icons/circle.js';
export { default as Clock } from 'lucide-react/dist/esm/icons/clock.js';
export { default as Droplets } from 'lucide-react/dist/esm/icons/droplets.js';
export { default as ExternalLink } from 'lucide-react/dist/esm/icons/external-link.js';
export { default as Eye } from 'lucide-react/dist/esm/icons/eye.js';
export { default as Filter } from 'lucide-react/dist/esm/icons/filter.js';
export { default as GlassWater } from 'lucide-react/dist/esm/icons/glass-water.js';
export { default as HeartPulse } from 'lucide-react/dist/esm/icons/heart-pulse.js';
export { default as Info } from 'lucide-react/dist/esm/icons/info.js';
export { default as LayoutDashboard } from 'lucide-react/dist/esm/icons/layout-dashboard.js';
export { default as ListChecks } from 'lucide-react/dist/esm/icons/list-checks.js';
export { default as ListOrdered } from 'lucide-react/dist/esm/icons/list-ordered.js';
export { default as Lock } from 'lucide-react/dist/esm/icons/lock.js';
export { default as MessageSquare } from 'lucide-react/dist/esm/icons/message-square.js';
export { default as PenLine } from 'lucide-react/dist/esm/icons/pen-line.js';
export { default as PhoneCall } from 'lucide-react/dist/esm/icons/phone-call.js';
export { default as Pill } from 'lucide-react/dist/esm/icons/pill.js';
export { default as RefreshCw } from 'lucide-react/dist/esm/icons/refresh-cw.js';
export { default as RotateCcw } from 'lucide-react/dist/esm/icons/rotate-ccw.js';
export { default as Salad } from 'lucide-react/dist/esm/icons/salad.js';
export { default as Search } from 'lucide-react/dist/esm/icons/search.js';
export { default as Send } from 'lucide-react/dist/esm/icons/send.js';
export { default as Settings } from 'lucide-react/dist/esm/icons/settings.js';
export { default as ShieldCheck } from 'lucide-react/dist/esm/icons/shield-check.js';
export { default as Stethoscope } from 'lucide-react/dist/esm/icons/stethoscope.js';
export { default as Timer } from 'lucide-react/dist/esm/icons/timer.js';
export { default as TrendingUp } from 'lucide-react/dist/esm/icons/trending-up.js';
export { default as Users } from 'lucide-react/dist/esm/icons/users.js';
export { default as UsersRound } from 'lucide-react/dist/esm/icons/users-round.js';
export { default as X } from 'lucide-react/dist/esm/icons/x.js';
export { default as XCircle } from 'lucide-react/dist/esm/icons/circle-x.js';
export { default as Zap } from 'lucide-react/dist/esm/icons/zap.js';
export { default as Plus } from 'lucide-react/dist/esm/icons/plus.js';
export { default as FileText } from 'lucide-react/dist/esm/icons/file-text.js';
export { default as Printer } from 'lucide-react/dist/esm/icons/printer.js';
export { default as History } from 'lucide-react/dist/esm/icons/history.js';
export { default as ClipboardCheck } from 'lucide-react/dist/esm/icons/clipboard-check.js';
export { default as MapPin } from 'lucide-react/dist/esm/icons/map-pin.js';
export { default as CalendarDays } from 'lucide-react/dist/esm/icons/calendar-days.js';
export { default as Mail } from 'lucide-react/dist/esm/icons/mail.js';
export { default as Phone } from 'lucide-react/dist/esm/icons/phone.js';
export { default as Syringe } from 'lucide-react/dist/esm/icons/syringe.js';
export { default as Square } from 'lucide-react/dist/esm/icons/square.js';
export { default as SquareCheck } from 'lucide-react/dist/esm/icons/square-check.js';
export { default as Undo2 } from 'lucide-react/dist/esm/icons/undo-2.js';
export { default as CalendarX } from 'lucide-react/dist/esm/icons/calendar-x.js';
export { default as MessageSquarePlus } from 'lucide-react/dist/esm/icons/message-square-plus.js';
export { default as Building2 } from 'lucide-react/dist/esm/icons/building-2.js';
export { default as ChevronLeft } from 'lucide-react/dist/esm/icons/chevron-left.js';
export { default as ArrowRight } from 'lucide-react/dist/esm/icons/arrow-right.js';
export { default as IdCard } from 'lucide-react/dist/esm/icons/id-card.js';
export { default as BellRing } from 'lucide-react/dist/esm/icons/bell-ring.js';
export { default as ShieldAlert } from 'lucide-react/dist/esm/icons/shield-alert.js';
export { default as UserRound } from 'lucide-react/dist/esm/icons/user-round.js';
