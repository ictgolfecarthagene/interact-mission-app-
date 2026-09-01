'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// DICTIONNAIRE: Traduit vos pays français en noms standards de la carte (Anglais)
const FR_TO_EN_MAP = {
  'Tunisie': 'Tunisia', 'Algérie': 'Algeria', 'Maroc': 'Morocco', 'Sénégal': 'Senegal',
  'Côte d\'Ivoire': 'Côte d\'Ivoire', 'Égypte': 'Egypt', 'Afrique du Sud': 'South Africa',
  'Cameroun': 'Cameroon', 'Libye': 'Libya', 'Mauritanie': 'Mauritania', 'Nigéria': 'Nigeria',
  'Ouganda': 'Uganda', 'Tchad': 'Chad', 'Italie': 'Italy', 'Espagne': 'Spain',
  'Allemagne': 'Germany', 'Belgique': 'Belgium', 'Suisse': 'Switzerland',
  'Royaume-Uni': 'United Kingdom', 'Autriche': 'Austria', 'Bulgarie': 'Bulgaria',
  'Croatie': 'Croatia', 'Danemark': 'Denmark', 'Finlande': 'Finland', 'Grèce': 'Greece',
  'Hongrie': 'Hungary', 'Irlande': 'Ireland', 'Norvège': 'Norway', 'Pays-Bas': 'Netherlands',
  'Pologne': 'Poland', 'République Tchèque': 'Czechia', 'Roumanie': 'Romania',
  'Serbie': 'Serbia', 'Suède': 'Sweden', 'Turquie': 'Turkey', 'Palestine': 'Palestine',
  'Liban': 'Lebanon', 'Arabie Saoudite': 'Saudi Arabia', 'Émirats Arabes Unis': 'United Arab Emirates',
  'Jordanie': 'Jordan', 'Japon': 'Japan', 'Chine': 'China', 'Corée du Sud': 'South Korea',
  'Inde': 'India', 'Indonésie': 'Indonesia', 'Malaisie': 'Malaysia', 'Syrie': 'Syria',
  'Thaïlande': 'Thailand', 'Yémen': 'Yemen', 'États-Unis': 'United States of America',
  'Brésil': 'Brazil', 'Argentine': 'Argentina', 'Mexique': 'Mexico', 'Chili': 'Chile',
  'Colombie': 'Colombia', 'Pérou': 'Peru', 'Bolivie': 'Bolivia', 'Équateur': 'Ecuador',
  'Jamaïque': 'Jamaica', 'Haïti': 'Haiti', 'Irak': 'Iraq', 'Koweït': 'Kuwait', 'Russie': 'Russia'
};

export default function ForeignClubsMap() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');
      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(userProfile);

      const { data: clubsData } = await supabase.from('foreign_clubs').select('*, profiles(full_name, club)');
      setClubs(clubsData || []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  // Grouper les clubs par pays EN ANGLAIS pour que la carte les reconnaisse
  const clubsByCountry = clubs.reduce((acc, club) => {
    const frenchName = club.country.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF] /g, '').trim(); 
    const englishName = FR_TO_EN_MAP[frenchName] || frenchName;
    
    if (!acc[englishName]) acc[englishName] = [];
    acc[englishName].push({ ...club, displayCountry: frenchName });
    return acc;
  }, {});

  const formatWhatsAppLink = (number) => {
    if (!number) return '#';
    const cleanNumber = number.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-xl font-bold text-sky-400">Chargement de la carte...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col">
        
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 mb-6 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-sky-600 hover:text-sky-800 transition mb-1 inline-block">← Retour au hub</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Carte Internationale</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Découvrez les clubs étrangers référencés. Cliquez sur un pays en bleu.</p>
          </div>
          <Link href="/dashboard/foreign-clubs/new" className="hidden sm:block px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:-translate-y-0.5 transition-all">
            + Ajouter un club
          </Link>
        </div>

        <div className="flex-1 bg-sky-50/50 border border-sky-100 rounded-[2.5rem] shadow-inner overflow-hidden relative min-h-[60vh]">
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 130 }} style={{ width: "100%", height: "100%" }}>
            <ZoomableGroup>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name;
                    const isFilled = !!clubsByCountry[countryName];
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => {
                          if (isFilled) setSelectedCountry({ name: clubsByCountry[countryName][0].displayCountry, clubs: clubsByCountry[countryName] });
                        }}
                        style={{
                          default: { fill: isFilled ? "#38bdf8" : "#e2e8f0", outline: "none", stroke: "#fff", strokeWidth: 0.5 },
                          hover: { fill: isFilled ? "#0ea5e9" : "#cbd5e1", outline: "none", cursor: isFilled ? "pointer" : "default" },
                          pressed: { fill: "#0284c7", outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* MODAL POUR AFFICHER LES CLUBS DU PAYS */}
          {selectedCountry && (
            <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl p-6 overflow-y-auto animate-fade-in z-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900">{selectedCountry.name}</h2>
                <button onClick={() => setSelectedCountry(null)} className="h-8 w-8 bg-slate-100 rounded-full text-slate-500 font-bold hover:bg-slate-200">✕</button>
              </div>

              <div className="space-y-6">
                {selectedCountry.clubs.map(club => (
                  <div key={club.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <h3 className="font-extrabold text-lg text-slate-900">{club.club_name}</h3>
                    {club.club_ig && <a href={club.club_ig} target="_blank" className="text-xs font-bold text-pink-600 hover:underline">Instagram du Club ↗</a>}
                    
                    {/* INFO SUBMITTER (VISIBLE SEULEMENT PAR LA MISSION/COMITE) */}
                    {(profile?.role === 'chef_mission_inter' || profile?.role === 'comite_national' || profile?.role === 'super_admin') && (
                      <div className="mt-3 text-[10px] uppercase tracking-widest font-extrabold text-indigo-500 bg-indigo-50 inline-block px-2 py-1 rounded">
                        Soumis par: {club.profiles?.full_name} {club.profiles?.club ? `(${club.profiles.club})` : ''}
                      </div>
                    )}

                    {club.chef_name && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        {/* TITRE MIS A JOUR ICI */}
                        <p className="text-xs font-extrabold text-slate-500 uppercase">Chef des Actions Internationales</p>
                        <p className="font-bold text-slate-800">{club.chef_name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {club.chef_whatsapp && <a href={formatWhatsAppLink(club.chef_whatsapp)} target="_blank" className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200 transition">WhatsApp</a>}
                          {club.chef_ig && <a href={club.chef_ig} target="_blank" className="px-3 py-1.5 bg-pink-100 text-pink-700 text-xs font-bold rounded-lg hover:bg-pink-200 transition">Instagram</a>}
                          {club.chef_email && <a href={`mailto:${club.chef_email}`} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 transition">Email</a>}
                        </div>
                      </div>
                    )}

                    {club.president_name && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-extrabold text-slate-500 uppercase">Président</p>
                        <p className="font-bold text-slate-800">{club.president_name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {club.president_whatsapp && <a href={formatWhatsAppLink(club.president_whatsapp)} target="_blank" className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200 transition">WhatsApp</a>}
                          {club.president_ig && <a href={club.president_ig} target="_blank" className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition">Lien</a>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}