'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { toast } from '@/hooks/use-toast'
import { provinces, kinshasaCommunes, getCommunes, getAllProvinceNames, getProvinceDistricts, kinshasaDistricts, KinshasaDistrict } from '@/data/rdc'
import { sectors, getServicesBySector, getAllSectorNames, getAllServices } from '@/data/sectors'
import { t as translate, Language, languageNames } from '@/data/translations'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

import {
  Home, Search, Bell, User, Settings, LogOut, ChevronLeft, ChevronRight,
  Star, Phone, Mail, MapPin, Globe, Camera, Upload, Eye, EyeOff,
  CheckCircle, XCircle, Clock, AlertTriangle, Info, Send, MessageSquare,
  Building2, Briefcase, Users, Shield, Heart, ArrowRight, Menu,
  Plus, Minus, Edit, Trash2, Ban, Check, X, RefreshCw, Loader2,
  Sparkles, ShieldCheck, TrendingUp, FileText, ThumbsUp,
  MoreVertical, Lock, Key, Copy, ExternalLink, Store, Wrench,
  Smartphone, ChevronDown, IdCard, UserCheck, Filter, Zap, Download, Moon, Sun, Palette, Save
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================
type ViewName = 'landing' | 'login' | 'register' | 'client-dashboard' | 'provider-detail' |
  'prestataire-dashboard' | 'entreprise-dashboard' | 'admin-dashboard' |
  'notifications' | 'settings' | 'profile-edit' | 'chat' | 'chat-conversation' | 'browse-sectors'

type AccountType = 'CLIENT' | 'PRESTATAIRE' | 'ENTREPRISE' | 'ADMIN'
type ThemeMode = 'green' | 'dark' | 'red'

interface UserProfile {
  id: string; phone: string; email?: string; role: AccountType; status?: string
  certified?: boolean; certificationStatus?: string | null; certificationMessage?: string | null
  autoReplyMessage?: string | null; deletionReason?: string | null; deletionRequestedAt?: string | null
  profile?: { fullName?: string; companyName?: string; photo?: string; logo?: string; coverPhoto?: string
    sector?: string; services?: string[]; province?: string; commune?: string; nationalScope?: boolean
    description?: string; website?: string; socialMedia?: Record<string, string>
    companyType?: string; employeeCount?: number; fullAddress?: string }
}

interface AppNotification { id: string; title: string; message: string; read: boolean; type?: string; createdAt: string }
interface Review { id: string; authorName: string; rating: number; comment: string; createdAt: string }
interface ContactMessage { id: string; name: string; email: string; message: string; reply?: string; createdAt: string }
interface ProviderResult { id: string; phone: string; role: AccountType; status?: string;
  certified?: boolean;
  profile?: {
    certified?: boolean;
    fullName?: string;
    companyName?: string;
    photo?: string;
    logo?: string;
    coverPhoto?: string;
    sector?: string;
    services?: string[]; province?: string; commune?: string; nationalScope?: boolean;
    description?: string; website?: string; socialMedia?: Record<string, string>
    companyType?: string; employeeCount?: number } }
interface Announcement { id: string; title: string; message: string; targetType: string; createdAt: string }
interface Conversation { id: string; otherUser: { id: string; phone: string; role: string; name: string; photo: string | null };
  lastMessage: { content: string; senderId: string; createdAt: string; read: boolean } | null;
  unreadCount: number; lastMessageAt: string }
interface ChatMsg { id: string; senderId: string; content: string; read: boolean; createdAt: string }

// ============================================================
// THEME SYSTEM
// ============================================================
function getThemeColors(theme: ThemeMode) {
  if (theme === 'dark') return {
    bg: 'bg-gray-950', cardBg: 'bg-gray-900', primary: 'bg-emerald-600', primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-white', accent: 'text-emerald-400', accentLight: 'bg-emerald-950', accentBorder: 'border-emerald-800',
    textPrimary: 'text-gray-100', textSecondary: 'text-gray-400', inputBg: 'bg-gray-800', borderColor: 'border-gray-700',
    headerBg: 'bg-gray-900', headerText: 'text-white', gradientFrom: 'from-gray-950', gradientTo: 'to-gray-900',
    navBg: 'bg-gray-900', navBorder: 'border-gray-700', navActive: 'text-emerald-400', navInactive: 'text-gray-500',
    badgeBg: 'bg-emerald-900', badgeText: 'text-emerald-300', alertBg: 'bg-emerald-950/50', pageBg: 'bg-gray-950'
  }
  if (theme === 'red') return {
    bg: 'bg-white', cardBg: 'bg-white', primary: 'bg-red-600', primaryHover: 'hover:bg-red-700',
    primaryText: 'text-white', accent: 'text-red-600', accentLight: 'bg-red-50', accentBorder: 'border-red-200',
    textPrimary: 'text-gray-900', textSecondary: 'text-gray-500', inputBg: 'bg-white', borderColor: 'border-red-100',
    headerBg: 'bg-red-600', headerText: 'text-white', gradientFrom: 'from-red-50', gradientTo: 'to-white',
    navBg: 'bg-white', navBorder: 'border-gray-200', navActive: 'text-red-600', navInactive: 'text-gray-400',
    badgeBg: 'bg-red-100', badgeText: 'text-red-700', alertBg: 'bg-red-50', pageBg: 'bg-gray-50'
  }
  return {
    bg: 'bg-white', cardBg: 'bg-white', primary: 'bg-emerald-600', primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-white', accent: 'text-emerald-600', accentLight: 'bg-emerald-50', accentBorder: 'border-emerald-200',
    textPrimary: 'text-gray-900', textSecondary: 'text-gray-500', inputBg: 'bg-white', borderColor: 'border-emerald-100',
    headerBg: 'bg-emerald-600', headerText: 'text-white', gradientFrom: 'from-emerald-50', gradientTo: 'to-white',
    navBg: 'bg-white', navBorder: 'border-gray-200', navActive: 'text-emerald-600', navInactive: 'text-gray-400',
    badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', alertBg: 'bg-emerald-50', pageBg: 'bg-gray-50'
  }
}

// ============================================================
// HELPERS
// ============================================================
function generatePassword(): string {
  const c = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let p = ''
  for (let i = 0; i < 12; i++) p += c.charAt(Math.floor(Math.random() * c.length))
  return p
}
function formatPhone(v: string): string {
  let cl = v.replace(/\D/g, '')
  if (!cl.startsWith('243')) cl = '243' + cl.replace(/^0+/, '')
  return '+243 ' + cl.slice(3).replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3').trim()
}
function formatDate(ds: string): string { try { return new Date(ds).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return ds } }
function formatTime(ds: string): string { try { return new Date(ds).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }
function getInitials(n: string): string { return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }
function getStars(rating: number) { return Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />) }
function getStatusBadge(status: string, tc: ThemeMode) {
  const cls = tc === 'red' ? { approved: 'bg-red-100 text-red-700 border-red-200', pending: 'bg-amber-100 text-amber-700 border-amber-200', rejected: 'bg-gray-100 text-gray-700 border-gray-200' }
    : tc === 'dark' ? { approved: 'bg-emerald-900 text-emerald-300 border-emerald-800', pending: 'bg-amber-900 text-amber-300 border-amber-800', rejected: 'bg-gray-800 text-gray-400 border-gray-700' }
    : { approved: 'bg-emerald-100 text-emerald-700 border-emerald-200', pending: 'bg-amber-100 text-amber-700 border-amber-200', rejected: 'bg-gray-100 text-gray-700 border-gray-200' }
  const labels: Record<string, string> = { approved: 'Approuvé', pending: 'En attente', rejected: 'Rejeté', suspended: 'Suspendu', active: 'Actif' }
  return <Badge className={cls[status as keyof typeof cls] || cls.pending}>{labels[status] || status}</Badge>
}

// ============================================================
// MAIN APP
// ============================================================
export default function VServiceRDC() {
  const tc = getThemeColors('green')
  // Navigation
  const [currentView, setCurrentView] = useState<ViewName>('landing')
  const [viewParams, setViewParams] = useState<Record<string, any>>({})
  // Theme & Language
  const [theme, setTheme] = useState<ThemeMode>(() => { if (typeof window !== 'undefined') return (localStorage.getItem('vservicerdc_theme') as ThemeMode) || 'green'; return 'green' })
  const [lang, setLang] = useState<Language>(() => { if (typeof window !== 'undefined') return (localStorage.getItem('vservicerdc_lang') as Language) || 'fr'; return 'fr' })
  const th = getThemeColors(theme)
  const t = useCallback((k: string) => translate(lang, k), [lang])
  // Auth
  const [token, setToken] = useState<string | null>(() => { if (typeof window !== 'undefined') return localStorage.getItem('vservicerdc_token'); return null })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  // Provider
  const [providerDetail, setProviderDetail] = useState<ProviderResult | null>(null)
  const [providerReviews, setProviderReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  // Contact
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  // Admin
  const [adminStats, setAdminStats] = useState<Record<string, number>>({})
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminAnnouncements, setAdminAnnouncements] = useState<Announcement[]>([])
  const [adminMessages, setAdminMessages] = useState<any[]>([])
  // Chat
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [currentChatId, setCurrentChatId] = useState('')
  const [chatOtherUser, setChatOtherUser] = useState<Conversation['otherUser'] | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  // Theme/Lang selector
  const [showSettings, setShowSettings] = useState(false)
  // Auto-reply
  const [autoReplyMsg, setAutoReplyMsg] = useState(''); const [autoReplyLoading, setAutoReplyLoading] = useState(false)
  const [chatAutoReply, setChatAutoReply] = useState('')
  // Deletion request
  const [deletionReason, setDeletionReason] = useState(''); const [deletionLoading, setDeletionLoading] = useState(false)
  // Suspended
  const [suspensionNotif, setSuspensionNotif] = useState<{ message: string } | null>(null)
  // Search
  const [searchKey, setSearchKey] = useState(0); const [searchAllCommunes, setSearchAllCommunes] = useState(false); const [customServiceInput, setCustomServiceInput] = useState('')
  const [searchPage, setSearchPage] = useState(1); const [searchTotalPages, setSearchTotalPages] = useState(1); const [searchTotal, setSearchTotal] = useState(0)

  useEffect(() => { localStorage.setItem('vservicerdc_theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('vservicerdc_lang', lang) }, [lang])

  const navigate = useCallback((view: ViewName, params?: Record<string, any>) => { setCurrentView(view); setViewParams(params || {}); window.scrollTo(0, 0) }, [])
  const authHeaders = useCallback(() => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }), [token])
  const multiPartHeaders = useCallback(() => ({ 'Authorization': `Bearer ${token}` }), [token])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: authHeaders() })
      if (res.ok) {
        const d = await res.json()
        setUser({ id: d.id, phone: d.phone, email: d.email, role: d.role, status: d.status, certified: d.certified, certificationStatus: d.certificationStatus, certificationMessage: d.certificationMessage, autoReplyMessage: d.autoReplyMessage, deletionReason: d.deletionReason, deletionRequestedAt: d.deletionRequestedAt, profile: d.profile || undefined })
        const r = d.role as string
        if (r === 'ADMIN') navigate('admin-dashboard')
        else if (r === 'CLIENT') navigate('client-dashboard')
        else if (r === 'PRESTATAIRE') navigate('prestataire-dashboard')
        else if (r === 'ENTREPRISE') navigate('entreprise-dashboard')
      } else { localStorage.removeItem('vservicerdc_token'); setToken(null) }
    } catch { localStorage.removeItem('vservicerdc_token'); setToken(null) }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync state from user data
  useEffect(() => { if (user) { setAutoReplyMsg((user as any).autoReplyMessage || ''); if ((user as any).deletionReason) setDeletionReason((user as any).deletionReason) } }, [user])
  /* eslint-disable react-hooks/set-state-in-effect -- initial loading sync */
  useEffect(() => {
    if (!token) { setInitialLoading(false); return }
    if (user) { setInitialLoading(false); return }
    fetchUserProfile().finally(() => setInitialLoading(false))
  }, [token, user])
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => { if (user && typeof window !== 'undefined' && !localStorage.getItem('vservicerdc_onboarded')) { const tm = setTimeout(() => setShowOnboarding(true), 500); return () => clearTimeout(tm) } }, [user])

  const logout = () => {
    localStorage.removeItem('vservicerdc_token'); setToken(null); setUser(null)
    setNotifications([]); setUnreadCount(0); navigate('landing')
    toast({ title: t('logout'), description: t('loginSuccess') })
  }

  const fetchNotifications = async () => { if (!token) return; try { const r = await fetch('/api/notifications', { headers: authHeaders() }); if (r.ok) { const d = await r.json(); setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0) } } catch { /* */ } }
  const markNotifRead = async (id?: string) => { if (!token) return; try { await fetch('/api/notifications', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(id ? { notificationId: id } : {}) }); if (id) { setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)); setUnreadCount(p => Math.max(0, p - 1)) } else { setNotifications(p => p.map(n => ({ ...n, read: true }))); setUnreadCount(0) } } catch { /* */ } }
  const deleteNotif = async (id: string) => { if (!token) return; try { await fetch('/api/notifications', { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ notificationId: id }) }); setNotifications(p => p.filter(n => n.id !== id)) } catch { /* */ } }
  const fetchContactMessages = async () => { if (!token) return; try { const r = await fetch('/api/contact', { headers: authHeaders() }); if (r.ok) { const d = await r.json(); setContactMessages(Array.isArray(d) ? d : d.messages || []) } } catch { /* */ } }

  // Chat functions
  const fetchConversations = async () => { if (!token) return; try { const r = await fetch('/api/chat', { headers: authHeaders() }); if (r.ok) { const d = await r.json(); setConversations(d.conversations || []) } } catch { /* */ } }
  const openChat = async (recipientId: string, recipientName?: string, recipientPhoto?: string | null) => {
    setChatLoading(true)
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ recipientId }) })
      if (r.ok) { const d = await r.json(); setCurrentChatId(d.conversationId); setChatOtherUser({ id: recipientId, phone: '', role: '', name: recipientName || 'Utilisateur', photo: recipientPhoto || null }); navigate('chat-conversation'); fetchChatMessages(d.conversationId) }
    } catch { /* */ }
    setChatLoading(false)
  }
  const fetchChatMessages = async (convId: string) => {
    try { const r = await fetch(`/api/chat/messages?conversationId=${convId}`, { headers: authHeaders() }); if (r.ok) { const d = await r.json(); setChatMessages(d.messages || []) } } catch { /* */ }
  }
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !currentChatId) return
    const msg = chatInput.trim(); setChatInput('')
    setChatMessages(p => [...p, { id: 'temp-' + Date.now(), senderId: user!.id, content: msg, read: false, createdAt: new Date().toISOString() }])
    try { await fetch('/api/chat/messages', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ conversationId: currentChatId, content: msg }) }) } catch { /* */ }
  }
  // Fetch other user auto-reply in chat
  const fetchChatAutoReply = async (convId: string) => {
    setChatAutoReply('')
    if (!token || !chatOtherUser?.id) return
    try {
      const r = await fetch(`/api/providers?userId=${chatOtherUser.id}`, { headers: authHeaders() })
      if (r.ok) { const d = await r.json(); setChatAutoReply(d.autoReplyMessage || '') }
    } catch { /* */ }
  }

  // Polling for chat messages + auto-reply check
  useEffect(() => {
    if (currentView !== 'chat-conversation' || !currentChatId) return
    const interval = setInterval(() => fetchChatMessages(currentChatId), 3000)
    return () => clearInterval(interval)
  }, [currentView, currentChatId])
  /* eslint-disable react-hooks/set-state-in-effect -- async fetch triggers setState in callback which is fine */
  useEffect(() => {
    if (currentView === 'chat-conversation' && chatOtherUser?.id) { fetchChatAutoReply(currentChatId).catch(() => {}) }
  }, [currentView, chatOtherUser?.id])
  /* eslint-enable react-hooks/set-state-in-effect */
  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on view change
  useEffect(() => { if (currentView === 'chat') fetchConversations() }, [currentView])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  // ============================================================
  // LOGIN
  // ============================================================
  const [loginPhone, setLoginPhone] = useState(''); const [loginPassword, setLoginPassword] = useState('')
  const [loginIsAdmin, setLoginIsAdmin] = useState(false); const [loginAdminPass, setLoginAdminPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false); const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async () => {
    if (loginIsAdmin) {
      if (!loginAdminPass) { toast({ title: 'Erreur', description: 'Veuillez entrer le mot de passe administrateur.', variant: 'destructive' }); return }
      setLoginLoading(true)
      try {
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isAdmin: true, adminPassword: loginAdminPass }) })
        const d = await r.json()
        if (r.ok) { localStorage.setItem('vservicerdc_token', d.token); setToken(d.token); setUser({ id: d.user.id, phone: d.user.phone, role: 'ADMIN', status: d.user.status }); navigate('admin-dashboard'); toast({ title: 'Connexion admin réussie' }) }
        else toast({ title: 'Erreur', description: d.error || 'Mot de passe incorrect.', variant: 'destructive' })
      } catch { toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' }) }
      setLoginLoading(false); return
    }
    if (!loginPhone || !loginPassword) { toast({ title: 'Erreur', description: 'Remplissez tous les champs.', variant: 'destructive' }); return }
    setLoginLoading(true)
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: formatPhone(loginPhone), password: loginPassword }) })
      const d = await r.json()
      if (r.ok) {
        localStorage.setItem('vservicerdc_token', d.token); setToken(d.token)
        const role = (d.user.role || 'CLIENT') as AccountType
        setUser({ id: d.user.id, phone: d.user.phone, email: d.user.email, role, status: d.user.status })
        if (role === 'ADMIN') navigate('admin-dashboard'); else if (role === 'CLIENT') navigate('client-dashboard'); else if (role === 'PRESTATAIRE') navigate('prestataire-dashboard'); else if (role === 'ENTREPRISE') navigate('entreprise-dashboard')
        toast({ title: t('loginSuccess'), description: t('welcome') })
      } else toast({ title: 'Erreur', description: d.message || d.error || 'Identifiants incorrects.', variant: 'destructive' })
    } catch { toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' }) }
    setLoginLoading(false)
  }

  // ============================================================
  // REGISTER
  // ============================================================
  const [regStep, setRegStep] = useState(0); const [regType, setRegType] = useState<AccountType | ''>(''); const [regLoading, setRegLoading] = useState(false); const [showRegPass, setShowRegPass] = useState(false)
  const [regName, setRegName] = useState(''); const [regEmail, setRegEmail] = useState(''); const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState(''); const [regConfirmPass, setRegConfirmPass] = useState('')
  const [regPhoto, setRegPhoto] = useState<File | null>(null); const [regPhotoPreview, setRegPhotoPreview] = useState('')
  const [regSector, setRegSector] = useState(''); const [regServices, setRegServices] = useState<string[]>([]); const [regCustomService, setRegCustomService] = useState('')
  const [regProvince, setRegProvince] = useState(''); const [regDistrict, setRegDistrict] = useState(''); const [regCommune, setRegCommune] = useState(''); const [regNationalScope, setRegNationalScope] = useState(false)
  const [regDescription, setRegDescription] = useState('')
  const [regSocialFB, setRegSocialFB] = useState(''); const [regSocialIG, setRegSocialIG] = useState(''); const [regSocialTW, setRegSocialTW] = useState('')
  const [regCompanyName, setRegCompanyName] = useState(''); const [regLogo, setRegLogo] = useState<File | null>(null); const [regLogoPreview, setRegLogoPreview] = useState('')
  const [regCover, setRegCover] = useState<File | null>(null); const [regCoverPreview, setRegCoverPreview] = useState('')
  const [regCompanyType, setRegCompanyType] = useState(''); const [regEmployeeCount, setRegEmployeeCount] = useState('')
  const [regWebsite, setRegWebsite] = useState(''); const [regFullAddress, setRegFullAddress] = useState('')

  const handlePhotoChange = (file: File, setFile: (f: File | null) => void, setPreview: (p: string) => void) => { setFile(file); setPreview(URL.createObjectURL(file)) }
  const handleGeneratePassword = () => { const p = generatePassword(); setRegPassword(p); setRegConfirmPass(p); toast({ title: 'Mot de passe généré', description: 'Copiez et conservez ce mot de passe.' }) }
  const toggleService = (s: string) => { setRegServices(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]) }
  const addCustomService = () => { if (regCustomService.trim() && !regServices.includes(regCustomService.trim())) { setRegServices(p => [...p, regCustomService.trim()]); setRegCustomService('') } }

  const handleRegister = async () => {
    if (!regType) { toast({ title: 'Erreur', description: 'Choisissez un type de compte.', variant: 'destructive' }); return }
    if (!regPhone || !regPassword) { toast({ title: 'Erreur', description: 'Téléphone et mot de passe requis.', variant: 'destructive' }); return }
    if (regType === 'CLIENT' && regPassword !== regConfirmPass) { toast({ title: 'Erreur', description: 'Mots de passe différents.', variant: 'destructive' }); return }
    setRegLoading(true)
    try {
      const body: any = { phone: formatPhone(regPhone), password: regPassword, role: regType, email: regEmail || undefined }
      const profile: any = {}
      if (regType === 'CLIENT') { profile.fullName = regName }
      else if (regType === 'PRESTATAIRE') {
        profile.fullName = regName; profile.sector = regSector
        if (regServices.length > 0) profile.services = regServices
        if (regProvince) profile.province = regProvince; if (regCommune) profile.commune = regCommune
        profile.nationalScope = regNationalScope; profile.description = regDescription
        const social: any = {}; if (regSocialFB) social.facebook = regSocialFB; if (regSocialIG) social.instagram = regSocialIG; if (regSocialTW) social.twitter = regSocialTW; if (Object.keys(social).length > 0) profile.socialMedia = social
      } else if (regType === 'ENTREPRISE') {
        profile.companyName = regCompanyName; profile.sector = regSector
        if (regServices.length > 0) profile.services = regServices
        profile.companyType = regCompanyType; if (regEmployeeCount) profile.employeeCount = parseInt(regEmployeeCount)
        profile.website = regWebsite; profile.fullAddress = regFullAddress
        if (regProvince) profile.province = regProvince; if (regCommune) profile.commune = regCommune
        profile.nationalScope = regNationalScope
        const social: any = {}; if (regSocialFB) social.facebook = regSocialFB; if (regSocialIG) social.instagram = regSocialIG; if (regSocialTW) social.twitter = regSocialTW; if (Object.keys(social).length > 0) profile.socialMedia = social
      }
      body.profile = profile
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        // Upload files with token from registration
        const regToken = data.token
        const headers = { 'Authorization': `Bearer ${regToken}` }
        if (regType === 'PRESTATAIRE' && regPhoto && data.user?.id) { const fd = new FormData(); fd.append('file', regPhoto); fd.append('type', 'provider-photo'); fd.append('userId', data.user.id); await fetch('/api/upload', { method: 'POST', headers, body: fd }) }
        if (regType === 'ENTREPRISE' && data.user?.id) {
          if (regLogo) { const fd = new FormData(); fd.append('file', regLogo); fd.append('type', 'company-logo'); fd.append('userId', data.user.id); await fetch('/api/upload', { method: 'POST', headers, body: fd }) }
          if (regCover) { const fd = new FormData(); fd.append('file', regCover); fd.append('type', 'company-cover'); fd.append('userId', data.user.id); await fetch('/api/upload', { method: 'POST', headers, body: fd }) }
        }
        toast({ title: t('saved'), description: t('welcome') })
        // Auto-login after registration
        localStorage.setItem('vservicerdc_token', data.token); setToken(data.token)
        setUser({ id: data.user.id, phone: data.user.phone, email: data.user.email, role: data.user.role as AccountType, status: data.user.status, certified: data.user.certified, certificationStatus: data.user.certificationStatus, certificationMessage: data.user.certificationMessage, autoReplyMessage: data.user.autoReplyMessage, deletionReason: data.user.deletionReason, deletionRequestedAt: data.user.deletionRequestedAt, profile: data.user.profile || undefined })
        const regRole = data.user.role as AccountType
        if (regRole === 'CLIENT') navigate('client-dashboard'); else if (regRole === 'PRESTATAIRE') navigate('prestataire-dashboard'); else if (regRole === 'ENTREPRISE') navigate('entreprise-dashboard')
      } else toast({ title: "Erreur", description: data.message || data.error || 'Erreur.', variant: 'destructive' })
    } catch { toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' }) }
    setRegLoading(false)
  }

  const resetRegForm = () => { setRegStep(0); setRegType(''); setRegName(''); setRegEmail(''); setRegPhone(''); setRegPassword(''); setRegConfirmPass(''); setRegPhoto(null); setRegPhotoPreview(''); setRegSector(''); setRegServices([]); setRegCustomService(''); setRegProvince(''); setRegDistrict(''); setRegCommune(''); setRegNationalScope(false); setRegDescription(''); setRegSocialFB(''); setRegSocialIG(''); setRegSocialTW(''); setRegCompanyName(''); setRegLogo(null); setRegLogoPreview(''); setRegCover(null); setRegCoverPreview(''); setRegCompanyType(''); setRegEmployeeCount(''); setRegWebsite(''); setRegFullAddress('') }

  // ============================================================
  // SEARCH
  // ============================================================
  const [searchProvince, setSearchProvince] = useState(''); const [searchDistrict, setSearchDistrict] = useState(''); const [searchCommune, setSearchCommune] = useState('')
  const [searchSector, setSearchSector] = useState(''); const [searchService, setSearchService] = useState('')
  const [searchQuery, setSearchQuery] = useState(''); const [searchTargetType, setSearchTargetType] = useState<'' | 'PRESTATAIRE' | 'ENTREPRISE'>('')
  const [searchResults, setSearchResults] = useState<ProviderResult[]>([]); const [searchLoading, setSearchLoading] = useState(false); const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (useMyCity?: boolean, pageNum?: number) => {
    setSearchLoading(true); setHasSearched(true)
    const pg = pageNum || searchPage
    try {
      const params = new URLSearchParams()
      if (searchTargetType) params.set('role', searchTargetType)
      if (useMyCity && user?.profile?.province) params.set('province', user.profile.province)
      else if (searchProvince) params.set('province', searchProvince)
      if (searchCommune) params.set('commune', searchCommune)
      if (searchSector) params.set('sector', searchSector)
      if (searchService) params.set('service', searchService)
      if (searchQuery) params.set('query', searchQuery)
      params.set('page', String(pg))
      params.set('limit', '20')
      const res = await fetch(`/api/providers?${params.toString()}`)
      if (res.ok) { const d = await res.json(); setSearchResults(d.results || []); setSearchPage(d.page || 1); setSearchTotalPages(d.totalPages || 1); setSearchTotal(d.total || 0) }
    } catch { /* */ }
    setSearchLoading(false)
  }

  const searchByType = (type: 'PRESTATAIRE' | 'ENTREPRISE') => { setSearchTargetType(type); setHasSearched(true); setSearchLoading(true); setSearchPage(1); setSearchKey(k => k + 1) }

  useEffect(() => {
    if (searchTargetType && hasSearched) {
      (async () => {
        try {
          const params = new URLSearchParams(); params.set('role', searchTargetType)
          const res = await fetch(`/api/providers?${params.toString()}`)
          if (res.ok) { const d = await res.json(); setSearchResults(d.results || []) }
        } catch { /* */ }
        setSearchLoading(false)
      })()
    }
  }, [searchTargetType, searchKey])

  const viewProviderDetail = async (providerId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/providers?userId=${providerId}`, { headers: authHeaders() })
      if (res.ok) {
        const d = await res.json()
        setProviderDetail({ id: d.id, phone: d.phone, role: d.role, status: d.status, profile: d.profile })
        setAvgRating(d.avgRating || 0); setReviewCount(d.reviewCount || 0); setProviderReviews(d.reviews || [])
        setLoading(false); navigate('provider-detail', { providerId }); return
      }
    } catch { /* */ }
    setLoading(false)
  }

  // ============================================================
  // ADMIN
  // ============================================================
  const [adminTab, setAdminTab] = useState('validation'); const [adminRoleFilter, setAdminRoleFilter] = useState(''); const [adminStatusFilter, setAdminStatusFilter] = useState('')
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false); const [suspendUserId, setSuspendUserId] = useState(''); const [suspendReason, setSuspendReason] = useState('')
  const [adminLoading, setAdminLoading] = useState(false); const [userDetailOpen, setUserDetailOpen] = useState(false); const [userDetailData, setUserDetailData] = useState<any>(null)
  const [annTitle, setAnnTitle] = useState(''); const [annMessage, setAnnMessage] = useState(''); const [annTargetType, setAnnTargetType] = useState('all'); const [annLoading, setAnnLoading] = useState(false)
  const [replyMsgId, setReplyMsgId] = useState(''); const [replyText, setReplyText] = useState(''); const [replyLoading, setReplyLoading] = useState(false); const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [adminSearchQuery, setAdminSearchQuery] = useState('')
  const [adminSortBy, setAdminSortBy] = useState<'createdAt' | 'name'>('createdAt')
  const [adminDateFrom, setAdminDateFrom] = useState('')
  const [adminDateTo, setAdminDateTo] = useState('')
  const [adminReviews, setAdminReviews] = useState<any[]>([])
  const [adminSectorsData, setAdminSectorsData] = useState<any[]>([])
  const [newSectorName, setNewSectorName] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [settingsWelcome, setSettingsWelcome] = useState('')
  const [settingsContactEmail, setSettingsContactEmail] = useState('')
  const [settingsMaintenanceMode, setSettingsMaintenanceMode] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [adminActions, setAdminActions] = useState<any[]>([])
  const [activeSectorEdit, setActiveSectorEdit] = useState<number | null>(null)
  const [adminCertRequests, setAdminCertRequests] = useState<any[]>([])
  const [certMsg, setCertMsg] = useState('')
  const [certActionUserId, setCertActionUserId] = useState('')
  const [certDialogOpen, setCertDialogOpen] = useState(false)
  const [certDialogAction, setCertDialogAction] = useState<'approve' | 'reject' | 'pending'>('approve')
  const [certLoading, setCertLoading] = useState(false)

  const fetchAdminData = async () => {
    if (!token) return
    try {
      const sr = await fetch('/api/admin/dashboard', { headers: authHeaders() }); if (sr.ok) setAdminStats(await sr.json())
      await fetchAdminUsers()
      const ar = await fetch('/api/admin/announcements', { headers: authHeaders() }); if (ar.ok) { const d = await ar.json(); setAdminAnnouncements(Array.isArray(d) ? d : d.announcements || []) }
      const mr = await fetch('/api/admin/messages', { headers: authHeaders() }); if (mr.ok) { const d = await mr.json(); setAdminMessages(Array.isArray(d) ? d : d.messages || []) }
      const rr = await fetch('/api/admin/reviews', { headers: authHeaders() }); if (rr.ok) setAdminReviews((await rr.json()).reviews || [])
      const sr2 = await fetch('/api/admin/sectors', { headers: authHeaders() }); if (sr2.ok) setAdminSectorsData((await sr2.json()).sectors || [])
      const srr = await fetch('/api/admin/settings', { headers: authHeaders() }); if (srr.ok) { const d = await srr.json(); if (d.welcome_message) setSettingsWelcome(d.welcome_message); if (d.contact_email) setSettingsContactEmail(d.contact_email); if (d.maintenance_mode) setSettingsMaintenanceMode(d.maintenance_mode === 'true') }
      const acr = await fetch('/api/admin/actions', { headers: authHeaders() }); if (acr.ok) setAdminActions((await acr.json()).actions || [])
      const ccr = await fetch('/api/admin/certification', { headers: authHeaders() }); if (ccr.ok) setAdminCertRequests((await ccr.json()).requests || [])
    } catch { /* */ }
  }
  const fetchAdminUsers = async () => { if (!token) return; try { const p = new URLSearchParams(); if (adminRoleFilter) p.set('role', adminRoleFilter); if (adminStatusFilter) p.set('status', adminStatusFilter); const r = await fetch(`/api/admin/users?${p.toString()}`, { headers: authHeaders() }); if (r.ok) { const d = await r.json(); setAdminUsers(Array.isArray(d) ? d : d.users || []) } } catch { /* */ } }
  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on view change
  useEffect(() => { if (currentView === 'admin-dashboard') void fetchAdminData() }, [currentView])
  useEffect(() => { if (currentView === 'admin-dashboard' && adminTab === 'utilisateurs') fetchAdminUsers() }, [adminRoleFilter, adminStatusFilter, adminTab])

  const handleAdminAction = async (userId: string, action: string, reason?: string) => { setAdminLoading(true); try { const b: any = { userId, action }; if (reason) b.reason = reason; const r = await fetch('/api/admin/validate', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(b) }); if (r.ok) { toast({ title: 'Succès' }); fetchAdminData() } else toast({ title: 'Erreur', variant: 'destructive' }) } catch { toast({ title: 'Erreur', variant: 'destructive' }) }; setAdminLoading(false) }
  const handleDeleteUser = async (userId: string) => { if (!confirm('Supprimer cet utilisateur ?')) return; setAdminLoading(true); try { const r = await fetch('/api/admin/users', { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ userId }) }); if (r.ok) { toast({ title: 'Succès' }); fetchAdminData() } } catch { /* */ }; setAdminLoading(false) }
  const handleSendAnnouncement = async () => { if (!annTitle || !annMessage) return; setAnnLoading(true); try { const b: any = { title: annTitle, message: annMessage, targetType: annTargetType }; const r = await fetch('/api/admin/announcements', { method: 'POST', headers: authHeaders(), body: JSON.stringify(b) }); if (r.ok) { toast({ title: 'Annonce envoyée' }); setAnnTitle(''); setAnnMessage(''); fetchAdminData() } } catch { /* */ }; setAnnLoading(false) }
  const handleReplyMessage = async () => { if (!replyMsgId || !replyText) return; setReplyLoading(true); try { const r = await fetch('/api/admin/messages', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ messageId: replyMsgId, reply: replyText }) }); if (r.ok) { toast({ title: 'Réponse envoyée' }); setReplyTexts(p => { const n = { ...p }; delete n[replyMsgId]; return n }); setReplyMsgId(''); setReplyText(''); fetchAdminData() } } catch { /* */ }; setReplyLoading(false) }
  const handleRejectDeletion = async (userId: string) => { try { const r = await fetch('/api/admin/users', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ userId, action: 'reject-deletion' }) }); if (r.ok) { toast({ title: 'Demande refusée' }); fetchAdminData() } else toast({ title: 'Erreur', variant: 'destructive' }) } catch { /* */ } }
  const handleReviewAction = async (reviewId: string, action: string) => { try { const r = await fetch('/api/admin/reviews', { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ reviewId, action }) }); if (r.ok) { const rr = await fetch('/api/admin/reviews', { headers: authHeaders() }); if (rr.ok) setAdminReviews((await rr.json()).reviews || []); toast({ title: 'Action effectuée' }) } } catch { /* */ } }
  const handleSaveSectors = async () => { try { const r = await fetch('/api/admin/sectors', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ sectors: adminSectorsData }) }); if (r.ok) { toast({ title: 'Secteurs mis à jour' }); fetchAdminData() } else toast({ title: 'Erreur', variant: 'destructive' }) } catch { /* */ } }
  const handleSaveSetting = async (key: string, value: string) => { try { const r = await fetch('/api/admin/settings', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ key, value }) }); if (r.ok) { toast({ title: 'Paramètre mis à jour' }); fetchAdminData() } } catch { /* */ } }
  const exportCSV = () => { const rows = [['Nom','Téléphone','Email','Rôle','Statut','Date d\'inscription'].join(',')]; const filtered = adminUsers.filter(u => { if (adminRoleFilter && adminRoleFilter !== 'all' && u.role !== adminRoleFilter) return false; if (adminStatusFilter && adminStatusFilter !== 'all' && u.status !== adminStatusFilter) return false; return true }).slice(0, 500); for (const u of filtered) { const name = u.profile?.companyName || u.profile?.fullName || ''; const date = new Date(u.createdAt).toLocaleDateString('fr-FR'); rows.push([`"${name}"`,u.phone,u.email||'',u.role,u.status,date].join(',')) } const blob = new Blob([rows.join('\n')], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'utilisateurs.csv'; a.click(); URL.revokeObjectURL(url) }
  const filteredUsers = useMemo(() => {
    let list = adminUsers.filter(u => {
      if (adminRoleFilter && adminRoleFilter !== 'all' && u.role !== adminRoleFilter) return false
      if (adminStatusFilter && adminStatusFilter !== 'all' && u.status !== adminStatusFilter) return false
      if (adminSearchQuery) {
        const q = adminSearchQuery.toLowerCase()
        const name = (u.profile?.companyName || u.profile?.fullName || '').toLowerCase()
        const phone = (u.phone || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        if (!name.includes(q) && !phone.includes(q) && !email.includes(q)) return false
      }
      if (adminDateFrom) {
        const d = new Date(u.createdAt); const f = new Date(adminDateFrom)
        if (d < f) return false
      }
      if (adminDateTo) {
        const d = new Date(u.createdAt); const t = new Date(adminDateTo)
        if (d > t) return false
      }
      return true
    })
    if (adminSortBy === 'name') {
      list.sort((a, b) => (a.profile?.companyName || a.profile?.fullName || '').localeCompare(b.profile?.companyName || b.profile?.fullName || ''))
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return list
  }, [adminUsers, adminRoleFilter, adminStatusFilter, adminSearchQuery, adminDateFrom, adminDateTo, adminSortBy])

  // Reviews
  const [reviewRating, setReviewRating] = useState(0); const [reviewComment, setReviewComment] = useState(''); const [reviewLoading, setReviewLoading] = useState(false); const [showReviewForm, setShowReviewForm] = useState(false)
  const submitReview = async () => { if (!providerDetail || !reviewRating) return; setReviewLoading(true); try { const r = await fetch('/api/reviews', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ targetId: providerDetail.id, targetType: providerDetail.role === 'ENTREPRISE' ? 'COMPANY' : 'PROVIDER', rating: reviewRating, comment: reviewComment }) }); if (r.ok) { toast({ title: t('publishedReview') }); setShowReviewForm(false); setReviewRating(0); setReviewComment(''); const rr = await fetch(`/api/reviews?targetId=${providerDetail.id}`); if (rr.ok) { const rd = await rr.json(); setProviderReviews(Array.isArray(rd) ? rd : rd.reviews || []) } } } catch { /* */ }; setReviewLoading(false) }

  // Profile edit
  const [editLoading, setEditLoading] = useState(false)
  const [editName, setEditName] = useState(''); const [editEmail, setEditEmail] = useState(''); const [editSector, setEditSector] = useState('')
  const [editServices, setEditServices] = useState<string[]>([]); const [editCustomService, setEditCustomService] = useState('')
  const [editProvince, setEditProvince] = useState(''); const [editDistrict, setEditDistrict] = useState(''); const [editCommune, setEditCommune] = useState(''); const [editNationalScope, setEditNationalScope] = useState(false)
  const [editDescription, setEditDescription] = useState(''); const [editSocialFB, setEditSocialFB] = useState(''); const [editSocialIG, setEditSocialIG] = useState(''); const [editSocialTW, setEditSocialTW] = useState('')
  const [editPhoto, setEditPhoto] = useState<File | null>(null); const [editPhotoPreview, setEditPhotoPreview] = useState('')
  const [editCompanyName, setEditCompanyName] = useState(''); const [editCompanyType, setEditCompanyType] = useState('')
  const [editEmployeeCount, setEditEmployeeCount] = useState(''); const [editWebsite, setEditWebsite] = useState(''); const [editFullAddress, setEditFullAddress] = useState('')

  // eslint-disable-next-line react-hooks/set-state-in-effect -- form initialization from data
  useEffect(() => { if (currentView === 'profile-edit' && user?.profile) { const p = user.profile; setEditName(p.fullName || ''); setEditEmail(user.email || ''); setEditSector(p.sector || ''); setEditServices(p.services || []); setEditProvince(p.province || ''); setEditDistrict(''); setEditCommune(p.commune || ''); setEditNationalScope(p.nationalScope || false); setEditDescription(p.description || ''); setEditSocialFB(p.socialMedia?.facebook || ''); setEditSocialIG(p.socialMedia?.instagram || ''); setEditSocialTW(p.socialMedia?.twitter || ''); setEditCompanyName(p.companyName || ''); setEditCompanyType(p.companyType || ''); setEditEmployeeCount(p.employeeCount?.toString() || ''); setEditWebsite(p.website || ''); setEditFullAddress(p.fullAddress || ''); setEditPhotoPreview(p.photo || p.logo || '') } }, [currentView, user])

  const handleSaveProfile = async () => {
    if (!token || !user) return; setEditLoading(true)
    try {
      const profile: any = {}
      if (user.role === 'CLIENT') { profile.fullName = editName; profile.email = editEmail }
      else if (user.role === 'PRESTATAIRE') {
        profile.fullName = editName; profile.email = editEmail; profile.sector = editSector; profile.services = editServices
        profile.province = editProvince; profile.commune = editCommune; profile.nationalScope = editNationalScope; profile.description = editDescription
        const social: any = {}; if (editSocialFB) social.facebook = editSocialFB; if (editSocialIG) social.instagram = editSocialIG; if (editSocialTW) social.twitter = editSocialTW; profile.socialMedia = social
      } else if (user.role === 'ENTREPRISE') {
        profile.companyName = editCompanyName; profile.email = editEmail; profile.sector = editSector; profile.services = editServices
        profile.companyType = editCompanyType; profile.employeeCount = editEmployeeCount ? parseInt(editEmployeeCount) : undefined
        profile.website = editWebsite; profile.fullAddress = editFullAddress
        profile.province = editProvince; profile.commune = editCommune; profile.nationalScope = editNationalScope
        const social: any = {}; if (editSocialFB) social.facebook = editSocialFB; if (editSocialIG) social.instagram = editSocialIG; if (editSocialTW) social.twitter = editSocialTW; profile.socialMedia = social
      }
      const res = await fetch('/api/auth/me/profile', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(profile) })
      if (res.ok) {
        if (editPhoto) { const fd = new FormData(); fd.append('file', editPhoto); fd.append('type', user.role === 'ENTREPRISE' ? 'company-logo' : 'provider-photo'); await fetch('/api/upload', { method: 'POST', headers: multiPartHeaders(), body: fd }) }
        toast({ title: t('saved'), description: t('savedDesc') })
        const mr = await fetch('/api/auth/me', { headers: authHeaders() }); if (mr.ok) { const md = await mr.json(); setUser({ id: md.id, phone: md.phone, email: md.email, role: md.role, status: md.status, certified: md.certified, certificationStatus: md.certificationStatus, certificationMessage: md.certificationMessage, autoReplyMessage: md.autoReplyMessage, deletionReason: md.deletionReason, deletionRequestedAt: md.deletionRequestedAt, profile: md.profile || undefined }) }
        if (user.role === 'CLIENT') navigate('client-dashboard'); else if (user.role === 'PRESTATAIRE') navigate('prestataire-dashboard'); else navigate('entreprise-dashboard')
      } else toast({ title: 'Erreur', variant: 'destructive' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    setEditLoading(false)
  }

  // Settings
  const [contactName, setContactName] = useState(''); const [contactEmail, setContactEmail] = useState(''); const [contactMessage, setContactMessage] = useState(''); const [contactLoading, setContactLoading] = useState(false)
  const [showChangePass, setShowChangePass] = useState(false); const [newPassword, setNewPassword] = useState(''); const [changePassLoading, setChangePassLoading] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on view change
  useEffect(() => { if (currentView === 'settings') { void fetchNotifications(); void fetchContactMessages() } }, [currentView])
  const handleContact = async () => { if (!contactName || !contactEmail || !contactMessage) return; setContactLoading(true); try { const r = await fetch('/api/contact', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMessage }) }); if (r.ok) { toast({ title: t('send') }); setContactName(''); setContactEmail(''); setContactMessage('') } } catch { /* */ }; setContactLoading(false) }
  const handleChangePassword = async () => { if (!newPassword || newPassword.length < 6) return; setChangePassLoading(true); try { const r = await fetch('/api/auth/me/profile', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ newPassword }) }); if (r.ok) { toast({ title: 'Mot de passe modifié' }); setShowChangePass(false); setNewPassword('') } } catch { /* */ }; setChangePassLoading(false) }

  // Auto-reply save
  const handleSaveAutoReply = async () => { if (!token) return; setAutoReplyLoading(true); try { const r = await fetch('/api/auth/me/profile', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ autoReplyMessage: autoReplyMsg || null }) }); if (r.ok) { toast({ title: 'Message automatique enregistré' }); setUser(p => p ? { ...p, autoReplyMessage: autoReplyMsg || null } : p) } else toast({ title: 'Erreur', variant: 'destructive' }) } catch { /* */ }; setAutoReplyLoading(false) }

  // Deletion request
  const handleRequestDeletion = async () => { if (!deletionReason || deletionReason.length < 5) { toast({ title: 'Erreur', description: 'Minimum 5 caractères', variant: 'destructive' }); return }; setDeletionLoading(true); try { const r = await fetch('/api/account', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ reason: deletionReason }) }); if (r.ok) { toast({ title: 'Demande envoyée', description: "L'admin va traiter votre demande." }); setUser(p => p ? { ...p, deletionReason, deletionRequestedAt: new Date().toISOString() } : p) } } catch { /* */ }; setDeletionLoading(false) }
  const handleCancelDeletion = async () => { if (!token) return; try { const r = await fetch('/api/account', { method: 'DELETE', headers: authHeaders() }); if (r.ok) { toast({ title: 'Demande annulée' }); setDeletionReason(''); setUser(p => p ? { ...p, deletionReason: null, deletionRequestedAt: null } : p) } } catch { /* */ } }

  /* eslint-disable react-hooks/set-state-in-effect -- suspend overlay sync */
  useEffect(() => {
    if (!token || !user) return
    if (user.status === 'suspended') {
      (async () => {
        try {
          const r = await fetch('/api/notifications', { headers: authHeaders() })
          if (r.ok) {
            const d = await r.json()
            const notifs: AppNotification[] = d.notifications || []
            const suspNotif = notifs.find(n => n.type === 'warning')
            if (suspNotif) setSuspensionNotif({ message: suspNotif.message })
          }
        } catch {}
      })()
    } else if (suspensionNotif) {
      setSuspensionNotif(null)
    }
  }, [user?.status, suspensionNotif])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Provider dashboard
  const [providerDashReviews, setProviderDashReviews] = useState<Review[]>([]); const [providerDashAvg, setProviderDashAvg] = useState(0); const [providerDashCount, setProviderDashCount] = useState(0)
  useEffect(() => {
    if (currentView === 'prestataire-dashboard' || currentView === 'entreprise-dashboard') {
      (async () => {
        if (!token || !user) return
        try { const r = await fetch(`/api/reviews?targetId=${user.id}`); if (r.ok) { const d = await r.json(); const revs = Array.isArray(d) ? d : d.reviews || []; setProviderDashReviews(revs); if (revs.length > 0) { setProviderDashAvg(revs.reduce((a: number, r: Review) => a + r.rating, 0) / revs.length) }; setProviderDashCount(revs.length) } } catch { /* */ }
        fetchNotifications()
      })()
    }
  }, [currentView])

  // ============================================================
  // SUSPENDED OVERLAY
  // ============================================================
  const renderSuspendedOverlay = () => {
    if (user?.status !== 'suspended') return null
    return (
      <div className="fixed inset-0 z-[100] bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-900/30 flex items-center justify-center mb-6"><Ban className="h-10 w-10 text-red-400" /></div>
          <h1 className="text-2xl font-bold text-white mb-3">⚠️ Compte Suspendu</h1>
          <p className="text-red-300 mb-4">Votre compte a été suspendu temporairement.</p>
          {suspensionNotif && <div className="bg-gray-900 border border-red-800 p-4 rounded-lg mb-6 text-left"><p className="text-gray-300 text-sm">{suspensionNotif.message}</p></div>}
          <Button variant="outline" className="text-gray-400 border-gray-700 hover:bg-gray-800" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Se déconnecter</Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // SETTINGS FLOATER (theme + language)
  // ============================================================
  const SettingsFloater = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`rounded-full ${theme === 'dark' ? 'border-gray-600 text-gray-300 bg-gray-800' : 'border-gray-200 bg-white/80 backdrop-blur-sm'}`} style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">{t('theme')}</p>
          <div className="grid grid-cols-3 gap-1">
            {[{ v: 'green' as ThemeMode, icon: <Sun className="h-4 w-4" />, label: 'Vert' }, { v: 'dark' as ThemeMode, icon: <Moon className="h-4 w-4" />, label: 'Sombre' }, { v: 'red' as ThemeMode, icon: <Palette className="h-4 w-4" />, label: 'Rouge' }].map(o => (
              <button key={o.v} onClick={() => setTheme(o.v)} className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs ${theme === o.v ? (theme === 'red' ? 'border-red-500 bg-red-50 text-red-700' : theme === 'dark' ? 'border-emerald-500 bg-emerald-950 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-700') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {o.icon}{o.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase pt-2">{t('language')}</p>
          <Select value={lang} onValueChange={(v) => setLang(v as Language)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(languageNames).map(([code, name]) => <SelectItem key={code} value={code}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // ============================================================
  // BOTTOM NAV
  // ============================================================
  const renderBottomNav = (activeTab: string) => {
    const items = [
      { id: 'home', view: 'client-dashboard' as ViewName, icon: <Home className="h-5 w-5" />, label: t('search') },
      { id: 'search', view: 'browse-sectors' as ViewName, icon: <Search className="h-5 w-5" />, label: t('sector') },
      { id: 'chat', view: 'chat' as ViewName, icon: <MessageSquare className="h-5 w-5" />, label: t('chat') },
      { id: 'notifications', view: 'notifications' as ViewName, icon: <Bell className="h-5 w-5" />, label: t('notifications') },
      { id: 'profile', view: 'settings' as ViewName, icon: <User className="h-5 w-5" />, label: t('settings') },
    ]
    return (
      <nav className={`fixed bottom-0 left-0 right-0 ${th.navBg} ${th.navBorder} border-t z-50 safe-area-pb`}>
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {items.map(item => (
            <button key={item.id} onClick={() => navigate(item.view)} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${activeTab === item.view || (item.id === 'home' && activeTab === 'client-dashboard') ? th.navActive : th.navInactive}`}>
              <div className="relative">{item.icon}{item.id === 'notifications' && unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}{item.id === 'chat' && conversations.filter(c => c.unreadCount > 0).length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">!</span>}</div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    )
  }

  // ============================================================
  // RENDER: LANDING
  // ============================================================
  const renderLanding = () => (
    <div className={`min-h-screen bg-gradient-to-b ${th.gradientFrom} ${th.gradientTo}`}>
      <SettingsFloater />
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><img src="/logo.png" alt="VServiceRDC" className="h-9 w-auto" /><span className={`font-bold text-lg ${th.accent}`}>VServiceRDC</span></div>
          <div className="flex gap-2">
            <Select value={lang} onValueChange={(v) => setLang(v as Language)}>
              <SelectTrigger className="w-auto h-8 text-xs border-gray-200"><Globe className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(languageNames).map(([c, n]) => <SelectItem key={c} value={c}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" className={`${th.accent} text-sm`} onClick={() => navigate('login')}>{t('login')}</Button>
            <Button className={`${th.primary} ${th.primaryText}`} onClick={() => navigate('register')}>{t('register')}</Button>
          </div>
        </div>
      </header>
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${th.badgeBg} ${th.badgeText} text-sm font-medium mb-6`}><Sparkles className="h-4 w-4" /> {t('appSlogan')}</div>
        <h1 className={`text-4xl md:text-6xl font-bold ${th.textPrimary} leading-tight mb-6`}>{t('appDescription').split('.')[0]} <span className={th.accent}>.</span></h1>
        <p className={`text-lg md:text-xl ${th.textSecondary} max-w-2xl mx-auto mb-10`}>{t('appDescription')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className={`${th.primary} ${th.primaryText} text-lg px-8 py-6 rounded-xl`} onClick={() => navigate('register')}>{t('register')} <ArrowRight className="h-5 w-5 ml-2" /></Button>
          <Button size="lg" variant="outline" className={`${th.accentBorder} ${th.accent} hover:${th.accentLight} text-lg px-8 py-6 rounded-xl`} onClick={() => navigate('login')}>{t('login')}</Button>
        </div>
        <div className="mt-8">
          <Button variant="outline" className={`gap-2 ${th.accentBorder} ${th.accent}`} onClick={() => { if (typeof window !== 'undefined' && (window as any).deferredPWAInstall) { (window as any).deferredPWAInstall.prompt(); return } toast({ title: t('downloadMobile'), description: t('installInstructions'), duration: 8000 }) }}>
            <Smartphone className="h-5 w-5" />{t('downloadMobile')}<Download className="h-4 w-4" />
          </Button>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className={`text-2xl md:text-3xl font-bold text-center ${th.textPrimary} mb-12`}>{t('verifiedProviders')} / {t('localSearch')} / {t('ratings')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <ShieldCheck className="h-8 w-8" />, title: t('verifiedProviders'), desc: t('verifiedProvidersDesc') },
            { icon: <MapPin className="h-8 w-8" />, title: t('localSearch'), desc: t('localSearchDesc') },
            { icon: <Star className="h-8 w-8" />, title: t('ratings'), desc: t('ratingsDesc') },
          ].map((f, i) => (
            <Card key={i} className={`${th.accentBorder} hover:shadow-lg transition-shadow`}><CardContent className="pt-6 text-center"><div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${th.accentLight} ${th.accent} mb-4`}>{f.icon}</div><h3 className={`font-semibold text-lg ${th.textPrimary} mb-2`}>{f.title}</h3><p className={th.textSecondary}>{f.desc}</p></CardContent></Card>
          ))}
        </div>
      </section>
      <footer className={`border-t ${th.accentBorder} mt-16`}>
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4"><img src="/logo.png" alt="VServiceRDC" className="h-7 w-auto" /><span className={`font-semibold ${th.accent}`}>VServiceRDC</span></div>
          <p className={`text-sm ${th.textSecondary}`}>La plateforme de référence pour les services en RDC</p>
          <p className="text-sm text-gray-400 mt-2">{t('createdBy')} <span className={`font-semibold ${th.accent}`}>HenoBuild</span></p>
        </div>
      </footer>
    </div>
  )

  // ============================================================
  // RENDER: LOGIN
  // ============================================================
  const renderLogin = () => (
    <div className={`min-h-screen flex flex-col items-center justify-start pt-8 px-4 pb-24 bg-gradient-to-b ${th.gradientFrom} ${th.gradientTo}`}>
      <SettingsFloater />
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate('landing')} className={`mb-6 ${th.accent} hover:${th.accentLight}`}><ChevronLeft className="h-4 w-4 mr-1" /> {t('back')}</Button>
        <div className="text-center mb-8"><img src="/logo.png" alt="VServiceRDC" className="h-16 w-auto mx-auto mb-3" /><h1 className={`text-2xl font-bold ${th.textPrimary}`}>{t('login')}</h1></div>
        <Card className="shadow-lg"><CardContent className="pt-6 space-y-4">
          <div className="flex items-center space-x-2"><Checkbox id="adm-tog" checked={loginIsAdmin} onCheckedChange={(v) => setLoginIsAdmin(v === true)} /><Label htmlFor="adm-tog" className="text-sm cursor-pointer font-medium"><Shield className="h-4 w-4 inline-block mr-1" />{t('adminSpace')}</Label></div>
          <Separator />
          {loginIsAdmin ? (<div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${th.alertBg} ${th.accentBorder}`}><Shield className={`h-8 w-8 ${th.accent}`} /><div><p className="text-sm font-semibold">{t('adminSpace')}</p></div></div>
            <div className="space-y-2"><Label>{t('adminPassword')}</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input type={showLoginPass ? 'text' : 'password'} placeholder="••••••••" value={loginAdminPass} onChange={e => setLoginAdminPass(e.target.value)} className="pl-10 pr-10" onKeyDown={e => e.key === 'Enter' && handleLogin()} /><button onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <Button className={`w-full ${th.primary} ${th.primaryText}`} onClick={handleLogin} disabled={loginLoading}>{loginLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{t('accessAdmin')}</Button>
          </div>) : (<>
            <div className="space-y-2"><Label>{t('phone')}</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="+243 XXX XXX XXX" value={loginPhone} onChange={e => setLoginPhone(formatPhone(e.target.value))} className="pl-10" /></div></div>
            <div className="space-y-2"><Label>{t('password')}</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input type={showLoginPass ? 'text' : 'password'} placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="pl-10 pr-10" onKeyDown={e => e.key === 'Enter' && handleLogin()} /><button onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <Button className={`w-full ${th.primary} ${th.primaryText}`} onClick={handleLogin} disabled={loginLoading}>{loginLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{t('login')}</Button>
            <p className={`text-center text-sm ${th.textSecondary}`}>{t('noAccount')} <button onClick={() => navigate('register')} className={`font-medium ${th.accent} hover:underline`}>{t('register')}</button></p>
          </>)}
        </CardContent></Card>
      </div>
    </div>
  )

  // ============================================================
  // RENDER: REGISTER (step 0 = type select, step 1 = form)
  // ============================================================
  const renderRegister = () => {
    if (regStep === 0) return (
      <div className={`min-h-screen flex flex-col items-center justify-start pt-8 px-4 pb-24 bg-gradient-to-b ${th.gradientFrom} ${th.gradientTo}`}>
        <SettingsFloater />
        <div className="w-full max-w-md">
          <Button variant="ghost" onClick={() => navigate('landing')} className={`mb-6 ${th.accent}`}><ChevronLeft className="h-4 w-4 mr-1" />{t('back')}</Button>
          <div className="text-center mb-8"><img src="/logo.png" alt="VServiceRDC" className="h-14 w-auto mx-auto mb-3" /><h1 className={`text-2xl font-bold ${th.textPrimary}`}>{t('register')}</h1></div>
          <div className="space-y-3">
            {[{ type: 'CLIENT' as AccountType, icon: <User className="h-8 w-8" />, title: t('client'), desc: t('clientDesc') }, { type: 'PRESTATAIRE' as AccountType, icon: <Wrench className="h-8 w-8" />, title: t('prestataire'), desc: t('prestataireDesc') }, { type: 'ENTREPRISE' as AccountType, icon: <Building2 className="h-8 w-8" />, title: t('entreprise'), desc: t('entrepriseDesc') }].map(item => (
              <Card key={item.type} className={`cursor-pointer hover:${th.accentBorder} hover:shadow-md transition-all ${th.accentBorder}`} onClick={() => { setRegType(item.type); setRegStep(1) }}>
                <CardContent className="flex items-center gap-4 p-4"><div className={`flex-shrink-0 w-14 h-14 rounded-full ${th.accentLight} flex items-center justify-center ${th.accent}`}>{item.icon}</div><div><h3 className={`font-semibold ${th.textPrimary}`}>{item.title}</h3><p className={`text-sm ${th.textSecondary}`}>{item.desc}</p></div><ArrowRight className="h-5 w-5 text-gray-400 ml-auto" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
    return (
      <div className={`min-h-screen flex flex-col items-center justify-start pt-8 px-4 pb-24 bg-gradient-to-b ${th.gradientFrom} ${th.gradientTo}`}>
        <SettingsFloater />
        <div className="w-full max-w-lg">
          <Button variant="ghost" onClick={() => { setRegStep(0); resetRegForm() }} className={`mb-4 ${th.accent}`}><ChevronLeft className="h-4 w-4 mr-1" />{t('back')}</Button>
          <div className="text-center mb-6"><h1 className={`text-2xl font-bold ${th.textPrimary}`}>{t('register')} {regType}</h1></div>
          <ScrollArea className="max-h-[calc(100vh-200px)]"><Card className="shadow-lg mb-6"><CardContent className="pt-6 space-y-4">
            {regType === 'ENTREPRISE' ? (<div className="space-y-2"><Label>{t('companyName')} *</Label><Input placeholder="ABC Construction SARL" value={regCompanyName} onChange={e => setRegCompanyName(e.target.value)} /></div>) : (<div className="space-y-2"><Label>{t('fullName')}</Label><Input placeholder="Jean Dupont" value={regName} onChange={e => setRegName(e.target.value)} /></div>)}
            <div className="space-y-2"><Label>{t('email')}</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input type="email" placeholder="email@exemple.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="pl-10" /></div></div>
            <div className="space-y-2"><Label>{t('phone')} *</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="+243 XXX XXX XXX" value={regPhone} onChange={e => setRegPhone(formatPhone(e.target.value))} className="pl-10" /></div></div>
            <div className="space-y-2"><Label>{t('password')} *</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input type={showRegPass ? 'text' : 'password'} placeholder="Min 6 caractères" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="pl-10 pr-10" /><button onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showRegPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><Button variant="outline" size="sm" className={`${th.accent} ${th.accentBorder}`} onClick={handleGeneratePassword}><Key className="h-3 w-3 mr-1" />{t('generating')}</Button></div>
            {regType === 'CLIENT' && <div className="space-y-2"><Label>{t('confirmPassword')} *</Label><Input type="password" placeholder="Confirmer" value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} /></div>}
            <Separator />
            {regType === 'PRESTATAIRE' && <div className="space-y-2"><Label>{t('photo')}</Label><div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={regPhotoPreview} /><AvatarFallback><Camera className="h-6 w-6" /></AvatarFallback></Avatar><label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f, setRegPhoto, setRegPhotoPreview) }} /><Button variant="outline" size="sm" asChild><span><Upload className="h-3 w-3 mr-1" />{t('chooseFile')}</span></Button></label></div></div>}
            {regType === 'ENTREPRISE' && <>
              <div className="space-y-2"><Label>{t('logo')}</Label><div className="flex items-center gap-4"><Avatar className="h-16 w-16 rounded-lg"><AvatarImage src={regLogoPreview} /><AvatarFallback><Store className="h-6 w-6" /></AvatarFallback></Avatar><label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f, setRegLogo, setRegLogoPreview) }} /><Button variant="outline" size="sm" asChild><span><Upload className="h-3 w-3 mr-1" />Logo</span></Button></label></div></div>
              <div className="space-y-2"><Label>{t('coverPhoto')}</Label>{regCoverPreview ? (<div className="relative rounded-lg overflow-hidden"><img src={regCoverPreview} alt="Cover" className="w-full h-32 object-cover" /><button onClick={() => { setRegCover(null); setRegCoverPreview('') }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><X className="h-4 w-4" /></button></div>) : (<label className="cursor-pointer block"><input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f, setRegCover, setRegCoverPreview) }} /><div className={`border-2 border-dashed ${th.accentBorder} rounded-lg p-6 text-center`}><Upload className={`h-8 w-8 mx-auto ${th.accent} mb-2`} /><p className={`text-sm ${th.textSecondary}`}>{t('chooseFile')}</p></div></label>)}</div>
            </>}
            <Separator />
            {(regType === 'PRESTATAIRE' || regType === 'ENTREPRISE') && <>
              <div className="space-y-2"><Label>{t('sector')} *</Label><Select value={regSector} onValueChange={v => { setRegSector(v); setRegServices([]) }}><SelectTrigger className="w-full"><SelectValue placeholder={t('sector')} /></SelectTrigger><SelectContent>{getAllSectorNames().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              {regSector && <div className="space-y-2"><Label>{t('service')} *</Label>
                <div className="grid grid-cols-1 gap-2">{getServicesBySector(regSector).map(s => (<div key={s} className="flex items-center space-x-2"><Checkbox id={`svc-${s}`} checked={regServices.includes(s)} onCheckedChange={() => toggleService(s)} /><Label htmlFor={`svc-${s}`} className="text-sm font-normal cursor-pointer">{s}</Label></div>))}</div>
                <div className="flex gap-2 mt-2"><Input placeholder={t('customServicePlaceholder')} value={regCustomService} onChange={e => setRegCustomService(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomService())} /><Button variant="outline" size="sm" onClick={addCustomService}><Plus className="h-4 w-4" /></Button></div>
              </div>}
              {regType === 'ENTREPRISE' && <><div className="space-y-2"><Label>{t('companyType')}</Label><Select value={regCompanyType} onValueChange={setRegCompanyType}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individuelle">Individuelle</SelectItem><SelectItem value="avec_employes">Avec employés</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>{t('employeeCount')}</Label><Input type="number" placeholder="15" value={regEmployeeCount} onChange={e => setRegEmployeeCount(e.target.value)} /></div><div className="space-y-2"><Label>{t('website')}</Label><Input placeholder="https://..." value={regWebsite} onChange={e => setRegWebsite(e.target.value)} /></div><div className="space-y-2"><Label>{t('fullAddress')}</Label><Input placeholder="Numéro, avenue..." value={regFullAddress} onChange={e => setRegFullAddress(e.target.value)} /></div></>}
              <div className="flex items-center space-x-2"><Checkbox id="ns" checked={regNationalScope} onCheckedChange={(v) => setRegNationalScope(v === true)} /><Label htmlFor="ns" className="text-sm cursor-pointer">{t('nationalScope')}</Label></div>
              {!regNationalScope && <div className="space-y-2"><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>{t('province')}</Label><Select value={regProvince} onValueChange={v => { setRegProvince(v); setRegDistrict(''); setRegCommune('') }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{getAllProvinceNames().map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>{regProvince === 'Kinshasa' && <div className="space-y-2"><Label>District</Label><Select value={regDistrict} onValueChange={v => { setRegDistrict(v); setRegCommune('') }}><SelectTrigger className="w-full"><SelectValue placeholder="Choisir un district" /></SelectTrigger><SelectContent>{(Object.keys(kinshasaDistricts) as KinshasaDistrict[]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>}</div><div className="grid grid-cols-1 gap-3"><div className="space-y-2"><Label>{t('commune')}</Label><Select value={regCommune} onValueChange={setRegCommune} disabled={!regProvince || (regProvince === 'Kinshasa' && !regDistrict)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{regProvince === 'Kinshasa' && regDistrict ? kinshasaDistricts[regDistrict as KinshasaDistrict].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) : regProvince && regProvince !== 'Kinshasa' ? getCommunes(regProvince).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) : null}</SelectContent></Select></div></div></div>}
            </>}
            <div className="space-y-2"><Label>{t('description')}</Label><Textarea placeholder={t('descriptionPlaceholder')} value={regDescription} onChange={e => setRegDescription(e.target.value)} rows={3} /></div>
            <Button className={`w-full ${th.primary} ${th.primaryText}`} onClick={handleRegister} disabled={regLoading}>{regLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{t('register')}</Button>
          </CardContent></Card></ScrollArea>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER: CLIENT DASHBOARD
  // ============================================================
  const renderClientDashboard = () => (
    <div className={`min-h-screen ${th.pageBg} pb-20`}>
      {renderSuspendedOverlay()}
      <SettingsFloater />
      {(user as any)?.deletionRequestedAt && <Alert className="mx-4 mt-2 max-w-lg border-amber-200 bg-amber-50"><AlertTriangle className="h-4 w-4 text-amber-600" /><AlertTitle className="text-amber-800">Demande de suppression en cours</AlertTitle><AlertDescription className="text-amber-700 text-xs">Vous avez demandé la suppression de votre compte. L'admin va traiter votre demande.</AlertDescription></Alert>}
      <div className={`${th.headerBg} ${th.headerText} px-4 pt-6 pb-8`}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><img src="/logo.png" alt="VServiceRDC" className="h-8 w-auto" /><span className="font-bold text-lg">VServiceRDC</span></div></div>
          <h2 className="text-xl font-bold mb-1">{t('hello')}{user?.profile?.fullName ? `, ${user.profile.fullName}` : ''} 👋</h2>
          <p className="text-white/80 text-sm">{t('findBestProviders')}</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* What are you looking for */}
        <Card className="shadow-lg mb-4"><CardContent className="pt-4 pb-4">
          <h3 className={`font-bold text-lg ${th.textPrimary} mb-3`}>{t('whatAreYouLookingFor')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => searchByType('PRESTATAIRE')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${searchTargetType === 'PRESTATAIRE' ? `${th.accentBorder} ${th.accentLight}` : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-14 h-14 rounded-full ${th.accentLight} flex items-center justify-center ${th.accent}`}><Wrench className="h-7 w-7" /></div><span className={`font-semibold ${th.textPrimary}`}>{t('findPrestataire')}</span></button>
            <button onClick={() => searchByType('ENTREPRISE')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${searchTargetType === 'ENTREPRISE' ? `${th.accentBorder} ${th.accentLight}` : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-14 h-14 rounded-full ${th.accentLight} flex items-center justify-center ${th.accent}`}><Building2 className="h-7 w-7" /></div><span className={`font-semibold ${th.textPrimary}`}>{t('findEntreprise')}</span></button>
          </div>
        </CardContent></Card>
        {/* Search filters */}
        <Card className="shadow-lg mb-4"><CardContent className="pt-4 pb-4 space-y-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder={t('searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={searchProvince} onValueChange={v => { setSearchProvince(v); setSearchDistrict(''); setSearchCommune('') }}><SelectTrigger className="w-full text-sm"><SelectValue placeholder={t('province')} /></SelectTrigger><SelectContent>{getAllProvinceNames().map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            {searchProvince === 'Kinshasa' && !searchAllCommunes && <Select value={searchDistrict} onValueChange={v => { setSearchDistrict(v); setSearchCommune('') }}><SelectTrigger className="w-full text-sm"><SelectValue placeholder="District" /></SelectTrigger><SelectContent>{(Object.keys(kinshasaDistricts) as KinshasaDistrict[]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>}
            <div className="space-y-1"><Select value={searchCommune} onValueChange={setSearchCommune} disabled={!searchProvince || searchAllCommunes || (searchProvince === 'Kinshasa' && !searchDistrict)}><SelectTrigger className="w-full text-sm"><SelectValue placeholder={t('commune')} /></SelectTrigger><SelectContent>{searchProvince === 'Kinshasa' && searchDistrict ? kinshasaDistricts[searchDistrict as KinshasaDistrict].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) : searchProvince && searchProvince !== 'Kinshasa' ? getCommunes(searchProvince).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) : null}</SelectContent></Select><div className="flex items-center gap-2"><Checkbox id="all-com" checked={searchAllCommunes} onCheckedChange={(v) => { setSearchAllCommunes(v === true); if (v === true) { setSearchCommune(''); setSearchDistrict('') } }} /><Label htmlFor="all-com" className="text-xs text-gray-500 cursor-pointer">Toutes les communes</Label></div></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={searchSector} onValueChange={v => { setSearchSector(v); setSearchService('') }}><SelectTrigger className="w-full text-sm"><SelectValue placeholder={t('sector')} /></SelectTrigger><SelectContent>{getAllSectorNames().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={searchService} onValueChange={setSearchService} disabled={!searchSector}><SelectTrigger className="w-full text-sm"><SelectValue placeholder={t('service')} /></SelectTrigger><SelectContent>{searchSector && getServicesBySector(searchSector).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="relative"><Input placeholder="Écrire un service à rechercher..." value={customServiceInput} onChange={e => setCustomServiceInput(e.target.value)} className="pr-10" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /></div>
          <Button className={`w-full ${th.primary} ${th.primaryText}`} onClick={() => { if (customServiceInput.trim()) { setSearchService(''); setSearchSector(''); setSearchQuery(customServiceInput.trim()); handleSearch(false); setCustomServiceInput('') } else handleSearch(false) }}>{searchLoading ? <Globe className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}{t('search')}</Button>
        </CardContent></Card>
        {/* Results */}
        {searchLoading ? <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full rounded" /></CardContent></Card>)}</div> : hasSearched ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between"><p className={`text-sm font-medium ${th.textPrimary}`}>{searchTotal} {searchTargetType === 'ENTREPRISE' ? 'entreprise(s)' : searchTargetType === 'PRESTATAIRE' ? 'prestataire(s)' : 'résultat(s)'}</p>{searchTotalPages > 1 && <div className="flex items-center gap-1"><Button variant="outline" size="sm" disabled={searchPage <= 1} onClick={() => handleSearch(false, searchPage - 1)}><ChevronLeft className="h-3 w-3" /></Button><span className="text-xs text-gray-500 px-1">{searchPage}/{searchTotalPages}</span><Button variant="outline" size="sm" disabled={searchPage >= searchTotalPages} onClick={() => handleSearch(false, searchPage + 1)}><ChevronRight className="h-3 w-3" /></Button></div>}</div>
            {searchResults.map(p => (
              <Card key={p.id} className={`hover:shadow-md transition-shadow ${th.accentBorder}`}>
                <CardContent className="p-4"><div className="flex gap-3" onClick={() => viewProviderDetail(p.id)} style={{ cursor: 'pointer' }}>
                  <Avatar className="h-14 w-14 flex-shrink-0"><AvatarImage src={p.profile?.logo || p.profile?.photo} /><AvatarFallback className={theme === 'red' ? 'bg-red-50 text-red-700' : theme === 'dark' ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}>{getInitials(p.profile?.companyName || p.profile?.fullName || 'P')}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2"><h3 className={`font-semibold ${th.textPrimary} truncate`}>{p.profile?.companyName || p.profile?.fullName || 'Sans nom'}</h3><div className="flex items-center gap-1">{p.status && getStatusBadge(p.status, theme)}{p.certified && <Badge className="bg-amber-500 text-white text-[10px]"><ShieldCheck className="h-3 w-3 mr-0.5" />Certifié</Badge>}</div></div><p className={th.accent}>{p.profile?.sector || ''}</p>{(p.profile?.province || p.profile?.nationalScope) && <div className={`flex items-center gap-1 text-xs ${th.textSecondary} mt-1`}><MapPin className="h-3 w-3" />{p.profile?.nationalScope ? 'RDC' : `${p.profile?.province}${p.profile?.commune ? `, ${p.profile.commune}` : ''}`}</div>}{p.profile?.services && p.profile.services.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{p.profile.services.slice(0, 3).map(s => <Badge key={s} variant="secondary" className={`text-xs ${theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{s}</Badge>)}</div>}</div>
                </div>
                {user && user.role === 'CLIENT' && <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100"><Button size="sm" className={`flex-1 ${th.primary} ${th.primaryText}`} onClick={(e) => { e.stopPropagation(); openChat(p.id, p.profile?.companyName || p.profile?.fullName, p.profile?.logo || p.profile?.photo) }}><MessageSquare className="h-3 w-3 mr-1" />Engager conversation</Button><Button size="sm" variant="outline" className={`${th.accentBorder} ${th.accent}`} asChild><a href={`tel:${p.phone}`} onClick={e => e.stopPropagation()}><Phone className="h-3 w-3 mr-1" />Appeler</a></Button></div>}
              </CardContent>
              </Card>
            ))}
            {searchResults.length === 0 && <div className="text-center py-12"><Search className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className={th.textSecondary}>{t('noResults')}</p><p className="text-xs text-gray-400 mt-1">Essayez de modifier vos critères ou cherchez un autre service.</p></div>}
          </div>
        ) : <div className="text-center py-12"><Search className={`h-12 w-12 mx-auto ${th.accentLight} mb-3`} /><p className={th.textSecondary}>{t('whatAreYouLookingFor')}</p></div>}
      </div>
      {renderBottomNav('client-dashboard')}
    </div>
  )

  // ============================================================
  // RENDER: BROWSE SECTORS
  // ============================================================
  const renderBrowseSectors = () => (
    <div className={`min-h-screen ${th.pageBg} pb-20`}>
      <SettingsFloater />
      <div className={`bg-white ${th.accentBorder} border-b px-4 py-4 sticky top-0 z-50`}><div className="max-w-lg mx-auto flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => navigate('client-dashboard')}><ChevronLeft className="h-4 w-4" /></Button><h1 className={`text-lg font-bold ${th.textPrimary}`}>{t('activitySectors')}</h1></div></div>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {getAllSectorNames().map((sector, i) => {
          const servicesInSector = getServicesBySector(sector)
          return (
            <Card key={sector} className={`cursor-pointer hover:shadow-md transition-all ${th.accentBorder}`} onClick={() => { setSearchSector(sector); setSearchTargetType(''); navigate('client-dashboard'); setTimeout(() => handleSearch(), 100) }}>
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full ${th.accentLight} flex items-center justify-center ${th.accent} text-sm font-bold`}>{String(i + 1).padStart(2, '0')}</div><div className="flex-1"><h3 className={`font-semibold ${th.textPrimary}`}>{sector}</h3><p className={`text-xs ${th.textSecondary}`}>{servicesInSector.length} {t('service')}s</p></div><ArrowRight className={`h-5 w-5 ${th.textSecondary}`} /></div></CardContent>
            </Card>
          )
        })}
      </div>
      {renderBottomNav('browse-sectors')}
    </div>
  )

  // ============================================================
  // RENDER: PROVIDER DETAIL
  // ============================================================
  const renderProviderDetail = () => (
    <div className={`min-h-screen ${th.pageBg} pb-20`}>
      <SettingsFloater />
      {loading ? <div className="p-4 space-y-4"><Skeleton className="h-48 w-full rounded" /><Skeleton className="h-32 w-full rounded" /></div> : providerDetail ? (<>
        {providerDetail.role === 'ENTREPRISE' && providerDetail.profile?.coverPhoto && <div className="h-36 bg-gray-200 relative"><img src={providerDetail.profile.coverPhoto} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" /></div>}
        <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
          <Button variant="ghost" onClick={() => navigate(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))} className={`mb-4 ${th.textSecondary}`}><ChevronLeft className="h-4 w-4 mr-1" />{t('back')}</Button>
          <Card className="shadow-lg"><CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-4"><Avatar className="h-20 w-20 flex-shrink-0 ring-4 ring-white shadow"><AvatarImage src={providerDetail.profile?.logo || providerDetail.profile?.photo} /><AvatarFallback className={theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>{getInitials(providerDetail.profile?.companyName || providerDetail.profile?.fullName || 'P')}</AvatarFallback></Avatar><div><div className="flex items-center gap-2 flex-wrap"><h1 className={`text-xl font-bold ${th.textPrimary}`}>{providerDetail.profile?.companyName || providerDetail.profile?.fullName}</h1><div className="flex items-center gap-1 flex-wrap">{providerDetail.status && getStatusBadge(providerDetail.status, theme)}{providerDetail.certified && <Badge className="bg-amber-500 text-white text-[10px]"><ShieldCheck className="h-3 w-3 mr-0.5" />Certifié</Badge>}</div></div><p className={th.accent}>{providerDetail.profile?.sector}</p>{providerDetail.profile?.services && providerDetail.profile.services.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{providerDetail.profile.services.map(s => <Badge key={s} variant="secondary" className={`text-xs ${theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{s}</Badge>)}</div>}</div></div>
            {providerDetail.profile?.description && <p className={`${th.textSecondary} text-sm mb-4 whitespace-pre-wrap`}>{providerDetail.profile.description}</p>}
            <Separator className="my-4" />
            {/* Contact */}
            <div className="space-y-2"><h3 className={`font-semibold ${th.textPrimary}`}>{t('contactInfo')}</h3>
              <div className={`flex items-center gap-2 text-sm ${th.textSecondary}`}><Phone className={`h-4 w-4 ${th.accent}`} /><a href={`tel:${providerDetail.phone}`} className="hover:underline">{providerDetail.phone}</a></div>
              <div className={`flex items-center gap-2 text-sm ${th.textSecondary}`}><MapPin className={`h-4 w-4 ${th.accent}`} />{providerDetail.profile?.nationalScope ? 'RDC' : `${providerDetail.profile?.province || ''}${providerDetail.profile?.commune ? `, ${providerDetail.profile.commune}` : ''}`}</div>
              {providerDetail.profile?.website && <div className={`flex items-center gap-2 text-sm ${th.textSecondary}`}><Globe className={`h-4 w-4 ${th.accent}`} /><a href={providerDetail.profile.website.startsWith('http') ? providerDetail.profile.website : `https://${providerDetail.profile.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{providerDetail.profile.website}</a></div>}
            </div>
            <Separator className="my-4" />
            {/* Action buttons */}
            {user?.role === 'CLIENT' && <div className="grid grid-cols-2 gap-2 mb-4">
              <Button className={`${th.primary} ${th.primaryText}`} onClick={() => openChat(providerDetail.id, providerDetail.profile?.companyName || providerDetail.profile?.fullName)}><MessageSquare className="h-4 w-4 mr-1" />{t('sendMessage')}</Button>
              <Button variant="outline" className={`${th.accent} ${th.accentBorder}`} asChild><a href={`tel:${providerDetail.phone}`}><Phone className="h-4 w-4 mr-1" />{t('callNow')}</a></Button>
            </div>}
            {/* Rating */}
            <div className="flex items-center gap-3 mb-4"><div className="flex items-center gap-1">{getStars(avgRating)}</div><span className={`text-sm font-medium ${th.textPrimary}`}>{avgRating.toFixed(1)}</span><span className={`text-sm ${th.textSecondary}`}>({reviewCount} {t('reviews')})</span></div>
            {user?.role === 'CLIENT' && <Button className={`w-full ${th.primary} ${th.primaryText} mb-4`} onClick={() => setShowReviewForm(true)}><Star className="h-4 w-4 mr-1" />{t('leaveReview')}</Button>}
            <h3 className={`font-semibold ${th.textPrimary} mb-3`}>{t('reviews')} ({providerReviews.length})</h3>
            {providerReviews.length > 0 ? <div className="space-y-3 max-h-96 overflow-y-auto">{providerReviews.map(r => <Card key={r.id}><CardContent className="p-3"><div className="flex items-center justify-between mb-1"><span className={`text-sm font-medium ${th.textPrimary}`}>{r.authorName || 'Anonyme'}</span><span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span></div><div className="flex items-center gap-1 mb-1">{getStars(r.rating)}</div><p className={`text-sm ${th.textSecondary}`}>{r.comment}</p></CardContent></Card>)}</div> : <p className={`text-sm text-gray-400 text-center py-4`}>{t('noReviews')}</p>}
          </CardContent></Card>
        </div>
        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}><DialogContent><DialogHeader><DialogTitle>{t('leaveReview')}</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label>{t('rate')}</Label><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setReviewRating(n)}><Star className={`h-8 w-8 ${n <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} /></button>)}</div></div><div className="space-y-2"><Label>{t('comment')}</Label><Textarea placeholder="..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} /></div></div><DialogFooter><Button variant="outline" onClick={() => setShowReviewForm(false)}>{t('cancel')}</Button><Button className={`${th.primary} ${th.primaryText}`} onClick={submitReview} disabled={reviewLoading}>{reviewLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}{t('publish')}</Button></DialogFooter></DialogContent></Dialog>
      </>) : <div className="flex items-center justify-center min-h-[60vh]"><p className={th.textSecondary}>Non trouvé</p></div>}
      {user?.role === 'CLIENT' && renderBottomNav('client-dashboard')}
    </div>
  )

  // ============================================================
  // RENDER: PRESTATAIRE / ENTREPRISE DASHBOARD
  // ============================================================
  const renderProviderDashboard = () => {
    const isE = user?.role === 'ENTREPRISE'; const p = user?.profile; const status = user?.status || 'approved'
    return (
      <div className={`min-h-screen ${th.pageBg} pb-20`}>
        {renderSuspendedOverlay()}
        <SettingsFloater />
        {isE && p?.coverPhoto ? <div className="h-44 relative"><img src={p.coverPhoto} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" /></div> : <div className={th.headerBg} style={{ height: isE ? 176 : 128 }} />}
        <div className="max-w-lg mx-auto px-4 -mt-10 relative z-10">
          <Card className="shadow-lg"><CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-20 w-20 flex-shrink-0 ring-4 ring-white shadow"><AvatarImage src={isE ? p?.logo : p?.photo} /><AvatarFallback className={theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>{getInitials(isE ? (p?.companyName || 'E') : (p?.fullName || 'P'))}</AvatarFallback></Avatar>
              <div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h1 className={`text-xl font-bold ${th.textPrimary}`}>{isE ? p?.companyName : p?.fullName}</h1>{getStatusBadge(status, theme)}</div><p className={`${th.accent} font-medium text-sm`}>{p?.sector}</p></div>
            </div>
            {p?.services && p.services.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{p.services.map(s => <Badge key={s} variant="secondary" className={theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>{s}</Badge>)}</div>}
            {p?.description && <p className={`${th.textSecondary} text-sm mb-3 whitespace-pre-wrap`}>{p.description}</p>}
            <div className="space-y-2 text-sm">{p?.province && <div className={`flex items-center gap-2 ${th.textSecondary}`}><MapPin className="h-4 w-4" />{p.nationalScope ? 'RDC' : `${p.province}${p.commune ? `, ${p.commune}` : ''}`}</div>}<div className={`flex items-center gap-2 ${th.textSecondary}`}><Phone className="h-4 w-4" />{user?.phone}</div>{isE && p?.employeeCount && <div className={`flex items-center gap-2 ${th.textSecondary}`}><Users className="h-4 w-4" />{p.employeeCount} employé(s)</div>}{isE && p?.website && <div className={`flex items-center gap-2 ${th.accent}`}><Globe className="h-4 w-4" />{p.website}</div>}</div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t"><div className="flex items-center gap-1">{getStars(providerDashAvg)}</div><span className={`text-sm font-medium ${th.textPrimary}`}>{providerDashAvg.toFixed(1)}</span><span className={`text-sm ${th.textSecondary}`}>({providerDashCount} {t('reviews')})</span></div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className={`${th.alertBg} rounded-lg p-3 text-center`}><p className={`text-2xl font-bold ${th.accent}`}>{p?.services?.length || 0}</p><p className={`text-xs ${th.textSecondary}`}>{t('service')}s</p></div>
              <div className={`${th.alertBg} rounded-lg p-3 text-center`}><p className={`text-2xl font-bold ${th.accent}`}>{providerDashCount}</p><p className={`text-xs ${th.textSecondary}`}>{t('reviews')}</p></div>
              <div className={`${th.alertBg} rounded-lg p-3 text-center`}><p className={`text-2xl font-bold ${th.accent}`}>{providerDashAvg > 0 ? providerDashAvg.toFixed(1) : '-'}</p><p className={`text-xs ${th.textSecondary}`}>{t('rate')}</p></div>
            </div>
            <Button className={`w-full mt-4 ${th.primary} ${th.primaryText}`} onClick={() => navigate('profile-edit')}><Edit className="h-4 w-4 mr-1" />{t('modifyProfile')}</Button>
            <div className="mt-3 p-3 rounded-lg border border-amber-100 bg-amber-50/30"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><ShieldCheck className={'h-4 w-4 ' + (user?.certified ? 'text-amber-500' : 'text-gray-400')} /><div><p className={'text-xs sm:text-sm font-medium ' + (user?.certified ? 'text-amber-700' : 'text-gray-600')}>{user?.certified ? 'Certifié' : user?.certificationStatus === 'pending' ? 'En attente de certification' : 'Non certifié'}</p>{user?.certificationMessage && <p className="text-[10px] text-gray-500 mt-0.5">Message: {user.certificationMessage}</p>}</div></div>{!user?.certified && user?.certificationStatus !== 'pending' && <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-7" onClick={async () => { try { const r = await fetch('/api/certification', { method: 'POST', headers: authHeaders() }); if (r.ok) { toast({ title: 'Demande envoyée' }); await fetchUserProfile() } else { const d = await r.json(); toast({ title: d.error || 'Erreur', variant: 'destructive' }) } } catch { /* */ } }}><ShieldCheck className="h-3 w-3 mr-1" />Demander la certification</Button>}{user?.certificationStatus === 'pending' && <Badge className="bg-amber-500 text-white text-[10px]">En attente</Badge>}</div></div>
          </CardContent></Card>
          <div className="mt-6"><h2 className={`text-lg font-bold ${th.textPrimary} mb-3`}>{t('receivedReviews')}</h2>{providerDashReviews.length > 0 ? <div className="space-y-3 max-h-80 overflow-y-auto">{providerDashReviews.map(r => <Card key={r.id}><CardContent className="p-3"><div className="flex items-center justify-between mb-1"><span className={`text-sm font-medium ${th.textPrimary}`}>{r.authorName || 'Anonyme'}</span><span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span></div><div className="flex items-center gap-1 mb-1">{getStars(r.rating)}</div><p className={`text-sm ${th.textSecondary}`}>{r.comment}</p></CardContent></Card>)}</div> : <p className={`text-sm text-gray-400 text-center py-4`}>{t('noReviews')}</p>}</div>
        </div>
        {renderBottomNav(isE ? 'entreprise-dashboard' : 'prestataire-dashboard')}
      </div>
    )
  }

  // ============================================================
  // RENDER: NOTIFICATIONS
  // ============================================================
  const renderNotifications = () => (
    <div className={`min-h-screen ${th.pageBg} pb-20`}>
      <SettingsFloater />
      <div className={`bg-white border-b ${th.borderColor} px-4 py-4 sticky top-0 z-50`}><div className="max-w-lg mx-auto flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))}><ChevronLeft className="h-4 w-4" /></Button><h1 className={`text-lg font-bold ${th.textPrimary}`}>{t('notifications')}</h1>{unreadCount > 0 && <Badge className={`${theme === 'red' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'} ml-auto`}>{unreadCount} {t('unread')}</Badge>}</div></div>
      <div className="max-w-lg mx-auto px-4 py-4">
        <Button variant="outline" size="sm" className={`mb-4 ${th.accent} ${th.accentBorder}`} onClick={() => markNotifRead()}><Check className="h-3 w-3 mr-1" />{t('markAllRead')}</Button>
        {notifications.length > 0 ? <div className="space-y-2">{notifications.map(n => (
          <Card key={n.id} className={`cursor-pointer transition-all ${n.read ? 'border-gray-100' : `${th.accentBorder} ${th.accentLight} shadow-sm`}`}>
            <CardContent className="p-4 flex gap-3 items-start">
              <button className="flex-shrink-0 mt-1" onClick={(e) => { e.stopPropagation(); deleteNotif(n.id) }}><Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" /></button>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.read ? 'bg-gray-100' : th.badgeBg}`}>{n.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <Info className={`h-4 w-4 ${th.accent}`} />}</div>
              <div className="flex-1" onClick={() => markNotifRead(n.id)}><div className="flex items-center justify-between gap-2"><h3 className={`text-sm ${n.read ? `font-medium ${th.textSecondary}` : `font-semibold ${th.textPrimary}`}`}>{n.title}</h3><span className="text-xs text-gray-400 flex-shrink-0">{formatDate(n.createdAt)}</span></div><p className={`text-sm ${th.textSecondary} mt-0.5`}>{n.message}</p>{n.type?.startsWith('certification') && <Button size="sm" variant="outline" className="mt-2 h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-200" onClick={(e) => { e.stopPropagation(); markNotifRead(n.id); toast({ title: 'Prise en compte' }) }}><Check className="h-3 w-3 mr-1" />OK</Button>}</div>
            </CardContent>
          </Card>
        ))}</div> : <div className="text-center py-16"><Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className={th.textSecondary}>{t('noNotifications')}</p></div>}
      </div>
      {renderBottomNav('notifications')}
    </div>
  )

  // ============================================================
  // RENDER: CHAT LIST
  // ============================================================
  const renderChat = () => (
    <div className={`min-h-screen ${th.pageBg} pb-20`}>
      <SettingsFloater />
      <div className={`bg-white border-b ${th.borderColor} px-4 py-4 sticky top-0 z-50`}><div className="max-w-lg mx-auto flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))}><ChevronLeft className="h-4 w-4" /></Button><h1 className={`text-lg font-bold ${th.textPrimary}`}>{t('chat')}</h1></div></div>
      <div className="max-w-lg mx-auto px-4 py-4">
        {conversations.length > 0 ? <div className="space-y-2">{conversations.map(c => (
          <Card key={c.id} className={`cursor-pointer hover:shadow-md transition-all ${c.unreadCount > 0 ? `${th.accentBorder} ${th.accentLight}` : ''}`} onClick={() => { setCurrentChatId(c.id); setChatOtherUser(c.otherUser); navigate('chat-conversation'); fetchChatMessages(c.id) }}>
            <CardContent className="p-4 flex gap-3 items-center">
              <Avatar className="h-12 w-12"><AvatarImage src={c.otherUser.photo || undefined} /><AvatarFallback className={theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>{getInitials(c.otherUser.name)}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><h3 className={`font-semibold text-sm ${th.textPrimary} truncate`}>{c.otherUser.name}</h3><span className="text-xs text-gray-400">{c.lastMessage ? formatTime(c.lastMessage.createdAt) : ''}</span></div><p className={`text-sm ${th.textSecondary} truncate`}>{c.lastMessage ? c.lastMessage.content : '...'}</p></div>
              {c.unreadCount > 0 && <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{c.unreadCount}</span>}
            </CardContent>
          </Card>
        ))}</div> : <div className="text-center py-16"><MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className={th.textSecondary}>{t('noConversations')}</p></div>}
      </div>
      {renderBottomNav('chat')}
    </div>
  )

  // ============================================================
  // RENDER: CHAT CONVERSATION
  // ============================================================
  const renderChatConversation = () => (
    <div className={`min-h-screen ${th.pageBg} pb-4 flex flex-col`}>
      <SettingsFloater />
      <div className={`bg-white border-b ${th.borderColor} px-4 py-3 sticky top-0 z-50`}><div className="max-w-lg mx-auto flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => { navigate('chat'); setCurrentChatId(''); setChatMessages([]) }}><ChevronLeft className="h-4 w-4" /></Button><Avatar className="h-8 w-8"><AvatarImage src={chatOtherUser?.photo || undefined} /><AvatarFallback className={theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>{chatOtherUser ? getInitials(chatOtherUser.name) : '?'}</AvatarFallback></Avatar><h1 className={`text-base font-bold ${th.textPrimary}`}>{chatOtherUser?.name || '...'}</h1></div></div>
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 overflow-y-auto" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {chatAutoReply && <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-center"><p className="text-xs text-amber-700">🤖 {chatOtherUser?.name} est probablement hors ligne.</p><p className="text-sm text-amber-800 mt-1">{chatAutoReply}</p></div>}
        {chatMessages.length > 0 ? <div className="space-y-3">
          {chatMessages.map(m => {
            const isMine = m.senderId === user?.id
            return <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMine ? (theme === 'red' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white') : (theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900')} rounded-br-sm`}><p className="text-sm">{m.content}</p><p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>{formatTime(m.createdAt)}</p></div></div>
          })}
          <div ref={chatEndRef} />
        </div> : <div className="text-center py-20"><MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className={th.textSecondary}>{t('noConversations')}</p></div>}
      </div>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3"><div className="max-w-lg mx-auto flex gap-2"><Input placeholder={t('typeMessage')} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()} className="flex-1" /><Button className={`${th.primary} ${th.primaryText}`} onClick={sendChatMessage} disabled={!chatInput.trim()}><Send className="h-4 w-4" /></Button></div></div>
    </div>
  )

  // ============================================================
  // RENDER: SETTINGS
  // ============================================================
  const renderSettings = () => (
    <div className={`min-h-screen ${th.pageBg} pb-20`}>
      <SettingsFloater />
      <div className={`bg-white border-b ${th.borderColor} px-4 py-4 sticky top-0 z-50`}><div className="max-w-lg mx-auto flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))}><ChevronLeft className="h-4 w-4" /></Button><h1 className={`text-lg font-bold ${th.textPrimary}`}>{t('settings')}</h1></div></div>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        <Card className={th.accentBorder}><CardContent className="pt-6"><div className="flex items-center gap-4 mb-4"><Avatar className="h-16 w-16"><AvatarImage src={user?.profile?.logo || user?.profile?.photo} /><AvatarFallback className={theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>{getInitials(user?.profile?.fullName || user?.profile?.companyName || user?.phone || 'U')}</AvatarFallback></Avatar><div><h2 className={`font-semibold ${th.textPrimary}`}>{user?.profile?.fullName || user?.profile?.companyName || 'Utilisateur'}</h2><p className={`text-sm ${th.textSecondary}`}>{user?.phone}</p><Badge className={`mt-1 ${th.badgeBg} ${th.badgeText}`}>{user?.role}</Badge></div></div><Button className={`w-full ${th.primary} ${th.primaryText}`} onClick={() => navigate('profile-edit')}><Edit className="h-4 w-4 mr-1" />{t('modifyProfile')}</Button></CardContent></Card>
        <Card><CardContent className="pt-6"><h3 className={`font-semibold ${th.textPrimary} mb-3`}>{t('changePassword')}</h3>{!showChangePass ? <Button variant="outline" className={`w-full ${th.accent} ${th.accentBorder}`} onClick={() => setShowChangePass(true)}><Key className="h-4 w-4 mr-1" />{t('changePassword')}</Button> : <div className="space-y-3"><div className="space-y-2"><Label>{t('newPassword')}</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div><div className="flex gap-2"><Button className={`flex-1 ${th.primary} ${th.primaryText}`} onClick={handleChangePassword} disabled={changePassLoading}>{changePassLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}{t('save')}</Button><Button variant="outline" onClick={() => { setShowChangePass(false); setNewPassword('') }}>{t('cancel')}</Button></div></div>}</CardContent></Card>
        <Card><CardContent className="pt-6"><h3 className={`font-semibold ${th.textPrimary} mb-3`}>{t('contactUs')}</h3><div className="space-y-3"><div className="space-y-2"><Label>{t('yourName')}</Label><Input value={contactName} onChange={e => setContactName(e.target.value)} /></div><div className="space-y-2"><Label>{t('email')}</Label><Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div><div className="space-y-2"><Label>{t('yourMessage')}</Label><Textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} rows={3} /></div><Button className={`w-full ${th.primary} ${th.primaryText}`} onClick={handleContact} disabled={contactLoading}>{contactLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}{t('send')}</Button></div></CardContent></Card>
        <Card><CardContent className="pt-6"><h3 className={`font-semibold ${th.textPrimary} mb-3`}>{t('myMessages')}</h3>{contactMessages.length > 0 ? <div className="space-y-3 max-h-64 overflow-y-auto">{contactMessages.map(m => <div key={m.id} className="p-3 rounded-lg border border-gray-100"><p className={`text-sm ${th.textSecondary}`}>{m.message}</p><p className="text-xs text-gray-400 mt-1">{formatDate(m.createdAt)}</p>{m.reply && <div className={`mt-2 p-2 ${th.alertBg} rounded ${th.accentBorder}`}><p className={`text-xs font-medium ${th.accent}`}>Réponse:</p><p className={`text-sm ${th.accent}`}>{m.reply}</p></div>}</div>)}</div> : <p className={`text-sm text-gray-400 text-center py-4`}>{t('noMessages')}</p>}</CardContent></Card>
        {/* Auto-reply */}
        <Card className={th.accentBorder}><CardContent className="pt-6 space-y-3"><h3 className={`font-semibold ${th.textPrimary}`}>💬 Message automatique hors ligne</h3><p className={`text-xs ${th.textSecondary}`}>Ce message sera affiché automatiquement si vous ne répondez pas dans les 10 minutes.</p><Textarea placeholder="Ex: Je suis actuellement indisponible. Je vous répondrai dès que possible." value={autoReplyMsg} onChange={e => setAutoReplyMsg(e.target.value)} rows={2} /><Button className={`${th.primary} ${th.primaryText}`} onClick={handleSaveAutoReply} disabled={autoReplyLoading} size="sm">{autoReplyLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}{t('save')}</Button></CardContent></Card>
        {/* Account deletion */}
        <Card className="border-red-200"><CardContent className="pt-6 space-y-3"><h3 className="font-semibold text-red-600 flex items-center gap-2"><Trash2 className="h-4 w-4" />Supprimer mon compte</h3>{(user as any)?.deletionRequestedAt ? <><Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Demande en cours</AlertTitle><AlertDescription>Votre demande de suppression est en attente de traitement par l'admin.</AlertDescription></Alert><Button variant="outline" className="border-red-200 text-red-600" onClick={() => void handleCancelDeletion()} size="sm">Annuler la demande</Button></> : <><p className={`text-sm ${th.textSecondary}`}>Si vous souhaitez supprimer votre compte, expliquez pourquoi. L'admin traitera votre demande.</p><Textarea placeholder="Expliquez pourquoi vous souhaitez supprimer votre compte..." value={deletionReason} onChange={e => setDeletionReason(e.target.value)} rows={2} /><Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => void handleRequestDeletion()} disabled={deletionLoading} size="sm">{deletionLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}Demander la suppression</Button></>}</CardContent></Card>
        <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={logout}><LogOut className="h-4 w-4 mr-1" />{t('logout')}</Button>
      </div>
      {renderBottomNav('settings')}
    </div>
  )

  // ============================================================
  // RENDER: PROFILE EDIT
  // ============================================================
  const renderProfileEdit = () => (
    <div className={`min-h-screen ${th.pageBg} pb-6`}>
      <SettingsFloater />
      <div className={`bg-white border-b ${th.borderColor} px-4 py-4 sticky top-0 z-50`}><div className="max-w-lg mx-auto flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard')}><ChevronLeft className="h-4 w-4" /></Button><h1 className={`text-lg font-bold ${th.textPrimary}`}>{t('modifyProfile')}</h1></div></div>
      <div className="max-w-lg mx-auto px-4 py-4"><ScrollArea className="max-h-[calc(100vh-140px)]"><Card className={th.accentBorder}><CardContent className="pt-6 space-y-4">
        <div className="space-y-2"><Label>{user?.role === 'ENTREPRISE' ? t('logo') : t('photo')}</Label><div className="flex items-center gap-4"><Avatar className="h-20 w-20"><AvatarImage src={editPhotoPreview} /><AvatarFallback className={theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>{getInitials(editName || editCompanyName || 'U')}</AvatarFallback></Avatar><label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setEditPhoto(f); setEditPhotoPreview(URL.createObjectURL(f)) } }} /><Button variant="outline" size="sm" asChild><span><Camera className="h-3 w-3 mr-1" />Changer</span></Button></label></div></div>
        {user?.role === 'ENTREPRISE' ? <div className="space-y-2"><Label>{t('companyName')}</Label><Input value={editCompanyName} onChange={e => setEditCompanyName(e.target.value)} /></div> : <div className="space-y-2"><Label>{t('fullName')}</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>}
        <div className="space-y-2"><Label>{t('email')}</Label><Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>
        {user?.role !== 'CLIENT' && <>
          <Separator />
          <div className="space-y-2"><Label>{t('sector')}</Label><Select value={editSector} onValueChange={v => { setEditSector(v); setEditServices([]) }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{getAllSectorNames().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          {editSector && <div className="space-y-2"><Label>{t('service')}</Label><div className="grid grid-cols-1 gap-2">{getServicesBySector(editSector).map(s => (<div key={s} className="flex items-center space-x-2"><Checkbox id={`es-${s}`} checked={editServices.includes(s)} onCheckedChange={() => setEditServices(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])} /><Label htmlFor={`es-${s}`} className="text-sm font-normal cursor-pointer">{s}</Label></div>))}</div><div className="flex gap-2 mt-2"><Input placeholder={t('customServicePlaceholder')} value={editCustomService} onChange={e => setEditCustomService(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setEditServices(p => editCustomService.trim() && !p.includes(editCustomService.trim()) ? [...p, editCustomService.trim()] : p), setEditCustomService(''))} /><Button variant="outline" size="sm" onClick={() => { if (editCustomService.trim() && !editServices.includes(editCustomService.trim())) { setEditServices(p => [...p, editCustomService.trim()]); setEditCustomService('') } }}><Plus className="h-4 w-4" /></Button></div></div>}
          {user?.role === 'ENTREPRISE' && <><div className="space-y-2"><Label>{t('companyType')}</Label><Select value={editCompanyType} onValueChange={setEditCompanyType}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individuelle">Individuelle</SelectItem><SelectItem value="avec_employes">Avec employés</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>{t('employeeCount')}</Label><Input type="number" value={editEmployeeCount} onChange={e => setEditEmployeeCount(e.target.value)} /></div><div className="space-y-2"><Label>{t('website')}</Label><Input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} /></div><div className="space-y-2"><Label>{t('fullAddress')}</Label><Input value={editFullAddress} onChange={e => setEditFullAddress(e.target.value)} /></div></>}
          <div className="flex items-center space-x-2"><Checkbox id="en" checked={editNationalScope} onCheckedChange={(v) => setEditNationalScope(v === true)} /><Label htmlFor="en" className="text-sm cursor-pointer">{t('nationalScope')}</Label></div>
          {!editNationalScope && <div className="space-y-2"><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>{t('province')}</Label><Select value={editProvince} onValueChange={v => { setEditProvince(v); setEditDistrict(''); setEditCommune('') }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{getAllProvinceNames().map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>{editProvince === 'Kinshasa' && <div className="space-y-2"><Label>District</Label><Select value={editDistrict} onValueChange={v => { setEditDistrict(v); setEditCommune('') }}><SelectTrigger className="w-full"><SelectValue placeholder="Choisir un district" /></SelectTrigger><SelectContent>{(Object.keys(kinshasaDistricts) as KinshasaDistrict[]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>}</div><div className="grid grid-cols-1 gap-3"><div className="space-y-2"><Label>{t('commune')}</Label><Select value={editCommune} onValueChange={setEditCommune} disabled={!editProvince || (editProvince === 'Kinshasa' && !editDistrict)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{editProvince === 'Kinshasa' && editDistrict ? kinshasaDistricts[editDistrict as KinshasaDistrict].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) : editProvince && editProvince !== 'Kinshasa' ? getCommunes(editProvince).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) : null}</SelectContent></Select></div></div></div>}
          <div className="space-y-2"><Label>{t('description')}</Label><Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} /></div>
        </>}
        <div className="flex gap-3 pt-4"><Button className={`flex-1 ${th.primary} ${th.primaryText}`} onClick={handleSaveProfile} disabled={editLoading}>{editLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}{t('save')}</Button><Button variant="outline" onClick={() => navigate(user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard')}>{t('cancel')}</Button></div>
      </CardContent></Card></ScrollArea></div>
    </div>
  )

  // ============================================================
  // RENDER: ADMIN DASHBOARD (kept concise)
  // ============================================================
  const renderAdminDashboard = () => (
    <div className={`min-h-screen ${th.pageBg} pb-6`}>
      <SettingsFloater />
      <div className={`${th.headerBg} ${th.headerText} px-4 pt-6 pb-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Shield className="h-6 w-6" /><h1 className="text-lg sm:text-xl font-bold">{t('administration')}</h1></div>
            <div className="flex items-center gap-2">
              {adminUsers.filter(u=>u.deletionReason).length > 0 && <Badge className="bg-red-400 text-white text-[10px] sm:text-xs animate-pulse">{adminUsers.filter(u=>u.deletionReason).length} suppression{adminUsers.filter(u=>u.deletionReason).length > 1 ? 's' : ''}</Badge>}
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 text-xs sm:text-sm" onClick={logout}><LogOut className="h-3 w-4 sm:h-4 sm:w-4 mr-1" />{t('logout')}</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">{[{ l: t('totalUsers'), v: adminStats.totalUsers || 0, i: <Users className="h-3 w-3 sm:h-4 sm:w-4" /> }, { l: t('client') + 's', v: adminStats.clients || 0, i: <User className="h-3 w-3 sm:h-4 sm:w-4" /> }, { l: t('prestataire') + 's', v: adminStats.prestataires || 0, i: <Wrench className="h-3 w-3 sm:h-4 sm:w-4" /> }, { l: t('entreprise') + 's', v: adminStats.entreprises || 0, i: <Building2 className="h-3 w-3 sm:h-4 sm:w-4" /> }, { l: t('pending'), v: adminStats.pending || 0, i: <Clock className="h-3 w-3 sm:h-4 sm:w-4" /> }, { l: t('suspended'), v: adminStats.suspended || 0, i: <Ban className="h-3 w-3 sm:h-4 sm:w-4" /> }, { l: t('reviews'), v: adminStats.reviews || 0, i: <Star className="h-3 w-3 sm:h-4 sm:w-4" /> }, { l: t('messages'), v: adminStats.messages || 0, i: <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" /> }].map((s, i) => <div key={i} className="bg-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-sm"><div className="flex items-center gap-1 sm:gap-2 mb-1 text-white/80">{s.i}<span className="text-[10px] sm:text-xs truncate">{s.l}</span></div><p className="text-lg sm:text-2xl font-bold">{s.v}</p></div>)}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-xs text-white/80 mb-2 font-medium">Répartition par rôle</p>
              {[{l:'Clients',v:adminStats.clients||0,c:'bg-blue-500'},{l:'Prestataires',v:adminStats.prestataires||0,c:'bg-emerald-500'},{l:'Entreprises',v:adminStats.entreprises||0,c:'bg-amber-500'}].map(d => {const t=(adminStats.totalUsers||1);return <div key={d.l} className="flex items-center gap-2 mb-1.5"><span className="text-white/70 text-[10px] sm:text-xs w-20 truncate">{d.l}</span><div className="flex-1 h-3 sm:h-4 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${d.c} rounded-full`} style={{width:`${(d.v/t*100)}%`}}/></div><span className="text-white/90 text-[10px] sm:text-xs font-bold w-8 text-right">{d.v}</span></div>})}
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-xs text-white/80 mb-2 font-medium">Répartition par statut</p>
              {[{l:t('approved'),v:adminStats.approved||0,c:'bg-emerald-500'},{l:t('pending'),v:adminStats.pending||0,c:'bg-amber-500'},{l:t('suspended'),v:adminStats.suspended||0,c:'bg-red-500'}].map(d => {const tot=adminStats.totalUsers||1;return <div key={d.l} className="flex items-center gap-2 mb-1.5"><span className="text-white/70 text-[10px] sm:text-xs w-20 truncate">{d.l}</span><div className="flex-1 h-3 sm:h-4 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${d.c} rounded-full`} style={{width:`${(d.v/tot*100)}%`}}/></div><span className="text-white/90 text-[10px] sm:text-xs font-bold w-8 text-right">{d.v}</span></div>})}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <Tabs value={adminTab} onValueChange={setAdminTab}>
          <div className="overflow-x-auto -mx-4 px-4 mb-4 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-max gap-1">
              <TabsTrigger value="validation" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">{t('validation')}</TabsTrigger>
              <TabsTrigger value="utilisateurs" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">{t('users')}</TabsTrigger>
              <TabsTrigger value="suppressions" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Suppressions{adminUsers.filter(u=>u.deletionReason).length > 0 && <Badge className="ml-1 bg-red-500 text-white text-[9px] h-4 min-w-4 px-1">{adminUsers.filter(u=>u.deletionReason).length}</Badge>}</TabsTrigger>
              <TabsTrigger value="avis" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Avis</TabsTrigger>
              <TabsTrigger value="annonces" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">{t('announcements')}</TabsTrigger>
              <TabsTrigger value="secteurs" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Secteurs</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">{t('messages')}</TabsTrigger>
              <TabsTrigger value="certifications" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Certifications{adminCertRequests.filter(r => r.certificationStatus === 'pending').length > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[9px] h-4 min-w-4 px-1">{adminCertRequests.filter(r => r.certificationStatus === 'pending').length}</Badge>}</TabsTrigger>
              <TabsTrigger value="parametres" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Paramètres</TabsTrigger>
              <TabsTrigger value="historique" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3">Historique</TabsTrigger>
            </TabsList>
          </div>
        <TabsContent value="validation"><Card><CardHeader className="p-3 sm:p-6"><CardTitle className="text-sm sm:text-base">{t('pending')}</CardTitle></CardHeader><CardContent className="p-3 sm:p-6 pt-0 sm:pt-0"><div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">{adminUsers.filter(u => u.status === 'pending').map(u => (<div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-100 gap-2"><div className="flex items-center gap-2 sm:gap-3"><Avatar className="h-8 w-8 sm:h-10 sm:w-10"><AvatarFallback className={'text-[10px] sm:text-xs ' + (theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>{getInitials(u.profile?.fullName || u.profile?.companyName || 'U')}</AvatarFallback></Avatar><div className="min-w-0"><p className="font-medium text-xs sm:text-sm truncate">{u.profile?.companyName || u.profile?.fullName || u.phone}</p><p className="text-[10px] sm:text-xs text-gray-500">{u.role}</p></div></div><div className="flex gap-1 sm:self-center"><Button size="sm" variant="outline" className={'h-7 sm:h-8 text-xs ' + (theme === 'red' ? 'text-red-600 border-red-200' : 'text-emerald-600 border-emerald-200')} onClick={() => handleAdminAction(u.id, 'approve')}><Check className="h-3 w-3" /></Button><Button size="sm" variant="outline" className="h-7 sm:h-8 text-xs text-red-600 border-red-200" onClick={() => handleAdminAction(u.id, 'reject')}><X className="h-3 w-3" /></Button></div></div>))}{adminUsers.filter(u => u.status === 'pending').length === 0 && <p className="text-center text-gray-400 py-8 text-xs sm:text-sm">Aucun</p>}</div></CardContent></Card></TabsContent>
        <TabsContent value="utilisateurs"><Card><CardHeader className="p-3 sm:p-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><CardTitle className="text-sm sm:text-base">{t('users')}</CardTitle><Button size="sm" variant="outline" className="text-xs h-7 sm:h-8" onClick={exportCSV}><Download className="h-3 w-3 mr-1" />CSV</Button></div></CardHeader><CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="flex flex-col gap-2 mb-3">
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /><Input value={adminSearchQuery} onChange={e => setAdminSearchQuery(e.target.value)} placeholder="Rechercher par nom, téléphone, email..." className="pl-7 sm:pl-8 text-xs sm:text-sm h-8 sm:h-9" /></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Select value={adminRoleFilter} onValueChange={setAdminRoleFilter}><SelectTrigger className="w-full text-xs h-8 sm:h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="CLIENT">Clients</SelectItem><SelectItem value="PRESTATAIRE">Prestataires</SelectItem><SelectItem value="ENTREPRISE">Entreprises</SelectItem></SelectContent></Select>
              <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}><SelectTrigger className="w-full text-xs h-8 sm:h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="approved">Approuvés</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="suspended">Suspendus</SelectItem><SelectItem value="rejected">Rejetés</SelectItem></SelectContent></Select>
              <Select value={adminSortBy} onValueChange={(v: any) => setAdminSortBy(v)}><SelectTrigger className="w-full text-xs h-8 sm:h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="createdAt">Date (récent)</SelectItem><SelectItem value="name">Nom (A-Z)</SelectItem></SelectContent></Select>
              <div className="flex gap-1"><Input type="date" value={adminDateFrom} onChange={e => setAdminDateFrom(e.target.value)} className="text-xs h-8 sm:h-9 w-full" placeholder="Du" /><Input type="date" value={adminDateTo} onChange={e => setAdminDateTo(e.target.value)} className="text-xs h-8 sm:h-9 w-full" placeholder="Au" /></div>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400">{filteredUsers.length} utilisateur(s)</p>
          </div>
          <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">{filteredUsers.map(u => (<div key={u.id} className="cursor-pointer p-2 sm:p-3 rounded-lg border border-gray-100 hover:shadow-sm" onClick={() => { setUserDetailData(u); setUserDetailOpen(true) }}><div className="flex items-center justify-between"><div className="flex items-center gap-2 sm:gap-3 min-w-0"><Avatar className="h-8 w-8 sm:h-10 sm:w-10"><AvatarFallback className={'text-[10px] sm:text-xs ' + (theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>{getInitials(u.profile?.companyName || u.profile?.fullName || 'U')}</AvatarFallback></Avatar><div className="min-w-0"><p className={'font-semibold text-xs sm:text-sm ' + th.textPrimary + ' truncate'}>{u.profile?.companyName || u.profile?.fullName || u.phone}</p><div className="flex flex-wrap items-center gap-1 sm:gap-2"><span className="text-[10px] sm:text-xs text-gray-500 truncate">{u.phone}</span><Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1 py-0">{u.role}</Badge>{getStatusBadge(u.status, theme)}</div></div></div><ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300 shrink-0" /></div></div>))}{filteredUsers.length === 0 && <p className="text-center text-gray-400 py-8 text-xs sm:text-sm">Aucun résultat</p>}</div>
        </CardContent></Card></TabsContent>
        <TabsContent value="suppressions"><Card><CardHeader className="p-3 sm:p-6"><CardTitle className="flex items-center gap-2 text-sm sm:text-base"><Trash2 className="h-4 w-4 text-red-500" />Demandes de suppression <Badge className="bg-red-500 text-white text-xs">{adminUsers.filter(u=>u.deletionReason).length}</Badge></CardTitle></CardHeader><CardContent className="p-3 sm:p-6 pt-0 sm:pt-0"><div className="space-y-2 sm:space-y-3 max-h-[500px] overflow-y-auto">{adminUsers.filter(u=>u.deletionReason).map(u => (<div key={u.id} className="p-3 rounded-lg border border-red-100 bg-red-50/30"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2"><div className="flex items-center gap-3 min-w-0"><Avatar className="h-8 w-8 sm:h-10 sm:w-10"><AvatarFallback className="bg-red-50 text-red-700 text-xs">{getInitials(u.profile?.companyName || u.profile?.fullName || 'U')}</AvatarFallback></Avatar><div className="min-w-0"><p className="font-medium text-xs sm:text-sm truncate">{u.profile?.companyName || u.profile?.fullName || u.phone}</p><p className="text-[10px] sm:text-xs text-gray-500">{u.role} · {new Date(u.createdAt).toLocaleDateString('fr-FR')}{u.deletionRequestedAt ? ' · Demande: ' + new Date(u.deletionRequestedAt).toLocaleDateString('fr-FR') : ''}</p></div></div><div className="flex gap-1 shrink-0"><Button size="sm" className="h-7 sm:h-8 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteUser(u.id)}><Check className="h-3 w-3 mr-1" />Accepter</Button><Button size="sm" variant="outline" className="h-7 sm:h-8 text-xs" onClick={() => handleRejectDeletion(u.id)}><X className="h-3 w-3 mr-1" />Refuser</Button></div></div>{u.deletionReason && <p className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">Raison: {u.deletionReason}</p>}</div>))}{adminUsers.filter(u=>u.deletionReason).length === 0 && <p className="text-center text-gray-400 py-8 text-xs sm:text-sm">Aucune demande de suppression</p>}</div></CardContent></Card></TabsContent>
        <TabsContent value="avis">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Modération des avis</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-2 sm:space-y-3 max-h-[500px] overflow-y-auto">
                {adminReviews.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-xs sm:text-sm">Aucun avis</p>
                ) : (
                  adminReviews.map((r) => (
                    <div key={r.id} className={'p-3 rounded-lg border ' + (r.hidden ? 'border-gray-200 bg-gray-50' : 'border-gray-100')}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-xs sm:text-sm">{r.authorPhone}</p>
                            <Badge variant="secondary" className="text-[8px] sm:text-[10px]">{r.targetType}</Badge>
                            {r.hidden && <Badge className="bg-gray-300 text-gray-700 text-[10px]">Masqué</Badge>}
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500">{r.targetId?.slice(0,20)}...</p>
                          <div className="flex items-center gap-0.5 mt-1">
                            {Array.from({length:5},(_,i) => <Star key={i} className={'h-3 w-3 ' + (i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />)}
                            <span className="text-xs text-gray-400 ml-1">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {r.comment && <p className="text-xs sm:text-sm text-gray-700 mt-1 bg-white p-2 rounded border">{r.comment}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {r.hidden ? (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReviewAction(r.id, 'show')}><Eye className="h-3 w-3 mr-1" />Afficher</Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReviewAction(r.id, 'hide')}><EyeOff className="h-3 w-3 mr-1" />Masquer</Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => handleReviewAction(r.id, 'delete')}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="annonces"><Card><CardHeader className="p-3 sm:p-6"><CardTitle className="text-sm sm:text-base">{t('newAnnouncement')}</CardTitle></CardHeader><CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0"><div className="space-y-1 sm:space-y-2"><Label className="text-xs sm:text-sm">{t('title')}</Label><Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="text-xs sm:text-sm h-8 sm:h-9" /></div><div className="space-y-1 sm:space-y-2"><Label className="text-xs sm:text-sm">{t('message')}</Label><Textarea value={annMessage} onChange={e => setAnnMessage(e.target.value)} rows={3} className="text-xs sm:text-sm" /></div><div className="space-y-1 sm:space-y-2"><Label className="text-xs sm:text-sm">Cibler</Label><Select value={annTargetType} onValueChange={setAnnTargetType}><SelectTrigger className="text-xs sm:text-sm h-8 sm:h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les utilisateurs</SelectItem><SelectItem value="all_clients">Tous les clients</SelectItem><SelectItem value="all_providers">Tous les prestataires &amp; entreprises</SelectItem><SelectItem value="all_prestataires">Tous les prestataires</SelectItem><SelectItem value="all_entreprises">Toutes les entreprises</SelectItem></SelectContent></Select></div><Button className={th.primary + ' ' + th.primaryText + ' text-xs sm:text-sm h-8 sm:h-9'} onClick={handleSendAnnouncement} disabled={annLoading}>{annLoading ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" /> : <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}{t('send')}</Button></CardContent></Card></TabsContent>
        <TabsContent value="secteurs"><Card><CardHeader className="p-3 sm:p-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><CardTitle className="text-sm sm:text-base">Gestion des secteurs &amp; services</CardTitle><div className="flex gap-1"><Button size="sm" className="text-xs h-7 sm:h-8 bg-emerald-600 text-white" onClick={() => { const n = prompt('Nom du nouveau secteur:'); if (n) { setAdminSectorsData(p => [...p, { name: n, services: [] }]) } }}><Plus className="h-3 w-3 mr-1" />Secteur</Button><Button size="sm" className="text-xs h-7 sm:h-8 bg-blue-600 text-white" onClick={handleSaveSectors}><Save className="h-3 w-3 mr-1" />Enregistrer</Button></div></div></CardHeader><CardContent className="p-3 sm:p-6 pt-0 sm:pt-0"><div className="space-y-3 max-h-[500px] overflow-y-auto">{adminSectorsData.length === 0 && <p className="text-center text-gray-400 py-8 text-xs sm:text-sm">Aucun secteur</p>}{adminSectorsData.map((sec, si) => (<div key={si} className="p-3 rounded-lg border border-gray-100"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><input value={sec.name} onChange={e => { const c = [...adminSectorsData]; c[si] = { ...c[si], name: e.target.value }; setAdminSectorsData(c) }} className="font-medium text-xs sm:text-sm border-b border-gray-200 focus:border-emerald-500 outline-none bg-transparent px-1 py-0.5" /><Badge variant="secondary" className="text-[10px]">{sec.services.length}</Badge></div><div className="flex gap-1"><Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setActiveSectorEdit(activeSectorEdit === si ? null : si)}><Edit className="h-3 w-3" /></Button><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => { if (confirm('Supprimer ce secteur?')) setAdminSectorsData(p => p.filter((_, i) => i !== si)) }}><Trash2 className="h-3 w-3" /></Button></div></div>{activeSectorEdit === si && <div className="space-y-1.5 mt-2 border-t pt-2">{sec.services.map((sv: string, svIdx: number) => (<div key={svIdx} className="flex items-center gap-2"><input value={sv} onChange={e => { const c = [...adminSectorsData]; c[si].services[svIdx] = e.target.value; setAdminSectorsData(c) }} className="flex-1 text-[10px] sm:text-xs border-b border-gray-100 focus:border-emerald-500 outline-none bg-transparent px-1 py-0.5" /><Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400" onClick={() => { const c = [...adminSectorsData]; c[si].services.splice(svIdx, 1); setAdminSectorsData(c) }}><X className="h-2.5 w-2.5" /></Button></div>))}<div className="flex gap-1 mt-1"><Input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder="Nouveau service" className="text-[10px] sm:text-xs h-7 flex-1" onKeyDown={e => { if (e.key === 'Enter' && newServiceName.trim()) { const c = [...adminSectorsData]; c[si].services.push(newServiceName.trim()); setAdminSectorsData(c); setNewServiceName('') } }} /><Button size="sm" className="h-7 text-xs bg-gray-100" onClick={() => { if (newServiceName.trim()) { const c = [...adminSectorsData]; c[si].services.push(newServiceName.trim()); setAdminSectorsData(c); setNewServiceName('') } }}><Plus className="h-3 w-3" /></Button></div></div>}</div>))}</div></CardContent></Card></TabsContent>
        <TabsContent value="messages"><Card><CardHeader className="p-3 sm:p-6"><CardTitle className="text-sm sm:text-base">{t('contactMessages')}</CardTitle></CardHeader><CardContent className="p-3 sm:p-6 pt-0 sm:pt-0"><div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">{adminMessages.map((m: any) => (<div key={m.id} className="p-2 sm:p-3 rounded-lg border border-gray-100"><div className="flex items-start justify-between mb-1 flex-wrap gap-1"><div><h4 className="font-medium text-xs sm:text-sm">{m.name}</h4><p className="text-[10px] sm:text-xs text-gray-500">{m.email}</p></div>{m.reply ? <Badge className={'text-[10px] ' + (theme === 'red' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')}>{t('replied')}</Badge> : <Badge variant="outline" className="text-[10px]">{t('notReplied')}</Badge>}</div><p className={'text-[10px] sm:text-sm ' + th.textSecondary + ' mt-1'}>{m.message}</p>{!m.reply && <div className="flex gap-1 sm:gap-2 mt-2"><Input placeholder={t('yourReply')} value={replyTexts[m.id] || ''} onChange={e => setReplyTexts(p => ({ ...p, [m.id]: e.target.value }))} className="flex-1 text-xs h-7 sm:h-8" /><Button size="sm" className={th.primary + ' ' + th.primaryText + ' text-xs h-7 sm:h-8'} onClick={() => { setReplyMsgId(m.id); setReplyText(replyTexts[m.id] || ''); handleReplyMessage() }} disabled={replyLoading || !(replyTexts[m.id] || '').trim()}><Send className="h-3 w-3" /></Button></div>}</div>))}</div></CardContent></Card></TabsContent>
        <TabsContent value="certifications"><Card><CardHeader className="p-3 sm:p-6"><CardTitle className="flex items-center gap-2 text-sm sm:text-base"><ShieldCheck className="h-4 w-4 text-amber-500" />Demandes de certification <Badge className="bg-amber-500 text-white text-xs">{adminCertRequests.filter(r => r.certificationStatus === 'pending').length}</Badge></CardTitle></CardHeader><CardContent className="p-3 sm:p-6 pt-0 sm:pt-0"><div className="space-y-2 max-h-[500px] overflow-y-auto">{adminCertRequests.length === 0 ? <p className="text-center text-gray-400 py-8 text-xs sm:text-sm">Aucune demande</p> : adminCertRequests.map((r: any) => (<div key={r.id} className="p-3 rounded-lg border border-gray-100"><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-3 min-w-0"><Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"><AvatarFallback className="text-xs bg-amber-50 text-amber-700">{getInitials(r.name)}</AvatarFallback></Avatar><div className="min-w-0"><p className="font-medium text-xs sm:text-sm truncate">{r.name}</p><p className="text-[10px] sm:text-xs text-gray-500">{r.role} · {r.sector || ''} · {r.certificationStatus === 'pending' ? 'En attente' : r.certificationStatus === 'rejected' ? 'Refusé' : r.certified ? 'Certifié' : r.certificationStatus || 'Aucune'}</p></div></div><div className="flex gap-1 shrink-0">{r.certificationStatus === 'pending' ? <Button size="sm" className="h-7 text-xs bg-emerald-600 text-white" onClick={() => { setCertActionUserId(r.id); setCertDialogAction('approve'); setCertMsg(''); setCertDialogOpen(true) }}><Check className="h-3 w-3 mr-1" />Approuver</Button> : null}{r.certificationStatus === 'pending' ? <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => { setCertActionUserId(r.id); setCertDialogAction('reject'); setCertMsg(''); setCertDialogOpen(true) }}><X className="h-3 w-3 mr-1" />Refuser</Button> : null}{r.certified ? <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600 border-amber-200" onClick={() => { setCertActionUserId(r.id); setCertDialogAction('pending'); setCertMsg(''); setCertDialogOpen(true) }}><ShieldCheck className="h-3 w-3 mr-1" />Rétrograder</Button> : null}</div></div>{r.certificationMessage && <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">Message: {r.certificationMessage}</p>}</div>))}</div></CardContent></Card></TabsContent>
        <TabsContent value="parametres"><Card><CardHeader className="p-3 sm:p-6"><CardTitle className="text-sm sm:text-base">Paramètres généraux</CardTitle></CardHeader><CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-1 sm:space-y-2"><Label className="text-xs sm:text-sm">Message d'accueil</Label><Textarea value={settingsWelcome} onChange={e => setSettingsWelcome(e.target.value)} rows={3} className="text-xs sm:text-sm" /><Button size="sm" className="text-xs h-7 sm:h-8 mt-1" onClick={() => handleSaveSetting('welcome_message', settingsWelcome)} disabled={settingsLoading}>Enregistrer</Button></div>
          <div className="space-y-1 sm:space-y-2"><Label className="text-xs sm:text-sm">Email de contact</Label><Input type="email" value={settingsContactEmail} onChange={e => setSettingsContactEmail(e.target.value)} className="text-xs sm:text-sm h-8 sm:h-9" /><Button size="sm" className="text-xs h-7 sm:h-8 mt-1" onClick={() => handleSaveSetting('contact_email', settingsContactEmail)} disabled={settingsLoading}>Enregistrer</Button></div>
          <div className="space-y-1 sm:space-y-2"><Label className="text-xs sm:text-sm">Mode maintenance</Label><div className="flex items-center gap-2"><input type="checkbox" checked={settingsMaintenanceMode} onChange={e => { setSettingsMaintenanceMode(e.target.checked); handleSaveSetting('maintenance_mode', e.target.checked ? 'true' : 'false') }} className="h-4 w-4 accent-emerald-600" /><span className="text-xs sm:text-sm text-gray-600">{settingsMaintenanceMode ? 'Activé' : 'Désactivé'}</span></div></div>
          <Separator />
          <div className="space-y-1 sm:space-y-2"><Label className="text-xs sm:text-sm">Mot de passe admin</Label><p className="text-[10px] sm:text-xs text-gray-400">Défini dans le fichier <code className="bg-gray-100 px-1 rounded">src/lib/auth.ts</code></p></div>
        </CardContent></Card></TabsContent>
        <TabsContent value="historique"><Card><CardHeader className="p-3 sm:p-6"><CardTitle className="text-sm sm:text-base">Historique des actions admin</CardTitle></CardHeader><CardContent className="p-3 sm:p-6 pt-0 sm:pt-0"><div className="space-y-2 max-h-[500px] overflow-y-auto">{adminActions.length === 0 ? <p className="text-center text-gray-400 py-8 text-xs sm:text-sm">Aucune action enregistrée</p> : adminActions.map((a: any) => (<div key={a.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-gray-100"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 bg-emerald-400 shrink-0" /><div className="min-w-0"><p className="text-[10px] sm:text-xs text-gray-400">{new Date(a.createdAt).toLocaleString('fr-FR')}</p><p className="text-xs sm:text-sm font-medium">{a.details || a.action}</p><p className="text-[8px] sm:text-[10px] text-gray-400 font-mono break-all">{a.targetId || ''}</p></div></div>))}</div></CardContent></Card></TabsContent>
      </Tabs></div>
      {/* Suspend dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}><DialogContent className="max-w-sm sm:max-w-lg"><DialogHeader><DialogTitle className="text-sm sm:text-base">{t('suspend')}</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label className="text-xs sm:text-sm">Raison</Label><Textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} className="text-xs sm:text-sm" /></div></div><DialogFooter><Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setSuspendDialogOpen(false)}>{t('cancel')}</Button><Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8" onClick={() => { handleAdminAction(suspendUserId, 'suspend', suspendReason); setSuspendDialogOpen(false); setSuspendReason('') }}>{t('suspend')}</Button></DialogFooter></DialogContent></Dialog>
      {/* Certification dialog */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}><DialogContent className="max-w-sm sm:max-w-lg"><DialogHeader><DialogTitle className="text-sm sm:text-base">Action de certification</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label className="text-xs sm:text-sm">Message pour le prestataire</Label><Textarea value={certMsg} onChange={e => setCertMsg(e.target.value)} rows={3} className="text-xs sm:text-sm" placeholder="Écrivez un message expliquant votre décision..." /></div></div><DialogFooter><Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setCertDialogOpen(false)}>Annuler</Button><Button size="sm" className={'text-xs h-8 ' + (certDialogAction === 'approve' ? 'bg-emerald-600 text-white' : certDialogAction === 'reject' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white')} onClick={async () => { setCertLoading(true); try { const r = await fetch('/api/admin/certification', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ userId: certActionUserId, action: certDialogAction, message: certMsg }) }); if (r.ok) { toast({ title: 'Action effectuée' }); setCertDialogOpen(false); setCertMsg(''); fetchAdminData() } } catch { /* */ }; setCertLoading(false) }} disabled={certLoading}>{certLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}{certDialogAction === 'approve' ? 'Approuver' : certDialogAction === 'reject' ? 'Refuser' : 'Mettre en attente'}</Button></DialogFooter></DialogContent></Dialog>
      {/* User detail dialog */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}><DialogContent className="max-w-sm sm:max-w-lg max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2 text-sm sm:text-base"><IdCard className={'h-4 w-4 sm:h-5 sm:w-5 ' + th.accent} />{t('userDetails')}</DialogTitle></DialogHeader>{userDetailData && <div className="space-y-3 sm:space-y-4 py-2">
        <div className="flex items-center gap-3 sm:gap-4"><Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-4 ring-emerald-100"><AvatarImage src={userDetailData.profile?.logo || userDetailData.profile?.photo} /><AvatarFallback className={'text-sm sm:text-base ' + (theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>{getInitials(userDetailData.profile?.companyName || userDetailData.profile?.fullName || 'U')}</AvatarFallback></Avatar><div><h3 className={'font-bold text-sm sm:text-lg ' + th.textPrimary}>{userDetailData.profile?.companyName || userDetailData.profile?.fullName || 'Sans nom'}</h3><div className="flex items-center gap-1 sm:gap-2 mt-1"><Badge variant="secondary" className="text-[10px] sm:text-xs">{userDetailData.role}</Badge>{getStatusBadge(userDetailData.status, theme)}</div></div></div>
        <Separator />
        <div className={'flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ' + th.alertBg}><Key className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5" /><div><p className="text-[10px] sm:text-xs text-gray-500 font-medium">ID</p><p className="text-[10px] sm:text-xs font-mono text-gray-800 break-all">{userDetailData.id}</p></div></div>
        <div className="space-y-1 sm:space-y-2"><h4 className={'text-xs sm:text-sm font-semibold ' + th.textPrimary}>{t('contactInfo')}</h4><div className="space-y-1 sm:space-y-2 pl-1"><div className={'flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm ' + th.textSecondary}><Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />{userDetailData.phone}</div>{userDetailData.email && <div className={'flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm ' + th.textSecondary}><Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />{userDetailData.email}</div>}{userDetailData.profile?.province && <div className={'flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm ' + th.textSecondary}><MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />{userDetailData.profile.province}{userDetailData.profile.commune ? ', ' + userDetailData.profile.commune : ''}</div>}</div></div>
        {userDetailData.profile && (<><Separator /><div className="space-y-1 sm:space-y-2"><h4 className={'text-xs sm:text-sm font-semibold ' + th.textPrimary}>Profil</h4><div className="space-y-1 sm:space-y-2 pl-1">{userDetailData.profile.sector && <div className={'text-[10px] sm:text-sm ' + th.textSecondary}>Secteur: <strong>{userDetailData.profile.sector}</strong></div>}{userDetailData.profile.services && userDetailData.profile.services.length > 0 && <div className="flex flex-wrap gap-1">{userDetailData.profile.services.map((s: string) => (<Badge key={s} variant="secondary" className={'text-[8px] sm:text-[10px] ' + (theme === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>{s}</Badge>))}</div>}{userDetailData.profile.description && <p className={'text-[10px] sm:text-sm ' + th.textSecondary + ' bg-gray-50 p-2 rounded'}>{userDetailData.profile.description}</p>}</div></div></>)}
        <Separator />
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className={'h-4 w-4 ' + (userDetailData.certified ? 'text-amber-500' : 'text-gray-300')} /><span className={'text-xs sm:text-sm ' + th.textPrimary}>Certification</span>{userDetailData.certified && <Badge className="bg-amber-500 text-white text-[10px]">Certifié</Badge>}</div><Button size="sm" variant={userDetailData.certified ? 'outline' : 'default'} className={'text-xs ' + (userDetailData.certified ? '' : 'bg-amber-500 text-white hover:bg-amber-600')} onClick={async () => { if (!confirm('Confirmer le changement de certification ?')) return; try { const r = await fetch('/api/admin/users', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ userId: userDetailData.id, action: 'toggle-certification' }) }); if (r.ok) { toast({ title: userDetailData.certified ? 'Certification retirée' : 'Utilisateur certifié' }); fetchAdminData() } } catch { /* */ } }}>{userDetailData.certified ? 'Retirer' : 'Certifier'}</Button></div>
      </div>}</DialogContent></Dialog>
      {/* Onboarding */}
      <Dialog open={showOnboarding} onOpenChange={(v) => { setShowOnboarding(v); if (!v) { localStorage.setItem('vservicerdc_onboarded', '1'); setOnboardingStep(0) } }}><DialogContent className="max-w-sm sm:max-w-md"><DialogHeader><DialogTitle className={'flex items-center gap-2 text-sm sm:text-base ' + th.accent}>{[t('onboardTitle'), t('onboardStep1'), t('onboardStep2'), t('onboardStep3')][onboardingStep]}</DialogTitle></DialogHeader><div className="py-4 text-center space-y-4">{[<><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center"><img src="/logo.png" alt="VServiceRDC" className="h-10 w-auto sm:h-14" /></div><p className={'text-xs sm:text-sm ' + th.textSecondary}>{t('onboard0')}</p></>, <><div className={'w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full ' + th.accentLight + ' flex items-center justify-center ' + th.accent}><Search className="h-6 w-6 sm:h-8 sm:w-8" /></div><p className={'text-xs sm:text-sm ' + th.textSecondary}>{t('onboard1')}</p></>, <><div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center"><Star className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" /></div><p className={'text-xs sm:text-sm ' + th.textSecondary}>{t('onboard2')}</p></>, <><div className={'w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full ' + th.accentLight + ' flex items-center justify-center ' + th.accent}><Bell className="h-6 w-6 sm:h-8 sm:w-8" /></div><p className={'text-xs sm:text-sm ' + th.textSecondary}>{t('onboard3')}</p></>][onboardingStep]}</div><DialogFooter className="flex-col gap-2"><div className="flex gap-2 w-full">{onboardingStep > 0 && <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setOnboardingStep(s => s - 1)}>{t('previous')}</Button>}{onboardingStep < 3 ? <Button size="sm" className={'flex-1 text-xs ' + th.primary + ' ' + th.primaryText} onClick={() => setOnboardingStep(s => s + 1)}>{t('next')} <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" /></Button> : <Button size="sm" className={'flex-1 text-xs ' + th.primary + ' ' + th.primaryText} onClick={() => { setShowOnboarding(false); localStorage.setItem('vservicerdc_onboarded', '1'); setOnboardingStep(0) }}><Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />{t('letsGo')}</Button>}</div><Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={() => { setShowOnboarding(false); localStorage.setItem('vservicerdc_onboarded', '1'); setOnboardingStep(0) }}>{t('skip')}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )

  // ============================================================
  // MAIN RENDER
  if (initialLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="text-emerald-600 font-medium">Chargement...</p>
      </div>
    </div>
  )
  if (currentView === 'landing') return renderLanding()
  if (currentView === 'login') return renderLogin()
  if (currentView === 'register') return renderRegister()
  if (currentView === 'client-dashboard') return renderClientDashboard()
  if (currentView === 'browse-sectors') return renderBrowseSectors()
  if (currentView === 'provider-detail') return renderProviderDetail()
  if (currentView === 'prestataire-dashboard') return renderProviderDashboard()
  if (currentView === 'entreprise-dashboard') return renderProviderDashboard()
  if (currentView === 'admin-dashboard') return renderAdminDashboard()
  if (currentView === 'notifications') return renderNotifications()
  if (currentView === 'chat') return renderChat()
  if (currentView === 'chat-conversation') return renderChatConversation()
  if (currentView === 'settings') return renderSettings()
  if (currentView === 'profile-edit') return renderProfileEdit()
  return renderLanding()
}
