'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MapPin, Phone, Star, ShieldCheck, MessageSquare, ChevronLeft, Globe, Users, Building2, Image } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

function getInitials(n: string) { return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }
function formatPhone(v: string) { let cl = v.replace(/\D/g, ''); if (!cl.startsWith('243')) cl = '243' + cl.replace(/^0+/, ''); return '+243 ' + cl.slice(3).replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3').trim() }
function getStars(rating: number) { return Array.from({ length: 5 }, (_, i) => <Star key={i} className={'h-4 w-4 ' + (i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />) }
function formatDate(ds: string) { try { return new Date(ds).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return ds } }

export default function PublicCompanyPage() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [realisations, setRealisations] = useState<any[]>([])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetch('/api/public/' + slug).then(r => r.json()).then(d => {
      setData(d)
      if (d.id) {
        fetch('/api/reviews?targetId=' + d.id).then(r => r.json()).then(rd => {
          const revs = Array.isArray(rd) ? rd : rd.reviews || []
          setReviews(revs)
          if (revs.length > 0) setAvgRating(revs.reduce((a: number, r: any) => a + r.rating, 0) / revs.length)
          setReviewCount(revs.length)
        }).catch(() => {})
        fetch('/api/realisations?userId=' + d.id).then(r => r.json()).then(rd => setRealisations(rd.realisations || [])).catch(() => {})
      }
    }).catch(() => setData(null)).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" /><p className="text-emerald-600 text-sm">Chargement...</p></div></div>
  if (!data) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center p-8"><p className="text-gray-500">Profil non trouvé</p><a href="/" className="text-emerald-600 text-sm underline mt-2 inline-block">Retour à l'accueil</a></div></div>

  const p = data.profile
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-8">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 mb-4"><ChevronLeft className="h-4 w-4" />Retour</a>
        <Card className="shadow-lg overflow-hidden">
          {p?.coverPhoto && <div className="h-36 bg-gray-200"><img src={p.coverPhoto} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" style={{ height: 144, marginTop: 0 }} /></div>}
          <CardContent className={'pt-6 pb-6 ' + (p?.coverPhoto ? '-mt-12 relative z-10' : '')}>
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-20 w-20 flex-shrink-0 ring-4 ring-white shadow rounded-lg"><AvatarImage src={p?.logo} /><AvatarFallback className="bg-amber-50 text-amber-700 text-lg rounded-lg"><Building2 className="h-8 w-8" /></AvatarFallback></Avatar>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{p?.companyName}</h1>
                <p className="text-amber-600 font-medium text-sm">{p?.sector}</p>
                {data.certified && <Badge className="bg-amber-500 text-white text-[10px] mt-1"><ShieldCheck className="h-3 w-3 mr-0.5" />Certifié</Badge>}
                {p?.services && p.services.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{p.services.map((s: string) => <Badge key={s} variant="secondary" className="text-xs bg-amber-50 text-amber-700">{s}</Badge>)}</div>}
              </div>
            </div>
            {p?.description && <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap">{p.description}</p>}
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-amber-500" /><a href={'tel:' + data.phone} className="hover:underline">{formatPhone(data.phone)}</a></div>
              <div className="flex items-center gap-2 text-gray-600"><MapPin className="h-4 w-4 text-amber-500" />{p?.nationalScope ? 'RDC' : [p?.province, p?.commune].filter(Boolean).join(', ')}</div>
              {p?.website && <div className="flex items-center gap-2 text-gray-600"><Globe className="h-4 w-4 text-amber-500" /><a href={p.website.startsWith('http') ? p.website : 'https://' + p.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.website}</a></div>}
              {p?.employeeCount && <div className="flex items-center gap-2 text-gray-600"><Users className="h-4 w-4 text-amber-500" />{p.employeeCount} employé(s)</div>}
              {p?.manager && <div className="flex items-center gap-2 text-gray-600"><span className="text-amber-500 font-medium">Responsable:</span> {p.manager.fullName} ({p.manager.function})</div>}
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-3 mb-4"><div className="flex items-center gap-1">{getStars(avgRating)}</div><span className="text-sm font-medium text-gray-900">{avgRating.toFixed(1)}</span><span className="text-sm text-gray-500">({reviewCount} avis)</span></div>
            <a href={'tel:' + data.phone} className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium mb-2"><Phone className="h-4 w-4" />Appeler maintenant</a>
            <a href={'/'} className="w-full inline-flex items-center justify-center gap-2 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg px-4 py-2.5 text-sm font-medium"><MessageSquare className="h-4 w-4" />Créer un compte pour contacter</a>
            {realisations.length > 0 && <div className="mt-6"><h3 className="font-semibold text-gray-900 mb-3">Réalisations ({realisations.length})</h3><div className="grid grid-cols-2 gap-2">{realisations.filter(r => !r.hidden).map(r => <Card key={r.id} className="overflow-hidden"><div className="h-28 bg-gray-100">{r.afterPhoto ? <img src={r.afterPhoto} alt={r.title} className="w-full h-full object-cover" /> : r.media?.[0] ? <img src={r.media[0]} alt={r.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><Image className="h-8 w-8" /></div>}</div><CardContent className="p-2"><p className="font-medium text-xs truncate">{r.title}</p><p className="text-[10px] text-gray-400">{r.location || formatDate(r.createdAt)}</p></CardContent></Card>)}</div></div>}
            {reviews.length > 0 && <div className="mt-6"><h3 className="font-semibold text-gray-900 mb-3">Avis ({reviews.length})</h3><div className="space-y-3 max-h-80 overflow-y-auto">{reviews.map((r: any) => <Card key={r.id}><CardContent className="p-3"><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-gray-900">{r.authorName || 'Anonyme'}</span></div><div className="flex items-center gap-1 mb-1">{getStars(r.rating)}</div><p className="text-sm text-gray-600">{r.comment}</p></CardContent></Card>)}</div></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
