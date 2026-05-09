// 100 mock researchers with rich, interconnected metadata
import { JOURNALS } from './journals';

const INSTITUTIONS = [
  { id: 'i01', name: 'Universitas Indonesia', city: 'Depok', country: 'Indonesia', lat: -6.36, lng: 106.83 },
  { id: 'i02', name: 'Institut Teknologi Bandung', city: 'Bandung', country: 'Indonesia', lat: -6.89, lng: 107.61 },
  { id: 'i03', name: 'Universitas Gadjah Mada', city: 'Yogyakarta', country: 'Indonesia', lat: -7.77, lng: 110.38 },
  { id: 'i04', name: 'Institut Pertanian Bogor', city: 'Bogor', country: 'Indonesia', lat: -6.56, lng: 106.72 },
  { id: 'i05', name: 'Universitas Airlangga', city: 'Surabaya', country: 'Indonesia', lat: -7.27, lng: 112.78 },
  { id: 'i06', name: 'Universitas Hasanuddin', city: 'Makassar', country: 'Indonesia', lat: -5.13, lng: 119.49 },
  { id: 'i07', name: 'Universitas Diponegoro', city: 'Semarang', country: 'Indonesia', lat: -7.05, lng: 110.44 },
  { id: 'i08', name: 'Universitas Padjadjaran', city: 'Bandung', country: 'Indonesia', lat: -6.92, lng: 107.77 },
  { id: 'i09', name: 'Universitas Brawijaya', city: 'Malang', country: 'Indonesia', lat: -7.95, lng: 112.61 },
  { id: 'i10', name: 'Universitas Sumatera Utara', city: 'Medan', country: 'Indonesia', lat: 3.56, lng: 98.65 },
];

const fields = ['Climate Change', 'Renewable Energy', 'Public Health', 'Education Technology', 'Food Security',
  'Water Management', 'Urban Planning', 'Biodiversity', 'Poverty Reduction', 'Gender Studies',
  'Ocean Science', 'Sustainable Agriculture', 'Industrial Ecology', 'Peace & Justice', 'Digital Inclusion'];

const makeOrcid = (n) => {
  const s = String(n).padStart(4, '0');
  return `0000-0002-${s}-${String((n * 7) % 9999).padStart(4, '0')}`;
};

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

const firstNames = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Rizky', 'Nur', 'Andi', 'Rini', 'Hasan', 'Fitri',
  'Wahyu', 'Eka', 'Dian', 'Fajar', 'Indah', 'Teguh', 'Yuni', 'Arif', 'Lestari', 'Bagus'];
const lastNames  = ['Santoso', 'Rahayu', 'Wijaya', 'Kusuma', 'Pratama', 'Hidayat', 'Sari', 'Utami',
  'Permana', 'Putri', 'Sudirman', 'Wibowo', 'Susanto', 'Handayani', 'Nugroho', 'Setiawan', 'Ramadhan', 'Anggraini', 'Maharani', 'Firdaus'];

export const RESEARCHERS = Array.from({ length: 100 }, (_, i) => {
  const id = i + 1;
  const firstName = firstNames[i % firstNames.length];
  const lastName  = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
  const institution = INSTITUTIONS[i % INSTITUTIONS.length];
  const field1  = fields[i % fields.length];
  const field2  = fields[(i + 3) % fields.length];
  const pubCount = randomInt(12, 180);
  const citCount = randomInt(50, 8000);
  const hIndex   = randomInt(3, 35);
  const wis      = randomFloat(30, 98);
  const sdgFocus = [((i % 17) + 1), (((i + 4) % 17) + 1), (((i + 9) % 17) + 1)];
  const journalIds = [
    JOURNALS[i % JOURNALS.length].id,
    JOURNALS[(i + 7) % JOURNALS.length].id,
  ];

  return {
    id: `r${String(id).padStart(3, '0')}`,
    orcid: makeOrcid(1000 + id),
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    title: id % 3 === 0 ? 'Prof.' : id % 3 === 1 ? 'Dr.' : 'M.Sc.',
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${institution.id.replace('i0', 'univ').replace('i10', 'univ10')}.ac.id`,
    institution: institution.name,
    institutionId: institution.id,
    city: institution.city,
    country: institution.country,
    lat: institution.lat + (Math.random() - 0.5) * 0.5,
    lng: institution.lng + (Math.random() - 0.5) * 0.5,
    fields: [field1, field2],
    primarySdgs: sdgFocus,
    publicationCount: pubCount,
    citationCount: citCount,
    hIndex,
    wisScore: wis,
    wisCategory: wis >= 80 ? 'Exceptional' : wis >= 60 ? 'High' : wis >= 40 ? 'Moderate' : 'Low',
    scopusId: `SC${String(100000 + id)}`,
    sintaId: `ST${String(10000 + id)}`,
    googleScholarId: `GS${String(id).padStart(8, '0')}`,
    journalIds,
    avatar: null,
    bio: `Researcher specializing in ${field1} and ${field2} at ${institution.name}.`,
    verified: id % 4 !== 0,
    joinedYear: randomInt(2015, 2023),
    lastActive: `2024-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
    collaborators: Array.from({ length: randomInt(2, 8) }, (_, j) => `r${String(((id + j + 1) % 100) + 1).padStart(3, '0')}`),
  };
});

export const getResearcherById = (id) => RESEARCHERS.find(r => r.id === id) || null;
export const getResearcherByOrcid = (orcid) => RESEARCHERS.find(r => r.orcid === orcid) || null;
export const getResearchersByInstitution = (institutionId) => RESEARCHERS.filter(r => r.institutionId === institutionId);
export const getResearchersBySdg = (sdgNumber) => RESEARCHERS.filter(r => r.primarySdgs.includes(sdgNumber));
export const getTopResearchers = (n = 10) => [...RESEARCHERS].sort((a, b) => b.wisScore - a.wisScore).slice(0, n);
