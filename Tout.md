1. Le nouveau positionnement

VServiceRDC ne doit plus être seulement un annuaire.

VServiceRDC devient :

La marketplace intelligente de services en RDC qui permet de trouver, comparer, engager, payer et sécuriser des prestations entre clients, professionnels et entreprises.

Le parcours central devient :

Rechercher → Comparer → Demander → Devis → Engager → Escrow → Réaliser → Valider → Libérer le paiement → Évaluer

C'est cette boucle qui rend le produit intéressant.

2. Les 4 utilisateurs principaux
👤 Client

Il cherche un professionnel ou une entreprise.

Il peut :

rechercher ;
filtrer ;
géolocaliser ;
comparer ;
demander un service ;
demander plusieurs devis ;
discuter ;
réserver ;
payer ;
utiliser l'escrow ;
suivre une prestation ;
confirmer la réalisation ;
laisser un avis ;
signaler un problème ;
utiliser l'IA.
Le client reste GRATUIT.

C'est stratégique.

Tu veux le maximum de clients sur la plateforme.

3. Prestataire

Le prestataire vend ses compétences.

Gratuit

Profil de base :

nom ;
photo ;
secteur ;
services ;
localisation ;
quelques réalisations ;
avis ;
contact.

Mais les fonctions avancées sont payantes.

Prestataire Pro

10 000 FC/mois

portfolio avancé ;
réalisations illimitées ;
statistiques ;
demandes de devis ;
calendrier ;
disponibilité ;
IA ;
génération de devis ;
priorité dans certaines recherches ;
badge Pro ;
réponse automatique.
Prestataire Premium

20 000 FC/mois

Tout Pro +

visibilité renforcée ;
recommandations IA prioritaires ;
campagnes promotionnelles ;
statistiques avancées ;
assistant commercial ;
génération de propositions ;
analyse des clients ;
support prioritaire.
4. Entreprise

Pour les entreprises, tu peux conserver le modèle hebdomadaire.

Entreprise Basic

5 000 FC/semaine

≈ 20 000 FC/mois.

Entreprise Pro

10 000 FC/semaine

≈ 40 000 FC/mois.

Entreprise Business

25 000 FC/semaine

≈ 100 000 FC/mois.

Les entreprises payent pour :

visibilité ;
équipe ;
plusieurs services ;
plusieurs agences ;
statistiques ;
publicité ;
leads ;
IA ;
gestion commerciale ;
documents ;
certifications ;
positionnement prioritaire.
5. Mais l'abonnement ne doit PAS être ton seul revenu

Il faut construire 5 sources de revenus.

Source 1 — Abonnements

Prestataires :

10 000 → 20 000 FC/mois

Entreprises :

5 000 → 25 000 FC/semaine

Source 2 — Mise en avant

Un professionnel peut payer :

1 000 FC / jour

5 000 FC / semaine

15 000 FC / mois

pour être davantage visible.

Source 3 — Publicité

Une entreprise peut acheter une campagne ciblée :

Kinshasa → Gombe → Technologie

ou

Lubumbashi → BTP → Entreprises

Tu factures selon :

durée ;
audience ;
zone ;
secteur ;
positionnement.
6. Source 4 — Commission marketplace

C'est ici que l'escrow devient extrêmement intéressant.

Imaginons :

Client :

« Je veux faire installer une caméra de surveillance. »

Prestataire :

300 000 FC.

Client accepte.

Paiement

Client → GenuisPay

L'argent est encaissé.

Mais il n'est pas immédiatement considéré comme payé au prestataire.

Il devient :

🔒 Fonds sous escrow VServiceRDC

Le prestataire réalise le travail.

Client :

« Travail terminé. »

Il confirme.

Ensuite :

Escrow → Prestataire

VServiceRDC peut prendre par exemple :

5 % de commission marketplace.

Sur 300 000 FC :

15 000 FC → VServiceRDC
285 000 FC → prestataire

Les pourcentages exacts doivent ensuite être ajustés selon les coûts réels, les contraintes de GenuisPay et le cadre juridique applicable.

7. Pourquoi l'escrow est le cœur du système

Sans escrow :

Client → Prestataire

Le client prend le risque de payer directement.

Avec VServiceRDC :

Client

↓

GenuisPay

↓

VServiceRDC / Escrow

↓

Prestation

↓

Validation client

↓

Libération

↓

Prestataire

Ça donne à VServiceRDC une vraie valeur.

Tu ne vends plus seulement de la visibilité.

Tu vends :

confiance + mise en relation + sécurisation de la transaction.

8. Le système d'escrow doit être un vrai module

Ne fais pas juste un champ paymentStatus.

Il faut un véritable cycle d'état.

États
DRAFT
↓
QUOTE_SENT
↓
ACCEPTED
↓
PAYMENT_PENDING
↓
FUNDS_RECEIVED
↓
ESCROWED
↓
IN_PROGRESS
↓
DELIVERED
↓
CLIENT_REVIEW
↓
RELEASED
↓
COMPLETED

Et en cas de problème :

DISPUTED
↓
ADMIN_REVIEW
↓
RESOLVED
↓
RELEASED / REFUNDED / PARTIAL_RELEASE
9. Escrow partiel

Très important pour les gros projets.

Exemple :

Projet :

2 000 000 FC

Paiement :

30 % au démarrage
40 % après première étape
30 % à la livraison.

Donc :

2 000 000 FC
       ↓
┌──────┼──────┐
30%    40%    30%
 ↓      ↓      ↓
Étape1 Étape2 Livraison

VServiceRDC peut gérer chaque milestone.

C'est beaucoup plus professionnel.

10. Exemple réel

Client :

« Je veux construire un site web. »

Prestataire :

Prix : 500 000 FC

Le devis contient :

conception : 100 000 FC
développement : 250 000 FC
tests : 100 000 FC
mise en production : 50 000 FC

Client accepte.

Étape 1

Client verse 150 000 FC.

GenuisPay confirme.

VServiceRDC met les fonds en escrow.

Prestataire commence.

Étape 2

Client valide.

Le deuxième montant est débloqué.

Livraison

Client valide.

Dernier montant libéré.

VServiceRDC prélève automatiquement sa commission.

11. GenuisPay : rôle strict

Je garderais une architecture très propre.

GenuisPay fait :
initiation du paiement ;
encaissement ;
confirmation ;
webhook ;
référence transaction ;
statut du paiement ;
éventuellement remboursement si l'API le permet ;
éventuellement transfert/payout si son offre le permet.
VServiceRDC fait :
gestion du contrat ;
gestion du devis ;
gestion de l'escrow ;
gestion des milestones ;
gestion des commissions ;
gestion des litiges ;
gestion des validations ;
gestion de l'état de la prestation ;
historique ;
notifications.

Ne mets pas la logique métier de VServiceRDC dans GenuisPay.

12. Modèle de données à ajouter

Ton Prisma actuel doit évoluer.

Ajoute notamment :

ServiceRequest

Demande du client.

Quote

Devis du prestataire.

Contract

Accord entre client et prestataire.

Payment

Transaction GenuisPay.

EscrowTransaction

Fonds bloqués.

Milestone

Étape de projet.

EscrowRelease

Libération de fonds.

Refund

Remboursement.

Dispute

Litige.

Commission

Commission VServiceRDC.

Subscription

Abonnement.

SubscriptionPayment

Paiement d'abonnement.

Advertisement

Campagne publicitaire.

Promotion

Mise en avant.

Invoice

Facture.

13. Architecture financière
                         CLIENT
                           │
                           │ Paiement
                           ▼
                      GENUISPAY
                           │
                           │ confirmation
                           ▼
                     VSERVICERDC
                           │
                    ┌──────┴──────┐
                    │             │
                  ESCROW       COMMISSION
                    │             │
                    │          VService
                    │
              Prestation
                    │
                    ▼
               VALIDATION
                    │
                    ▼
              LIBÉRATION
                    │
                    ▼
               PRESTATAIRE
14. L'IA doit devenir le moteur de VServiceRDC

Il faut trois IA différentes.

🤖 VService AI

Pour les clients.

Exemple :

« Je dois réparer mon climatiseur à Ngaliema. »

L'IA :

comprend ;
détecte le service ;
détecte la localisation ;
cherche dans VService ;
compare ;
recommande ;
explique pourquoi.
15. IA Recherche Internet

Deuxième mode :

🔎 Recherche Web

L'utilisateur demande une information générale.

L'IA peut effectuer des recherches externes et présenter :

sources ;
dates ;
résultats ;
résumé.

Il faut afficher clairement :

Résultats VServiceRDC

versus

Résultats Internet

16. IA Prestataire

Le prestataire obtient :

rédaction de profil ;
création de devis ;
propositions commerciales ;
réponses clients ;
publications ;
analyse des avis ;
analyse des statistiques ;
conseils commerciaux ;
génération de CV/portfolio.
17. IA Entreprise

L'entreprise obtient :

génération de propositions ;
rédaction d'offres ;
analyse des leads ;
rapports ;
publications ;
campagnes ;
réponses clients ;
analyse des performances ;
génération de documents.
18. Le système de recherche doit être intelligent

Recherche classique :

« Plombier »

Recherche intelligente :

« J'ai une fuite d'eau dans ma maison à Bandal, je cherche quelqu'un disponible aujourd'hui. »

L'IA extrait :

Service : Plomberie
Problème : fuite d'eau
Localisation : Bandal
Urgence : élevée
Disponibilité : aujourd'hui

Puis elle cherche les meilleurs profils.

C'est ça qui donne une vraie utilité à l'IA.

19. Marketplace de demandes

Ajoute une section :

📋 Demandes disponibles

Un prestataire voit :

Installation électrique

📍 Kinshasa — Limete
💰 Budget : 200 000–300 000 FC
📅 Cette semaine
🔥 Urgent

Bouton :

Proposer mes services

Il envoie son offre.

Le client compare les offres.

20. Système de réputation

Score global :

VService Score

Calculé à partir de :

avis ;
nombre de missions ;
taux de réussite ;
temps de réponse ;
annulations ;
litiges ;
certifications ;
ancienneté ;
activité.

Exemple :

VService Score : 94/100

C'est beaucoup plus intelligent qu'une simple note 4,7/5.

21. Fonctionnalités RDC à intégrer

Je mettrais en priorité :

🇨🇩 Géographie RDC
26 provinces ;
villes ;
communes ;
territoires ;
zones disponibles.
📱 Téléphone +243

Avec WhatsApp.

🌐 Langues
Français ;
Lingála ;
English ;
Swahili ensuite.
📶 Faible connexion

Optimisation PWA.

📍 Localisation

Prestataires proches.

🚨 Urgence

Recherche de professionnels disponibles rapidement.

📸 Preuves

Photos avant/après.

🎥 Vidéos

Démonstration du travail.

🧾 Devis

Standardisés.

📄 Factures

Générées automatiquement.

🔒 Escrow

Protection transactionnelle.

22. Administration financière

L'admin doit avoir un véritable :

💰 Financial Center

Avec :

Aujourd'hui
chiffre d'affaires ;
commissions ;
abonnements ;
publicité ;
promotions ;
transactions ;
paiements échoués ;
remboursements ;
fonds en escrow ;
fonds libérés.
Graphiques
jour ;
semaine ;
mois ;
année.
Par province
Kinshasa
Haut-Katanga
Nord-Kivu
Sud-Kivu
Kongo-Central
...
Par secteur
BTP
Technologie
Transport
Santé
Éducation
Commerce
...
23. Dashboard financier du prestataire

Il voit :

Revenus

Missions

Paiements en attente

Escrow

Paiements libérés

Commissions

Abonnement

Historique

24. Dashboard financier entreprise

Même chose mais avec :

équipe ;
agences ;
projets ;
dépenses ;
revenus ;
campagnes ;
leads ;
abonnements. enuisPay ne constitue pas un portefeuille ou un produit indépendant dans VServiceRDC. Il sert de passerelle/infrastructure de paiement permettant aux utilisateurs de régler les abonnements, publicités, promotions et, lorsque le flux est activé, les transactions sécurisées par escrow. Les moyens de paiement disponibles dépendent de GenuisPay : Mobile Money et autres moyens pris en charge, sans imposer le paiement par carte bancaire.

Pour l'escrow, le document devra aussi distinguer paiement reçu, fonds sous séquestre/escrow, prestation en cours, validation, libération, remboursement et litige. Il ne faut surtout pas mélanger ces états.  fait ça tout 