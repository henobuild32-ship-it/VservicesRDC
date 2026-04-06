'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'
import { provinces, kinshasaCommunes, getCommunes, getAllProvinceNames } from '@/data/rdc'
import { sectors, getServicesBySector, getAllSectorNames, getAllServices } from '@/data/sectors'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

// Lucide icons
import {
  Home, Search, Bell, User, Settings, LogOut, ChevronLeft, ChevronRight,
  Star, Phone, Mail, MapPin, Globe, Camera, Upload, Eye, EyeOff,
  CheckCircle, XCircle, Clock, AlertTriangle, Info, Send, MessageSquare,
  Building2, Briefcase, Users, Shield, Heart, ArrowRight, Menu,
  Plus, Minus, Edit, Trash2, Ban, Check, X, RefreshCw, Loader2,
  Sparkles, ShieldCheck, TrendingUp, FileText, Image, ThumbsUp,
  MoreVertical, Lock, Key, Copy, ExternalLink, Store, Wrench
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type ViewName = 'landing' | 'login' | 'register' | 'client-dashboard' | 'provider-detail' |
  'prestataire-dashboard' | 'entreprise-dashboard' | 'admin-dashboard' |
  'notifications' | 'settings' | 'profile-edit'

type AccountType = 'CLIENT' | 'PRESTATAIRE' | 'ENTREPRISE' | 'ADMIN'

interface UserProfile {
  id: string
  phone: string
  email?: string
  role: AccountType
  status?: string
  profile?: {
    fullName?: string
    companyName?: string
    photo?: string
    logo?: string
    coverPhoto?: string
    sector?: string
    services?: string[]
    province?: string
    commune?: string
    nationalScope?: boolean
    description?: string
    website?: string
    socialMedia?: Record<string, string>
    companyType?: string
    employeeCount?: number
    fullAddress?: string
  }
}

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  type?: string
  createdAt: string
}

interface Review {
  id: string
  authorName: string
  rating: number
  comment: string
  createdAt: string
}

interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  reply?: string
  createdAt: string
}

interface ProviderResult {
  id: string
  phone: string
  role: AccountType
  status?: string
  profile?: {
    fullName?: string
    companyName?: string
    photo?: string
    logo?: string
    sector?: string
    services?: string[]
    province?: string
    commune?: string
    nationalScope?: boolean
    description?: string
    website?: string
    socialMedia?: Record<string, string>
    companyType?: string
    employeeCount?: number
  }
}

interface Announcement {
  id: string
  title: string
  message: string
  targetType: string
  createdAt: string
}

// ============================================================
// HELPERS
// ============================================================

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let pass = ''
  for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
  return pass
}

function formatPhone(val: string): string {
  let cleaned = val.replace(/\D/g, '')
  if (!cleaned.startsWith('243')) cleaned = '243' + cleaned.replace(/^0+/, '')
  return '+243 ' + cleaned.slice(3).replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3').trim()
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
  ))
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approuvé</Badge>
    case 'pending': return <Badge className="bg-amber-100 text-amber-700 border-amber-200">En attente</Badge>
    case 'rejected': return <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté</Badge>
    case 'suspended': return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Suspendu</Badge>
    case 'active': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Actif</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

// ============================================================
// MAIN APP COMPONENT
// ============================================================

export default function VServiceRDC() {
  // Navigation state
  const [currentView, setCurrentView] = useState<ViewName>('landing')
  const [viewParams, setViewParams] = useState<Record<string, any>>({})

  // Auth state - initialize from localStorage
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('vservicerdc_token')
    return null
  })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Provider detail state
  const [providerDetail, setProviderDetail] = useState<ProviderResult | null>(null)
  const [providerReviews, setProviderReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  // Contact messages state
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])

  // Admin state
  const [adminStats, setAdminStats] = useState<Record<string, number>>({})
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminAnnouncements, setAdminAnnouncements] = useState<Announcement[]>([])
  const [adminMessages, setAdminMessages] = useState<any[]>([])

  // Navigation
  const navigate = useCallback((view: ViewName, params?: Record<string, any>) => {
    setCurrentView(view)
    setViewParams(params || {})
    window.scrollTo(0, 0)
  }, [])

  // Auth helpers
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token])

  const multiPartHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`
  }), [token])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        // API now returns flat structure with profile field
        const userData: UserProfile = {
          id: data.id,
          phone: data.phone,
          email: data.email,
          role: data.role,
          status: data.status,
          profile: data.profile || undefined,
        }
        setUser(userData)
        // Navigate to appropriate dashboard
        const role = data.role as string
        if (role === 'ADMIN') navigate('admin-dashboard')
        else if (role === 'CLIENT') navigate('client-dashboard')
        else if (role === 'PRESTATAIRE') navigate('prestataire-dashboard')
        else if (role === 'ENTREPRISE') navigate('entreprise-dashboard')
      } else {
        localStorage.removeItem('vservicerdc_token')
        setToken(null)
      }
    } catch {
      localStorage.removeItem('vservicerdc_token')
      setToken(null)
    }
  }

  // Fetch user profile when token exists and no user loaded yet
  useEffect(() => {
    if (token && !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount
      void fetchUserProfile()
    }
  }, [token, user])

  const logout = () => {
    localStorage.removeItem('vservicerdc_token')
    setToken(null)
    setUser(null)
    setNotifications([])
    setUnreadCount(0)
    navigate('landing')
    toast({ title: 'Déconnexion', description: 'Vous avez été déconnecté avec succès.' })
  }

  const fetchNotifications = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/notifications', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch { /* silent */ }
  }

  const markNotificationRead = async (id?: string) => {
    if (!token) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(id ? { notificationId: id } : {})
      })
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch { /* silent */ }
  }

  // Fetch contact messages
  const fetchContactMessages = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/contact', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setContactMessages(Array.isArray(data) ? data : data.messages || [])
      }
    } catch { /* silent */ }
  }

  // ============================================================
  // LOGIN VIEW
  // ============================================================
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginIsAdmin, setLoginIsAdmin] = useState(false)
  const [loginAdminPass, setLoginAdminPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async () => {
    // Admin mode: only admin password needed
    if (loginIsAdmin) {
      if (!loginAdminPass) {
        toast({ title: 'Erreur', description: 'Veuillez entrer le mot de passe administrateur.', variant: 'destructive' })
        return
      }
      setLoginLoading(true)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAdmin: true, adminPassword: loginAdminPass })
        })
        const data = await res.json()
        if (res.ok) {
          localStorage.setItem('vservicerdc_token', data.token)
          setToken(data.token)
          toast({ title: 'Connexion admin réussie', description: 'Bienvenue dans l\'espace administrateur !' })
        } else {
          toast({ title: 'Erreur', description: data.error || 'Mot de passe administrateur incorrect.', variant: 'destructive' })
        }
      } catch {
        toast({ title: 'Erreur', description: 'Erreur de connexion au serveur.', variant: 'destructive' })
      }
      setLoginLoading(false)
      return
    }
    // Regular user login
    if (!loginPhone || !loginPassword) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs.', variant: 'destructive' })
      return
    }
    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhone(loginPhone), password: loginPassword })
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('vservicerdc_token', data.token)
        setToken(data.token)
        toast({ title: 'Connexion réussie', description: 'Bienvenue sur VServiceRDC !' })
      } else {
        toast({ title: 'Erreur de connexion', description: data.message || data.error || 'Identifiants incorrects.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur de connexion au serveur.', variant: 'destructive' })
    }
    setLoginLoading(false)
  }

  const renderLogin = () => (
    <div className="min-h-screen flex flex-col items-center justify-start pt-8 px-4 pb-24 bg-gradient-to-b from-emerald-50 to-white fade-in">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate('landing')} className="mb-6 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
          <ChevronLeft className="h-4 w-4 mr-1" /> Retour à l'accueil
        </Button>

        <div className="text-center mb-8">
          <img src="/logo.png" alt="VServiceRDC" className="h-16 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-500 mt-1">
            {loginIsAdmin ? 'Accédez à l\'espace administrateur' : 'Accédez à votre compte VServiceRDC'}
          </p>
        </div>

        <Card className="shadow-lg border-emerald-100">
          <CardContent className="pt-6 space-y-4">
            {/* Admin toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox id="admin-toggle" checked={loginIsAdmin} onCheckedChange={(v) => setLoginIsAdmin(v === true)} />
              <Label htmlFor="admin-toggle" className="text-sm cursor-pointer font-medium">
                <Shield className="h-4 w-4 inline-block mr-1 text-emerald-600" />
                Espace Admin
              </Label>
            </div>

            <Separator />

            {loginIsAdmin ? (
              /* === ADMIN MODE: only admin password === */
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Shield className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Connexion Administrateur</p>
                    <p className="text-xs text-emerald-600">Entrez votre mot de passe pour accéder au tableau de bord</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-pass">Mot de passe administrateur</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="admin-pass"
                      type={showLoginPass ? 'text' : 'password'}
                      placeholder="Mot de passe administrateur"
                      value={loginAdminPass}
                      onChange={e => setLoginAdminPass(e.target.value)}
                      className="pl-10 pr-10"
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    <button onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleLogin} disabled={loginLoading}>
                  {loginLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Accéder au dashboard admin
                </Button>
              </div>
            ) : (
              /* === NORMAL MODE: phone + password === */
              <>
                <div className="space-y-2">
                  <Label htmlFor="login-phone">Numéro de téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-phone"
                      placeholder="+243 XXX XXX XXX"
                      value={loginPhone}
                      onChange={e => setLoginPhone(formatPhone(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type={showLoginPass ? 'text' : 'password'}
                      placeholder="Votre mot de passe"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10"
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    <button onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleLogin} disabled={loginLoading}>
                  {loginLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Se connecter
                </Button>

                <p className="text-center text-sm text-gray-500">
                  Pas encore de compte ?{' '}
                  <button onClick={() => navigate('register')} className="text-emerald-600 font-medium hover:underline">
                    S'inscrire
                  </button>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // ============================================================
  // REGISTER VIEW
  // ============================================================
  const [regStep, setRegStep] = useState(0)
  const [regType, setRegType] = useState<AccountType | ''>('')
  const [regLoading, setRegLoading] = useState(false)
  const [showRegPass, setShowRegPass] = useState(false)

  // Common fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPass, setRegConfirmPass] = useState('')
  const [regPhoto, setRegPhoto] = useState<File | null>(null)
  const [regPhotoPreview, setRegPhotoPreview] = useState<string>('')
  const [regSector, setRegSector] = useState('')
  const [regServices, setRegServices] = useState<string[]>([])
  const [regProvince, setRegProvince] = useState('')
  const [regCommune, setRegCommune] = useState('')
  const [regNationalScope, setRegNationalScope] = useState(false)
  const [regDescription, setRegDescription] = useState('')
  const [regSocialFB, setRegSocialFB] = useState('')
  const [regSocialIG, setRegSocialIG] = useState('')
  const [regSocialTW, setRegSocialTW] = useState('')

  // Entreprise specific
  const [regCompanyName, setRegCompanyName] = useState('')
  const [regLogo, setRegLogo] = useState<File | null>(null)
  const [regLogoPreview, setRegLogoPreview] = useState<string>('')
  const [regCover, setRegCover] = useState<File | null>(null)
  const [regCoverPreview, setRegCoverPreview] = useState<string>('')
  const [regCompanyType, setRegCompanyType] = useState('')
  const [regEmployeeCount, setRegEmployeeCount] = useState('')
  const [regWebsite, setRegWebsite] = useState('')
  const [regFullAddress, setRegFullAddress] = useState('')

  const handlePhotoChange = (file: File, setFile: (f: File | null) => void, setPreview: (p: string) => void) => {
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleGeneratePassword = () => {
    const pwd = generatePassword()
    setRegPassword(pwd)
    setRegConfirmPass(pwd)
    toast({ title: 'Mot de passe généré', description: 'Copiez et conservez ce mot de passe.' })
  }

  const toggleService = (service: string) => {
    setRegServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service])
  }

  const handleRegister = async () => {
    if (!regType) {
      toast({ title: 'Erreur', description: 'Choisissez un type de compte.', variant: 'destructive' })
      return
    }
    if (!regPhone || !regPassword) {
      toast({ title: 'Erreur', description: 'Téléphone et mot de passe sont requis.', variant: 'destructive' })
      return
    }
    if (regType === 'CLIENT' && regPassword !== regConfirmPass) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas.', variant: 'destructive' })
      return
    }

    setRegLoading(true)
    try {
      const body: any = {
        phone: formatPhone(regPhone),
        password: regPassword,
        role: regType,
        email: regEmail || undefined
      }

      // Add profile fields
      const profile: any = {}
      if (regType === 'CLIENT') {
        profile.fullName = regName
      } else if (regType === 'PRESTATAIRE') {
        profile.fullName = regName
        profile.sector = regSector
        if (regServices.length > 0) profile.services = regServices
        if (regProvince) profile.province = regProvince
        if (regCommune) profile.commune = regCommune
        profile.nationalScope = regNationalScope
        profile.description = regDescription
        const social: any = {}
        if (regSocialFB) social.facebook = regSocialFB
        if (regSocialIG) social.instagram = regSocialIG
        if (regSocialTW) social.twitter = regSocialTW
        if (Object.keys(social).length > 0) profile.socialMedia = social
      } else if (regType === 'ENTREPRISE') {
        profile.companyName = regCompanyName
        profile.sector = regSector
        if (regServices.length > 0) profile.services = regServices
        profile.companyType = regCompanyType
        if (regEmployeeCount) profile.employeeCount = parseInt(regEmployeeCount)
        profile.website = regWebsite
        profile.fullAddress = regFullAddress
        if (regProvince) profile.province = regProvince
        if (regCommune) profile.commune = regCommune
        profile.nationalScope = regNationalScope
        const social: any = {}
        if (regSocialFB) social.facebook = regSocialFB
        if (regSocialIG) social.instagram = regSocialIG
        if (regSocialTW) social.twitter = regSocialTW
        if (Object.keys(social).length > 0) profile.socialMedia = social
      }
      body.profile = profile

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (res.ok) {
        // Upload photo/logo if provided
        if (regType === 'PRESTATAIRE' && regPhoto && data.user?.id) {
          const fd = new FormData()
          fd.append('file', regPhoto)
          fd.append('type', 'provider-photo')
          fd.append('userId', data.user.id)
          await fetch('/api/upload', { method: 'POST', headers: multiPartHeaders(), body: fd })
        }
        if (regType === 'ENTREPRISE') {
          if (regLogo && data.user?.id) {
            const fd = new FormData()
            fd.append('file', regLogo)
            fd.append('type', 'company-logo')
            fd.append('userId', data.user.id)
            await fetch('/api/upload', { method: 'POST', headers: multiPartHeaders(), body: fd })
          }
          if (regCover && data.user?.id) {
            const fd = new FormData()
            fd.append('file', regCover)
            fd.append('type', 'company-cover')
            fd.append('userId', data.user.id)
            await fetch('/api/upload', { method: 'POST', headers: multiPartHeaders(), body: fd })
          }
        }

        toast({ title: 'Inscription réussie !', description: regType === 'CLIENT' ? 'Bienvenue sur VServiceRDC !' : 'Votre compte est en cours de vérification.' })
        navigate('login')
      } else {
        toast({ title: "Erreur d'inscription", description: data.message || data.error || 'Une erreur est survenue.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur de connexion au serveur.', variant: 'destructive' })
    }
    setRegLoading(false)
  }

  const resetRegForm = () => {
    setRegStep(0)
    setRegType('')
    setRegName('')
    setRegEmail('')
    setRegPhone('')
    setRegPassword('')
    setRegConfirmPass('')
    setRegPhoto(null)
    setRegPhotoPreview('')
    setRegSector('')
    setRegServices([])
    setRegProvince('')
    setRegCommune('')
    setRegNationalScope(false)
    setRegDescription('')
    setRegSocialFB('')
    setRegSocialIG('')
    setRegSocialTW('')
    setRegCompanyName('')
    setRegLogo(null)
    setRegLogoPreview('')
    setRegCover(null)
    setRegCoverPreview('')
    setRegCompanyType('')
    setRegEmployeeCount('')
    setRegWebsite('')
    setRegFullAddress('')
  }

  const renderRegister = () => {
    if (regStep === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-8 px-4 pb-24 bg-gradient-to-b from-emerald-50 to-white fade-in">
          <div className="w-full max-w-md">
            <Button variant="ghost" onClick={() => navigate('landing')} className="mb-6 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <div className="text-center mb-8">
              <img src="/logo.png" alt="VServiceRDC" className="h-14 w-auto mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
              <p className="text-gray-500 mt-1">Choisissez votre type de compte</p>
            </div>
            <div className="space-y-3">
              {([
                { type: 'CLIENT' as AccountType, icon: <User className="h-8 w-8" />, title: 'Client', desc: 'Trouvez des prestataires et entreprises près de chez vous' },
                { type: 'PRESTATAIRE' as AccountType, icon: <Wrench className="h-8 w-8" />, title: 'Prestataire', desc: 'Proposez vos services et trouvez des clients' },
                { type: 'ENTREPRISE' as AccountType, icon: <Building2 className="h-8 w-8" />, title: 'Entreprise', desc: "Développez votre visibilité et trouvez des opportunités" }
              ]).map(item => (
                <Card key={item.type} className="cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all border-emerald-100" onClick={() => { setRegType(item.type); setRegStep(1) }}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-auto flex-shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // Step 1: Registration form based on type
    return (
      <div className="min-h-screen flex flex-col items-center justify-start pt-8 px-4 pb-24 bg-gradient-to-b from-emerald-50 to-white fade-in">
        <div className="w-full max-w-lg">
          <Button variant="ghost" onClick={() => { setRegStep(0); resetRegForm() }} className="mb-4 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Inscription {regType === 'CLIENT' ? 'Client' : regType === 'PRESTATAIRE' ? 'Prestataire' : 'Entreprise'}
            </h1>
          </div>

          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <Card className="shadow-lg border-emerald-100 mb-6">
              <CardContent className="pt-6 space-y-4">
                {/* Name / Company */}
                {regType === 'ENTREPRISE' ? (
                  <div className="space-y-2">
                    <Label>Nom de l'entreprise *</Label>
                    <Input placeholder="Ex: ABC Construction SARL" value={regCompanyName} onChange={e => setRegCompanyName(e.target.value)} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Nom complet {regType === 'CLIENT' ? '*' : ''}</Label>
                    <Input placeholder="Jean Dupont" value={regName} onChange={e => setRegName(e.target.value)} />
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type="email" placeholder="email@exemple.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="pl-10" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label>Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="+243 XXX XXX XXX" value={regPhone} onChange={e => setRegPhone(formatPhone(e.target.value))} className="pl-10" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label>Mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type={showRegPass ? 'text' : 'password'} placeholder="Minimum 6 caractères" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="pl-10 pr-10" />
                    <button onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showRegPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200" onClick={handleGeneratePassword}>
                    <Key className="h-3 w-3 mr-1" /> Générer un mot de passe
                  </Button>
                </div>

                {/* Confirm password (Client only) */}
                {regType === 'CLIENT' && (
                  <div className="space-y-2">
                    <Label>Confirmer le mot de passe *</Label>
                    <Input type="password" placeholder="Confirmez votre mot de passe" value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} />
                  </div>
                )}

                <Separator />

                {/* Photo/Logo upload */}
                {regType === 'PRESTATAIRE' && (
                  <div className="space-y-2">
                    <Label>Photo de profil</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={regPhotoPreview} />
                        <AvatarFallback><Camera className="h-6 w-6" /></AvatarFallback>
                      </Avatar>
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f, setRegPhoto, setRegPhotoPreview) }} />
                        <Button variant="outline" size="sm" asChild>
                          <span><Upload className="h-3 w-3 mr-1" /> Choisir</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                )}

                {regType === 'ENTREPRISE' && (
                  <>
                    <div className="space-y-2">
                      <Label>Logo de l'entreprise</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 rounded-lg">
                          <AvatarImage src={regLogoPreview} />
                          <AvatarFallback><Store className="h-6 w-6" /></AvatarFallback>
                        </Avatar>
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f, setRegLogo, setRegLogoPreview) }} />
                          <Button variant="outline" size="sm" asChild>
                            <span><Upload className="h-3 w-3 mr-1" /> Logo</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Photo de couverture</Label>
                      {regCoverPreview ? (
                        <div className="relative rounded-lg overflow-hidden">
                          <img src={regCoverPreview} alt="Cover" className="w-full h-32 object-cover" />
                          <button onClick={() => { setRegCover(null); setRegCoverPreview('') }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f, setRegCover, setRegCoverPreview) }} />
                          <div className="border-2 border-dashed border-emerald-200 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                            <Upload className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                            <p className="text-sm text-gray-500">Cliquez pour ajouter une couverture</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Sector & Services */}
                {(regType === 'PRESTATAIRE' || regType === 'ENTREPRISE') && (
                  <>
                    <div className="space-y-2">
                      <Label>Secteur d'activité *</Label>
                      <Select value={regSector} onValueChange={v => { setRegSector(v); setRegServices([]) }}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionnez un secteur" /></SelectTrigger>
                        <SelectContent>
                          {getAllSectorNames().map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {regSector && (
                      <div className="space-y-2">
                        <Label>Services {regType === 'ENTREPRISE' ? '(plusieurs possibles)' : ''} *</Label>
                        {regType === 'ENTREPRISE' ? (
                          <div className="grid grid-cols-1 gap-2">
                            {getServicesBySector(regSector).map(s => (
                              <div key={s} className="flex items-center space-x-2">
                                <Checkbox id={`svc-${s}`} checked={regServices.includes(s)} onCheckedChange={() => toggleService(s)} />
                                <Label htmlFor={`svc-${s}`} className="text-sm font-normal cursor-pointer">{s}</Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Select value={regServices[0] || ''} onValueChange={v => setRegServices([v])}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionnez un service" /></SelectTrigger>
                            <SelectContent>
                              {getServicesBySector(regSector).map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {regType === 'ENTREPRISE' && (
                      <>
                        <div className="space-y-2">
                          <Label>Type d'entreprise</Label>
                          <Select value={regCompanyType} onValueChange={setRegCompanyType}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Type d'entreprise" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individuelle">Individuelle</SelectItem>
                              <SelectItem value="avec_employes">Avec employés</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nombre d'employés</Label>
                          <Input type="number" placeholder="Ex: 15" value={regEmployeeCount} onChange={e => setRegEmployeeCount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Site web</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="https://www.exemple.com" value={regWebsite} onChange={e => setRegWebsite(e.target.value)} className="pl-10" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Adresse complète</Label>
                          <Input placeholder="Numéro, avenue, quartier..." value={regFullAddress} onChange={e => setRegFullAddress(e.target.value)} />
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Zone */}
                    <div className="flex items-center space-x-2">
                      <Checkbox id="national-scope" checked={regNationalScope} onCheckedChange={(v) => setRegNationalScope(v === true)} />
                      <Label htmlFor="national-scope" className="text-sm cursor-pointer">Portée nationale (intervention partout en RDC)</Label>
                    </div>

                    {!regNationalScope && (
                      <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                        <div className="space-y-2">
                          <Label>Province</Label>
                          <Select value={regProvince} onValueChange={v => { setRegProvince(v); setRegCommune('') }}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Province" /></SelectTrigger>
                            <SelectContent>
                              {getAllProvinceNames().map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Commune</Label>
                          <Select value={regCommune} onValueChange={setRegCommune} disabled={!regProvince}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Commune" /></SelectTrigger>
                            <SelectContent>
                              {regProvince && getCommunes(regProvince).map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Décrivez vos services, votre expérience..." value={regDescription} onChange={e => setRegDescription(e.target.value)} rows={4} />
                    </div>

                    <Separator />

                    {/* Social media */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Réseaux sociaux</Label>
                      <div className="space-y-2">
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                          <Input placeholder="Facebook" value={regSocialFB} onChange={e => setRegSocialFB(e.target.value)} className="pl-10" />
                        </div>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500" />
                          <Input placeholder="Instagram" value={regSocialIG} onChange={e => setRegSocialIG(e.target.value)} className="pl-10" />
                        </div>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                          <Input placeholder="Twitter / X" value={regSocialTW} onChange={e => setRegSocialTW(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4" onClick={handleRegister} disabled={regLoading}>
                  {regLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Créer mon compte
                </Button>

                <p className="text-center text-sm text-gray-500 pb-2">
                  Déjà un compte ?{' '}
                  <button onClick={() => { resetRegForm(); navigate('login') }} className="text-emerald-600 font-medium hover:underline">
                    Se connecter
                  </button>
                </p>
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
      </div>
    )
  }

  // ============================================================
  // LANDING PAGE
  // ============================================================
  const renderLanding = () => (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="VServiceRDC" className="h-9 w-auto" />
            <span className="font-bold text-lg text-emerald-700">VServiceRDC</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-emerald-700 text-sm" onClick={() => navigate('login')}>Connexion</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm" onClick={() => navigate('register')}>S'inscrire</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" /> La 1ère plateforme de services en RDC
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Trouvez les <span className="text-emerald-600">meilleurs prestataires</span> et entreprises en RDC
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Connectez-vous avec des professionnels vérifiés dans tous les secteurs : BTP, Technologie, Services à domicile, Transport et bien plus encore.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-6 rounded-xl" onClick={() => navigate('register')}>
            S'inscrire maintenant <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6 rounded-xl" onClick={() => navigate('login')}>
            Se connecter
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">Pourquoi VServiceRDC ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <ShieldCheck className="h-8 w-8" />, title: 'Prestataires vérifiés', desc: 'Tous nos prestataires passent par un processus de vérification rigoureux.' },
            { icon: <MapPin className="h-8 w-8" />, title: 'Recherche locale', desc: 'Trouvez des services proches de chez vous dans toutes les provinces de la RDC.' },
            { icon: <Star className="h-8 w-8" />, title: 'Avis et notes', desc: 'Consultez les avis et notez les prestataires pour une transparence totale.' },
          ].map((f, i) => (
            <Card key={i} className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sectors preview */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">Secteurs d'activité</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {getAllSectorNames().map((sector, i) => (
            <div key={sector} className="flex items-center gap-2 p-3 rounded-lg bg-white border border-emerald-100 text-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 text-xs font-bold">
                {String(i + 1).padStart(2, '0')}
              </div>
              <span className="text-gray-700 font-medium truncate">{sector}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.png" alt="VServiceRDC" className="h-7 w-auto" />
            <span className="font-semibold text-emerald-700">VServiceRDC</span>
          </div>
          <p className="text-sm text-gray-500">La plateforme de référence pour les services en République Démocratique du Congo</p>
          <p className="text-sm text-gray-400 mt-2">Créé par <span className="font-semibold text-emerald-600">HenoBuild</span></p>
        </div>
      </footer>
    </div>
  )

  // ============================================================
  // CLIENT DASHBOARD
  // ============================================================
  const [searchProvince, setSearchProvince] = useState('')
  const [searchCommune, setSearchCommune] = useState('')
  const [searchSector, setSearchSector] = useState('')
  const [searchService, setSearchService] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProviderResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (useMyCity?: boolean) => {
    setSearchLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (useMyCity && user?.profile?.province) params.set('province', user.profile.province)
      else if (searchProvince) params.set('province', searchProvince)
      if (searchCommune) params.set('commune', searchCommune)
      if (searchSector) params.set('sector', searchSector)
      if (searchService) params.set('service', searchService)
      if (searchQuery) params.set('query', searchQuery)

      const res = await fetch(`/api/providers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
      }
    } catch { /* silent */ }
    setSearchLoading(false)
  }

  const viewProviderDetail = async (providerId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/providers?userId=${providerId}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        // API returns flat structure with profile field
        setProviderDetail({
          id: data.id,
          phone: data.phone,
          role: data.role,
          status: data.status,
          profile: data.profile,
        })
        setAvgRating(data.avgRating || 0)
        setReviewCount(data.reviewCount || 0)
        setProviderReviews(data.reviews || [])
        navigate('provider-detail', { providerId })
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  const renderClientDashboard = () => (
    <div className="min-h-screen bg-gray-50 fade-in pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="VServiceRDC" className="h-8 w-auto" />
              <span className="font-bold text-lg">VServiceRDC</span>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-1">Bonjour{user?.profile?.fullName ? `, ${user.profile.fullName}` : ''} 👋</h2>
          <p className="text-emerald-100 text-sm">Trouvez les meilleurs prestataires près de chez vous</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Search card */}
        <Card className="shadow-lg mb-6 border-emerald-100">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher un service, un prestataire..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={searchProvince} onValueChange={v => { setSearchProvince(v); setSearchCommune('') }}>
                <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Province" /></SelectTrigger>
                <SelectContent>
                  {getAllProvinceNames().map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={searchCommune} onValueChange={setSearchCommune} disabled={!searchProvince}>
                <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Commune" /></SelectTrigger>
                <SelectContent>
                  {searchProvince && getCommunes(searchProvince).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={searchSector} onValueChange={v => { setSearchSector(v); setSearchService('') }}>
                <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Secteur" /></SelectTrigger>
                <SelectContent>
                  {getAllSectorNames().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={searchService} onValueChange={setSearchService} disabled={!searchSector}>
                <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  {searchSector && getServicesBySector(searchSector).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleSearch(false)}>
                {searchLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                Rechercher
              </Button>
              {user?.profile?.province && (
                <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => handleSearch(true)}>
                  <MapPin className="h-4 w-4 mr-1" /> Ma ville
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searchLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full rounded" /></CardContent></Card>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{searchResults.length} résultat(s) trouvé(s)</p>
            {searchResults.map(provider => (
              <Card key={provider.id} className="hover:shadow-md transition-shadow cursor-pointer border-emerald-50" onClick={() => viewProviderDetail(provider.id)}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-14 w-14 flex-shrink-0">
                      <AvatarImage src={provider.profile?.logo || provider.profile?.photo} />
                      <AvatarFallback className="bg-emerald-50 text-emerald-700">
                        {getInitials(provider.profile?.companyName || provider.profile?.fullName || 'P')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {provider.profile?.companyName || provider.profile?.fullName || 'Sans nom'}
                        </h3>
                        {provider.status && getStatusBadge(provider.status)}
                      </div>
                      <p className="text-sm text-emerald-600">{provider.profile?.sector || ''}</p>
                      {(provider.profile?.province || provider.profile?.nationalScope) && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="h-3 w-3" />
                          {provider.profile?.nationalScope ? 'Toute la RDC' : `${provider.profile?.province}${provider.profile?.commune ? `, ${provider.profile.commune}` : ''}`}
                        </div>
                      )}
                      {provider.profile?.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{provider.profile.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Aucun résultat trouvé</p>
                <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-emerald-200 mb-3" />
            <p className="text-gray-500">Recherchez des prestataires et entreprises</p>
            <p className="text-sm text-gray-400">Utilisez les filtres ci-dessus pour commencer</p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      {renderBottomNav('client-dashboard')}
    </div>
  )

  // ============================================================
  // PROVIDER DETAIL VIEW
  // ============================================================
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const submitReview = async () => {
    if (!providerDetail || !reviewRating) {
      toast({ title: 'Erreur', description: 'Veuillez donner une note.', variant: 'destructive' })
      return
    }
    setReviewLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          targetId: providerDetail.id,
          targetType: providerDetail.role === 'ENTREPRISE' ? 'COMPANY' : 'PROVIDER',
          rating: reviewRating,
          comment: reviewComment
        })
      })
      if (res.ok) {
        toast({ title: 'Avis publié', description: 'Merci pour votre avis !' })
        setShowReviewForm(false)
        setReviewRating(0)
        setReviewComment('')
        // Refresh reviews
        const revRes = await fetch(`/api/reviews?targetId=${providerDetail.id}`)
        if (revRes.ok) {
          const revData = await revRes.json()
          if (Array.isArray(revData)) setProviderReviews(revData)
          else setProviderReviews(revData.reviews || revData || [])
        }
      } else {
        const data = await res.json()
        toast({ title: 'Erreur', description: data.message || "Impossible de publier l'avis.", variant: 'destructive' })
      }
    } catch { /* silent */ }
    setReviewLoading(false)
  }

  const renderProviderDetail = () => (
    <div className="min-h-screen bg-gray-50 fade-in pb-20">
      {loading ? (
        <div className="p-4 space-y-4"><Skeleton className="h-48 w-full rounded" /><Skeleton className="h-32 w-full rounded" /><Skeleton className="h-64 w-full rounded" /></div>
      ) : providerDetail ? (
        <>
          {/* Header */}
          {providerDetail.role === 'ENTREPRISE' && providerDetail.profile?.coverPhoto && (
            <div className="h-36 bg-gray-200 relative">
              <img src={providerDetail.profile.coverPhoto} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}

          <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
            <Button variant="ghost" onClick={() => navigate(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))} className="mb-4 text-gray-600 hover:text-gray-800">
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </Button>

            <Card className="shadow-lg border-emerald-100">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-20 w-20 flex-shrink-0">
                    <AvatarImage src={providerDetail.profile?.logo || providerDetail.profile?.photo} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg">
                      {getInitials(providerDetail.profile?.companyName || providerDetail.profile?.fullName || 'P')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold text-gray-900">{providerDetail.profile?.companyName || providerDetail.profile?.fullName}</h1>
                      {providerDetail.status && getStatusBadge(providerDetail.status)}
                    </div>
                    <p className="text-emerald-600 font-medium">{providerDetail.profile?.sector}</p>
                    {(providerDetail.profile?.services?.length || 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {providerDetail.profile!.services!.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {providerDetail.profile?.description && (
                  <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap">{providerDetail.profile.description}</p>
                )}

                <Separator className="my-4" />

                {/* Contact info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Informations de contact</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    <a href={`tel:${providerDetail.phone}`} className="hover:text-emerald-600">{providerDetail.phone}</a>
                  </div>
                  {providerDetail.profile?.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-emerald-500" />
                      <a href={`mailto:${providerDetail.profile.email}`} className="hover:text-emerald-600">{providerDetail.profile.email}</a>
                    </div>
                  )}
                  {providerDetail.profile?.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      <a href={providerDetail.profile.website.startsWith('http') ? providerDetail.profile.website : `https://${providerDetail.profile.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">{providerDetail.profile.website}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    {providerDetail.profile?.nationalScope ? 'Portée nationale (Toute la RDC)' : `${providerDetail.profile?.province || ''}${providerDetail.profile?.commune ? `, ${providerDetail.profile.commune}` : ''}`}
                  </div>
                  {/* Social media */}
                  {providerDetail.profile?.socialMedia && Object.entries(providerDetail.profile.socialMedia).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      <span className="capitalize">{key}: {val as string}</span>
                    </div>
                  ))}
                  {providerDetail.role === 'ENTREPRISE' && providerDetail.profile?.employeeCount && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-emerald-500" />
                      {providerDetail.profile.employeeCount} employé(s)
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">{getStars(avgRating)}</div>
                  <span className="text-sm font-medium text-gray-700">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({reviewCount} avis)</span>
                </div>

                {/* Leave review button (only for clients) */}
                {user?.role === 'CLIENT' && (
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-4" onClick={() => setShowReviewForm(true)}>
                    <Star className="h-4 w-4 mr-1" /> Laisser un avis
                  </Button>
                )}

                {/* Reviews list */}
                <h3 className="font-semibold text-gray-900 mb-3">Avis ({providerReviews.length})</h3>
                {providerReviews.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {providerReviews.map(review => (
                      <Card key={review.id} className="border-emerald-50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs bg-emerald-50 text-emerald-700">{getInitials(review.authorName || 'U')}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-gray-900">{review.authorName || 'Anonyme'}</span>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">{getStars(review.rating)}</div>
                          <p className="text-sm text-gray-600">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun avis pour le moment</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Review dialog */}
          <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Laisser un avis</DialogTitle>
                <DialogDescription>Notez et commentez le prestateur</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Note</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewRating(n)} className="focus:outline-none">
                        <Star className={`h-8 w-8 transition-colors ${n <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Commentaire</Label>
                  <Textarea placeholder="Partagez votre expérience..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewForm(false)}>Annuler</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={submitReview} disabled={reviewLoading}>
                  {reviewLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Publier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Prestataire non trouvé</p>
        </div>
      )}

      {user?.role === 'CLIENT' && renderBottomNav('client-dashboard')}
    </div>
  )

  // ============================================================
  // PRESTATAIRE / ENTREPRISE DASHBOARD
  // ============================================================
  const [providerDashReviews, setProviderDashReviews] = useState<Review[]>([])
  const [providerDashAvg, setProviderDashAvg] = useState(0)
  const [providerDashCount, setProviderDashCount] = useState(0)

  const fetchProviderDashboardData = async () => {
    if (!token || !user) return
    try {
      // Fetch reviews
      const revRes = await fetch(`/api/reviews?targetId=${user.id}`)
      if (revRes.ok) {
        const revData = await revRes.json()
        const reviews = Array.isArray(revData) ? revData : revData.reviews || []
        setProviderDashReviews(reviews)
        if (reviews.length > 0) {
          const total = reviews.reduce((acc: number, r: Review) => acc + r.rating, 0)
          setProviderDashAvg(total / reviews.length)
        }
        setProviderDashCount(reviews.length)
      }
      // Fetch notifications
      fetchNotifications()
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (currentView === 'prestataire-dashboard' || currentView === 'entreprise-dashboard') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on view change
      void fetchProviderDashboardData()
    }
  }, [currentView])

  const renderProviderDashboard = () => {
    const isEntreprise = user?.role === 'ENTREPRISE'
    const profile = user?.profile
    const status = user?.status || 'pending'

    return (
      <div className="min-h-screen bg-gray-50 fade-in pb-20">
        {/* Header with cover */}
        {isEntreprise && profile?.coverPhoto ? (
          <div className="h-40 relative">
            <img src={profile.coverPhoto} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="bg-emerald-600 h-32" />
        )}

        <div className="max-w-lg mx-auto px-4 -mt-10 relative z-10">
          <Card className="shadow-lg border-emerald-100">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-20 w-20 flex-shrink-0 ring-4 ring-white shadow">
                  <AvatarImage src={isEntreprise ? profile?.logo : profile?.photo} />
                  <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg">
                    {getInitials(isEntreprise ? (profile?.companyName || 'E') : (profile?.fullName || 'P'))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">
                      {isEntreprise ? profile?.companyName : profile?.fullName}
                    </h1>
                    {getStatusBadge(status)}
                  </div>
                  <p className="text-emerald-600 font-medium text-sm">{profile?.sector}</p>
                </div>
              </div>

              {/* Status messages */}
              {status === 'pending' && (
                <Alert className="mb-4 border-amber-200 bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Compte en attente</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Votre compte est en cours de vérification. Cela peut prendre quelques minutes jusqu'à 24 heures.
                  </AlertDescription>
                </Alert>
              )}
              {status === 'rejected' && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Compte rejeté</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Votre compte n'a pas été approuvé. Contactez l'administration pour plus d'informations.
                  </AlertDescription>
                </Alert>
              )}
              {status === 'suspended' && (
                <Alert className="mb-4 border-gray-200 bg-gray-50">
                  <Ban className="h-4 w-4 text-gray-600" />
                  <AlertTitle className="text-gray-800">Compte suspendu</AlertTitle>
                  <AlertDescription className="text-gray-700">
                    Votre compte a été suspendu. Contactez l'administration.
                  </AlertDescription>
                </Alert>
              )}

              {/* Profile details */}
              <div className="space-y-3 text-sm">
                {profile?.services && profile.services.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.services.map(s => (
                      <Badge key={s} variant="secondary" className="bg-emerald-50 text-emerald-700">{s}</Badge>
                    ))}
                  </div>
                )}
                {profile?.description && (
                  <p className="text-gray-600 whitespace-pre-wrap">{profile.description}</p>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {profile?.nationalScope ? 'Toute la RDC' : `${profile?.province || ''}${profile?.commune ? `, ${profile.commune}` : ''}`}
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="h-4 w-4" /> {profile.phone}
                  </div>
                )}
                {isEntreprise && profile?.employeeCount && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="h-4 w-4" /> {profile.employeeCount} employé(s)
                  </div>
                )}
                {isEntreprise && profile?.website && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Globe className="h-4 w-4" /> {profile.website}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-1">{getStars(providerDashAvg)}</div>
                <span className="text-sm font-medium">{providerDashAvg.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({providerDashCount} avis)</span>
              </div>

              <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('profile-edit')}>
                <Edit className="h-4 w-4 mr-1" /> Modifier mon profil
              </Button>
            </CardContent>
          </Card>

          {/* Reviews */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Avis reçus</h2>
            {providerDashReviews.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {providerDashReviews.map(review => (
                  <Card key={review.id} className="border-emerald-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{review.authorName || 'Anonyme'}</span>
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">{getStars(review.rating)}</div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Aucun avis pour le moment</p>
            )}
          </div>

          {/* Recent notifications */}
          {notifications.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Notifications récentes</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {notifications.slice(0, 5).map(n => (
                  <Card key={n.id} className={`border ${n.read ? 'border-gray-100' : 'border-emerald-200 bg-emerald-50/30'}`}>
                    <CardContent className="p-3 flex gap-3 items-start">
                      {n.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" /> : <Info className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500">{n.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {renderBottomNav(isEntreprise ? 'entreprise-dashboard' : 'prestataire-dashboard')}
      </div>
    )
  }

  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================
  const [adminTab, setAdminTab] = useState('validation')
  const [adminRoleFilter, setAdminRoleFilter] = useState('')
  const [adminStatusFilter, setAdminStatusFilter] = useState('')
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspendUserId, setSuspendUserId] = useState('')
  const [suspendReason, setSuspendReason] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  // Announcement state
  const [annTitle, setAnnTitle] = useState('')
  const [annMessage, setAnnMessage] = useState('')
  const [annTargetType, setAnnTargetType] = useState('all')
  const [annTargetId, setAnnTargetId] = useState('')
  const [annLoading, setAnnLoading] = useState(false)

  // Reply state
  const [replyMessageId, setReplyMessageId] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const fetchAdminData = async () => {
    if (!token) return
    try {
      // Stats
      const statsRes = await fetch('/api/admin/dashboard', { headers: authHeaders() })
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setAdminStats(statsData)
      }
      // Users
      await fetchAdminUsers()
      // Announcements
      const annRes = await fetch('/api/admin/announcements', { headers: authHeaders() })
      if (annRes.ok) {
        const annData = await annRes.json()
        setAdminAnnouncements(Array.isArray(annData) ? annData : annData.announcements || [])
      }
      // Messages
      const msgRes = await fetch('/api/admin/messages', { headers: authHeaders() })
      if (msgRes.ok) {
        const msgData = await msgRes.json()
        setAdminMessages(Array.isArray(msgData) ? msgData : msgData.messages || [])
      }
    } catch { /* silent */ }
  }

  const fetchAdminUsers = async () => {
    if (!token) return
    try {
      const params = new URLSearchParams()
      if (adminRoleFilter) params.set('role', adminRoleFilter)
      if (adminStatusFilter) params.set('status', adminStatusFilter)
      const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setAdminUsers(Array.isArray(data) ? data : data.users || [])
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (currentView === 'admin-dashboard') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on view change
      void fetchAdminData()
    }
  }, [currentView])

  useEffect(() => {
    if (currentView === 'admin-dashboard' && adminTab === 'utilisateurs') {
      fetchAdminUsers()
    }
  }, [adminRoleFilter, adminStatusFilter, adminTab])

  const handleAdminAction = async (userId: string, action: string, reason?: string) => {
    setAdminLoading(true)
    try {
      const body: any = { userId, action }
      if (reason) body.reason = reason
      const res = await fetch('/api/admin/validate', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body)
      })
      if (res.ok) {
        toast({ title: 'Succès', description: `Action "${action}" effectuée avec succès.` })
        fetchAdminData()
      } else {
        const data = await res.json()
        toast({ title: 'Erreur', description: data.message || "Erreur lors de l'action.", variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' })
    }
    setAdminLoading(false)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return
    setAdminLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ userId })
      })
      if (res.ok) {
        toast({ title: 'Succès', description: 'Utilisateur supprimé.' })
        fetchAdminData()
      } else {
        toast({ title: 'Erreur', description: 'Erreur lors de la suppression.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' })
    }
    setAdminLoading(false)
  }

  const handleSendAnnouncement = async () => {
    if (!annTitle || !annMessage) {
      toast({ title: 'Erreur', description: 'Titre et message requis.', variant: 'destructive' })
      return
    }
    setAnnLoading(true)
    try {
      const body: any = { title: annTitle, message: annMessage, targetType: annTargetType }
      if (annTargetType === 'specific' && annTargetId) body.targetId = annTargetId
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body)
      })
      if (res.ok) {
        toast({ title: 'Annonce envoyée', description: "L'annonce a été envoyée avec succès." })
        setAnnTitle('')
        setAnnMessage('')
        setAnnTargetType('all')
        setAnnTargetId('')
        fetchAdminData()
      } else {
        toast({ title: 'Erreur', description: "Erreur lors de l'envoi.", variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' })
    }
    setAnnLoading(false)
  }

  const handleReplyMessage = async () => {
    if (!replyMessageId || !replyText) return
    setReplyLoading(true)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ messageId: replyMessageId, reply: replyText })
      })
      if (res.ok) {
        toast({ title: 'Réponse envoyée', description: 'Votre réponse a été envoyée.' })
        setReplyMessageId('')
        setReplyText('')
        fetchAdminData()
      } else {
        toast({ title: 'Erreur', description: 'Erreur.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' })
    }
    setReplyLoading(false)
  }

  const renderAdminDashboard = () => (
    <div className="min-h-screen bg-gray-50 fade-in pb-6">
      {/* Header */}
      <div className="bg-emerald-700 text-white px-4 pt-6 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <h1 className="text-xl font-bold">Administration</h1>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Déconnexion
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total utilisateurs', value: adminStats.totalUsers || 0, icon: <Users className="h-4 w-4" /> },
              { label: 'Clients', value: adminStats.clients || 0, icon: <User className="h-4 w-4" /> },
              { label: 'Prestataires', value: adminStats.prestataires || 0, icon: <Wrench className="h-4 w-4" /> },
              { label: 'Entreprises', value: adminStats.entreprises || 0, icon: <Building2 className="h-4 w-4" /> },
              { label: 'En attente', value: adminStats.pending || 0, icon: <Clock className="h-4 w-4" /> },
              { label: 'Suspendus', value: adminStats.suspended || 0, icon: <Ban className="h-4 w-4" /> },
              { label: 'Avis', value: adminStats.reviews || 0, icon: <Star className="h-4 w-4" /> },
              { label: 'Messages', value: adminStats.messages || 0, icon: <MessageSquare className="h-4 w-4" /> },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1 text-emerald-100">{stat.icon}<span className="text-xs">{stat.label}</span></div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <Tabs value={adminTab} onValueChange={setAdminTab}>
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
            <TabsTrigger value="annonces">Annonces</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* Validation tab */}
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle>Comptes en attente de validation</CardTitle>
                <CardDescription>Approuvez ou rejetez les nouvelles inscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {adminLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>}
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {adminUsers.filter(u => u.status === 'pending').map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-emerald-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.profile?.logo || u.profile?.photo} />
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs">{getInitials(u.profile?.fullName || u.profile?.companyName || 'U')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{u.profile?.companyName || u.profile?.fullName || u.phone}</p>
                          <p className="text-xs text-gray-500">{u.role} • {u.profile?.sector || ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleAdminAction(u.id, 'approve')}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAdminAction(u.id, 'reject')}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {adminUsers.filter(u => u.status === 'pending').length === 0 && (
                    <p className="text-center text-gray-400 py-8">Aucun compte en attente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="utilisateurs">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <CardDescription>Filtrez et gérez tous les comptes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Select value={adminRoleFilter} onValueChange={setAdminRoleFilter}>
                    <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Tous les rôles" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="CLIENT">Clients</SelectItem>
                      <SelectItem value="PRESTATAIRE">Prestataires</SelectItem>
                      <SelectItem value="ENTREPRISE">Entreprises</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
                    <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="approved">Approuvés</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="rejected">Rejetés</SelectItem>
                      <SelectItem value="suspended">Suspendus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {adminUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs">{getInitials(u.profile?.fullName || u.profile?.companyName || 'U')}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{u.profile?.companyName || u.profile?.fullName || u.phone}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{u.role}</span>
                            {getStatusBadge(u.status)}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {u.status === 'suspended' && (
                            <DropdownMenuItem onClick={() => handleAdminAction(u.id, 'activate')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Activer
                            </DropdownMenuItem>
                          )}
                          {u.status !== 'suspended' && u.status !== 'pending' && (
                            <DropdownMenuItem onClick={() => { setSuspendUserId(u.id); setSuspendDialogOpen(true) }}>
                              <Ban className="h-4 w-4 mr-2 text-amber-600" /> Suspendre
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  {adminUsers.length === 0 && <p className="text-center text-gray-400 py-8">Aucun utilisateur trouvé</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements tab */}
          <TabsContent value="annonces">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nouvelle annonce</CardTitle>
                  <CardDescription>Envoyez une annonce aux utilisateurs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input placeholder="Titre de l'annonce" value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea placeholder="Contenu de l'annonce..." value={annMessage} onChange={e => setAnnMessage(e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Destinataires</Label>
                    <Select value={annTargetType} onValueChange={setAnnTargetType}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les utilisateurs</SelectItem>
                        <SelectItem value="prestataires">Tous les prestataires</SelectItem>
                        <SelectItem value="entreprises">Toutes les entreprises</SelectItem>
                        <SelectItem value="clients">Tous les clients</SelectItem>
                        <SelectItem value="both">Prestataires + Entreprises</SelectItem>
                        <SelectItem value="specific">Utilisateur spécifique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {annTargetType === 'specific' && (
                    <div className="space-y-2">
                      <Label>ID utilisateur</Label>
                      <Input placeholder="ID de l'utilisateur" value={annTargetId} onChange={e => setAnnTargetId(e.target.value)} />
                    </div>
                  )}
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSendAnnouncement} disabled={annLoading}>
                    {annLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    Envoyer
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historique des annonces</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                    {adminAnnouncements.map(a => (
                      <div key={a.id} className="p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{a.title}</h4>
                          <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{a.message}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">{a.targetType}</Badge>
                      </div>
                    ))}
                    {adminAnnouncements.length === 0 && <p className="text-center text-gray-400 py-4">Aucune annonce envoyée</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messages tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages de contact</CardTitle>
                <CardDescription>Messages reçus via le formulaire de contact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {adminMessages.map((msg: any) => (
                    <div key={msg.id} className="p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h4 className="font-medium text-sm">{msg.name}</h4>
                          <p className="text-xs text-gray-500">{msg.email} • {formatDate(msg.createdAt)}</p>
                        </div>
                        {msg.replied ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Répondu</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">Non répondu</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                      {msg.reply && (
                        <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-100">
                          <p className="text-xs font-medium text-emerald-700 mb-1">Réponse :</p>
                          <p className="text-sm text-emerald-600">{msg.reply}</p>
                        </div>
                      )}
                      {!msg.reply && (
                        <div className="flex gap-2 mt-2">
                          <Input placeholder="Votre réponse..." value={replyMessageId === msg.id ? replyText : ''} onChange={e => { setReplyMessageId(msg.id); setReplyText(e.target.value) }} className="flex-1 text-sm" />
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setReplyMessageId(msg.id); handleReplyMessage() }} disabled={replyLoading || !replyText}>
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {adminMessages.length === 0 && <p className="text-center text-gray-400 py-8">Aucun message</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Suspend dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre l'utilisateur</DialogTitle>
            <DialogDescription>Indiquez la raison de la suspension. L'utilisateur sera notifié.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Raison de la suspension</Label>
              <Textarea placeholder="Expliquez pourquoi vous suspendez ce compte..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>Annuler</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { handleAdminAction(suspendUserId, 'suspend', suspendReason); setSuspendDialogOpen(false); setSuspendReason('') }}>
              Suspendre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  // ============================================================
  // NOTIFICATIONS VIEW
  // ============================================================
  const renderNotifications = () => (
    <div className="min-h-screen bg-gray-50 fade-in pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 ml-auto">{unreadCount} non lue(s)</Badge>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <Button variant="outline" size="sm" className="mb-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => markNotificationRead()}>
          <Check className="h-3 w-3 mr-1" /> Tout marquer comme lu
        </Button>

        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card key={n.id} className={`cursor-pointer transition-all ${n.read ? 'border-gray-100' : 'border-emerald-200 bg-emerald-50/40 shadow-sm'}`} onClick={() => markNotificationRead(n.id)}>
                <CardContent className="p-4 flex gap-3 items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.read ? 'bg-gray-100' : 'bg-emerald-100'}`}>
                    {n.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <Info className="h-4 w-4 text-emerald-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm ${n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>{n.title}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucune notification</p>
          </div>
        )}
      </div>

      {renderBottomNav(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))}
    </div>
  )

  // ============================================================
  // SETTINGS VIEW
  // ============================================================
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [showChangePass, setShowChangePass] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [changePassLoading, setChangePassLoading] = useState(false)

  useEffect(() => {
    if (currentView === 'settings') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on view change
      void fetchNotifications()
      void fetchContactMessages()
    }
  }, [currentView])

  const handleContact = async () => {
    if (!contactName || !contactEmail || !contactMessage) {
      toast({ title: 'Erreur', description: 'Remplissez tous les champs.', variant: 'destructive' })
      return
    }
    setContactLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMessage })
      })
      if (res.ok) {
        toast({ title: 'Message envoyé', description: 'Nous vous répondrons dans les plus brefs délais.' })
        setContactName('')
        setContactEmail('')
        setContactMessage('')
        fetchContactMessages()
      } else {
        toast({ title: 'Erreur', description: "Erreur lors de l'envoi.", variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' })
    }
    setContactLoading(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Erreur', description: 'Mot de passe trop court (min 6 caractères).', variant: 'destructive' })
      return
    }
    setChangePassLoading(true)
    try {
      const res = await fetch('/api/auth/me/profile', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ newPassword })
      })
      if (res.ok) {
        toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été changé avec succès.' })
        setShowChangePass(false)
        setNewPassword('')
      } else {
        toast({ title: 'Erreur', description: 'Erreur lors du changement.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' })
    }
    setChangePassLoading(false)
  }

  const renderSettings = () => (
    <div className="min-h-screen bg-gray-50 fade-in pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">Paramètres</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Profile card */}
        <Card className="border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profile?.logo || user?.profile?.photo} />
                <AvatarFallback className="bg-emerald-50 text-emerald-700">
                  {getInitials(user?.profile?.fullName || user?.profile?.companyName || user?.phone || 'U')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">{user?.profile?.fullName || user?.profile?.companyName || 'Utilisateur'}</h2>
                <p className="text-sm text-gray-500">{user?.phone}</p>
                <Badge className="mt-1 bg-emerald-100 text-emerald-700 border-emerald-200">{user?.role}</Badge>
              </div>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('profile-edit')}>
              <Edit className="h-4 w-4 mr-1" /> Modifier mon profil
            </Button>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Changer le mot de passe</h3>
            {!showChangePass ? (
              <Button variant="outline" className="w-full text-emerald-600 border-emerald-200" onClick={() => setShowChangePass(true)}>
                <Key className="h-4 w-4 mr-1" /> Changer le mot de passe
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleChangePassword} disabled={changePassLoading}>
                    {changePassLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={() => { setShowChangePass(false); setNewPassword('') }}>Annuler</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact form */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" /> Nous contacter
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input placeholder="Votre nom" value={contactName} onChange={e => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="Votre email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea placeholder="Votre message..." value={contactMessage} onChange={e => setContactMessage(e.target.value)} rows={4} />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleContact} disabled={contactLoading}>
                {contactLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Envoyer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My messages */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" /> Mes messages
            </h3>
            {contactMessages.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {contactMessages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-600">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(msg.createdAt)}</p>
                    {msg.reply && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-100">
                        <p className="text-xs font-medium text-emerald-700">Réponse de VServiceRDC :</p>
                        <p className="text-sm text-emerald-600">{msg.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Aucun message envoyé</p>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={logout}>
          <LogOut className="h-4 w-4 mr-1" /> Se déconnecter
        </Button>
      </div>

      {renderBottomNav(user?.role === 'CLIENT' ? 'client-dashboard' : (user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard'))}
    </div>
  )

  // ============================================================
  // PROFILE EDIT VIEW
  // ============================================================
  const [editLoading, setEditLoading] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSector, setEditSector] = useState('')
  const [editServices, setEditServices] = useState<string[]>([])
  const [editProvince, setEditProvince] = useState('')
  const [editCommune, setEditCommune] = useState('')
  const [editNationalScope, setEditNationalScope] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editSocialFB, setEditSocialFB] = useState('')
  const [editSocialIG, setEditSocialIG] = useState('')
  const [editSocialTW, setEditSocialTW] = useState('')
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState('')
  const [editCompanyName, setEditCompanyName] = useState('')
  const [editCompanyType, setEditCompanyType] = useState('')
  const [editEmployeeCount, setEditEmployeeCount] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editFullAddress, setEditFullAddress] = useState('')

  useEffect(() => {
    if (currentView === 'profile-edit' && user?.profile) {
      const p = user.profile
      // eslint-disable-next-line react-hooks/set-state-in-effect -- form initialization from data
      setEditName(p.fullName || '')
      setEditEmail(user.email || '')
      setEditSector(p.sector || '')
      setEditServices(p.services || [])
      setEditProvince(p.province || '')
      setEditCommune(p.commune || '')
      setEditNationalScope(p.nationalScope || false)
      setEditDescription(p.description || '')
      setEditSocialFB(p.socialMedia?.facebook || '')
      setEditSocialIG(p.socialMedia?.instagram || '')
      setEditSocialTW(p.socialMedia?.twitter || '')
      setEditCompanyName(p.companyName || '')
      setEditCompanyType(p.companyType || '')
      setEditEmployeeCount(p.employeeCount?.toString() || '')
      setEditWebsite(p.website || '')
      setEditFullAddress(p.fullAddress || '')
      setEditPhotoPreview(p.photo || p.logo || '')
    }
  }, [currentView, user])

  const handleSaveProfile = async () => {
    if (!token || !user) return
    setEditLoading(true)
    try {
      const profile: any = {}
      if (user.role === 'CLIENT') {
        profile.fullName = editName
        profile.email = editEmail
      } else if (user.role === 'PRESTATAIRE') {
        profile.fullName = editName
        profile.email = editEmail
        profile.sector = editSector
        profile.services = editServices
        profile.province = editProvince
        profile.commune = editCommune
        profile.nationalScope = editNationalScope
        profile.description = editDescription
        const social: any = {}
        if (editSocialFB) social.facebook = editSocialFB
        if (editSocialIG) social.instagram = editSocialIG
        if (editSocialTW) social.twitter = editSocialTW
        profile.socialMedia = social
      } else if (user.role === 'ENTREPRISE') {
        profile.companyName = editCompanyName
        profile.email = editEmail
        profile.sector = editSector
        profile.services = editServices
        profile.companyType = editCompanyType
        profile.employeeCount = editEmployeeCount ? parseInt(editEmployeeCount) : undefined
        profile.website = editWebsite
        profile.fullAddress = editFullAddress
        profile.province = editProvince
        profile.commune = editCommune
        profile.nationalScope = editNationalScope
        const social: any = {}
        if (editSocialFB) social.facebook = editSocialFB
        if (editSocialIG) social.instagram = editSocialIG
        if (editSocialTW) social.twitter = editSocialTW
        profile.socialMedia = social
      }

      const res = await fetch('/api/auth/me/profile', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(profile)
      })

      if (res.ok) {
        // Upload new photo if selected
        if (editPhoto) {
          const fd = new FormData()
          fd.append('file', editPhoto)
          if (user.role === 'ENTREPRISE') fd.append('type', 'company-logo')
          else fd.append('type', 'provider-photo')
          await fetch('/api/upload', { method: 'POST', headers: multiPartHeaders(), body: fd })
        }

        toast({ title: 'Profil mis à jour', description: 'Vos modifications ont été enregistrées.' })
        // Refresh user
        const meRes = await fetch('/api/auth/me', { headers: authHeaders() })
        if (meRes.ok) {
          const meData = await meRes.json()
          const refreshedUser: UserProfile = {
            id: meData.id,
            phone: meData.phone,
            email: meData.email,
            role: meData.role,
            status: meData.status,
            profile: meData.profile || undefined,
          }
          setUser(refreshedUser)
        }
        navigate(user.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard')
      } else {
        const data = await res.json()
        toast({ title: 'Erreur', description: data.message || 'Erreur lors de la mise à jour.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur serveur.', variant: 'destructive' })
    }
    setEditLoading(false)
  }

  const renderProfileEdit = () => (
    <div className="min-h-screen bg-gray-50 fade-in pb-6">
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">Modifier le profil</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <ScrollArea className="max-h-[calc(100vh-140px)]">
          <Card className="border-emerald-100">
            <CardContent className="pt-6 space-y-4">
              {/* Photo upload */}
              <div className="space-y-2">
                <Label>{user?.role === 'ENTREPRISE' ? 'Logo' : 'Photo de profil'}</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={editPhotoPreview} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg">
                      {getInitials(editName || editCompanyName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setEditPhoto(f); setEditPhotoPreview(URL.createObjectURL(f)) } }} />
                    <Button variant="outline" size="sm" asChild>
                      <span><Camera className="h-3 w-3 mr-1" /> Changer</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Name / Company */}
              {user?.role === 'ENTREPRISE' ? (
                <div className="space-y-2">
                  <Label>Nom de l'entreprise</Label>
                  <Input value={editCompanyName} onChange={e => setEditCompanyName(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
              </div>

              {user?.role !== 'CLIENT' && (
                <>
                  <Separator />

                  {/* Sector & Services */}
                  <div className="space-y-2">
                    <Label>Secteur</Label>
                    <Select value={editSector} onValueChange={v => { setEditSector(v); setEditServices([]) }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Secteur" /></SelectTrigger>
                      <SelectContent>
                        {getAllSectorNames().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {editSector && (
                    <div className="space-y-2">
                      <Label>Services</Label>
                      {user?.role === 'ENTREPRISE' ? (
                        <div className="grid grid-cols-1 gap-2">
                          {getServicesBySector(editSector).map(s => (
                            <div key={s} className="flex items-center space-x-2">
                              <Checkbox id={`edit-svc-${s}`} checked={editServices.includes(s)} onCheckedChange={() => setEditServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} />
                              <Label htmlFor={`edit-svc-${s}`} className="text-sm font-normal cursor-pointer">{s}</Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Select value={editServices[0] || ''} onValueChange={v => setEditServices([v])}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Service" /></SelectTrigger>
                          <SelectContent>
                            {getServicesBySector(editSector).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {user?.role === 'ENTREPRISE' && (
                    <>
                      <div className="space-y-2">
                        <Label>Type d'entreprise</Label>
                        <Select value={editCompanyType} onValueChange={setEditCompanyType}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individuelle">Individuelle</SelectItem>
                            <SelectItem value="avec_employes">Avec employés</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nombre d'employés</Label>
                        <Input type="number" value={editEmployeeCount} onChange={e => setEditEmployeeCount(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Site web</Label>
                        <Input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Adresse complète</Label>
                        <Input value={editFullAddress} onChange={e => setEditFullAddress(e.target.value)} />
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Zone */}
                  <div className="flex items-center space-x-2">
                    <Checkbox id="edit-national" checked={editNationalScope} onCheckedChange={(v) => setEditNationalScope(v === true)} />
                    <Label htmlFor="edit-national" className="text-sm cursor-pointer">Portée nationale</Label>
                  </div>

                  {!editNationalScope && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Province</Label>
                        <Select value={editProvince} onValueChange={v => { setEditProvince(v); setEditCommune('') }}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Province" /></SelectTrigger>
                          <SelectContent>
                            {getAllProvinceNames().map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Commune</Label>
                        <Select value={editCommune} onValueChange={setEditCommune} disabled={!editProvince}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Commune" /></SelectTrigger>
                          <SelectContent>
                            {editProvince && getCommunes(editProvince).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4} />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Réseaux sociaux</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                        <Input placeholder="Facebook" value={editSocialFB} onChange={e => setEditSocialFB(e.target.value)} className="pl-10" />
                      </div>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500" />
                        <Input placeholder="Instagram" value={editSocialIG} onChange={e => setEditSocialIG(e.target.value)} className="pl-10" />
                      </div>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                        <Input placeholder="Twitter / X" value={editSocialTW} onChange={e => setEditSocialTW(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveProfile} disabled={editLoading}>
                  {editLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => navigate(user?.role === 'PRESTATAIRE' ? 'prestataire-dashboard' : 'entreprise-dashboard')}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollArea>
      </div>
    </div>
  )

  // ============================================================
  // BOTTOM NAVIGATION
  // ============================================================
  const renderBottomNav = (activeTab: string) => {
    const items = [
      { id: 'home', view: 'client-dashboard' as ViewName, icon: <Home className="h-5 w-5" />, label: 'Accueil' },
      { id: 'search', view: 'client-dashboard' as ViewName, icon: <Search className="h-5 w-5" />, label: 'Rechercher' },
      { id: 'notifications', view: 'notifications' as ViewName, icon: <Bell className="h-5 w-5" />, label: 'Notifications' },
      { id: 'profile', view: 'settings' as ViewName, icon: <User className="h-5 w-5" />, label: 'Profil' },
    ]

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.view)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                (activeTab === item.view || (item.id === 'search' && activeTab === 'client-dashboard') || (item.id === 'home' && activeTab === 'client-dashboard'))
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    )
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  if (currentView === 'landing') return renderLanding()
  if (currentView === 'login') return renderLogin()
  if (currentView === 'register') return renderRegister()
  if (currentView === 'client-dashboard') return renderClientDashboard()
  if (currentView === 'provider-detail') return renderProviderDetail()
  if (currentView === 'prestataire-dashboard') return renderProviderDashboard()
  if (currentView === 'entreprise-dashboard') return renderProviderDashboard()
  if (currentView === 'admin-dashboard') return renderAdminDashboard()
  if (currentView === 'notifications') return renderNotifications()
  if (currentView === 'settings') return renderSettings()
  if (currentView === 'profile-edit') return renderProfileEdit()

  return renderLanding()
}
