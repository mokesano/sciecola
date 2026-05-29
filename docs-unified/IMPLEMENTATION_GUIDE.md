# Implementation Guide: Collaboration Features

Dokumentasi lengkap untuk mengimplementasikan dan menggunakan fitur Kolaborasi, Project Management, Research Matching, dan Innovation Marketplace.

## 🗄️ Database Setup

### 1. Apply Schema Additions

Jalankan file schema additions untuk menambah tabel-tabel baru:

```bash
mysql -u root -p wizdam_ecosystem < db/schema_additions.sql
```

**Tabel-tabel baru yang ditambahkan:**
- `researcher_expertise` - Expertise fields untuk peneliti
- `researcher_sdg_expertise` - SDG focus dan expertise level
- `project_budget_log` - Log pengeluaran detail proyek
- `project_sdg_focus` - SDG alignment untuk proyek (normalisasi dari JSON)
- `organizations` - Organisasi untuk opportunities
- `opportunity_applications` - Aplikasi untuk opportunities
- `opportunity_matches` - AI-matched opportunities untuk researchers
- `collaboration_interactions` - Tracking interaksi kolaborasi
- `admin_data_logs` - Audit trail untuk admin actions

### 2. Seeding Organizations (Optional)

Schema sudah include seed data untuk organizations:
- Tesla Energy
- Pfizer Research
- Bill & Melinda Gates Foundation
- Singapore Government
- The Ocean Cleanup
- Siemens Energy

---

## 🔌 API Endpoints

### Collaboration Hub
```
GET /api/collaboration.php?action=researchers&status=open&sdg=13
GET /api/collaboration.php?action=stats
POST /api/collaboration.php (send request)
```

**Request Body (POST):**
```json
{
  "from_orcid": "0000-0002-5152-9727",
  "to_orcid": "0000-0001-6742-5861",
  "message": "Interested in collaborating"
}
```

### Project Management
```
GET /api/projects.php?action=list&status=active&search=
GET /api/projects.php?action=stats
POST /api/projects.php (create project)
PUT /api/projects.php (update project)
```

**Request Body (POST/PUT):**
```json
{
  "id": 1,
  "title": "Ocean Acidification Study",
  "description": "Comprehensive analysis...",
  "lead_orcid": "0000-0002-5152-9727",
  "institution_id": 1,
  "status": "active",
  "progress": 67,
  "start_date": "2024-01-15",
  "end_date": "2025-06-30",
  "budget": 450000,
  "spent": 287500,
  "sdg_focus": [13, 14, 15]
}
```

### Research Matching
```
POST /api/research_matching.php
```

**Request Body:**
```json
{
  "keywords": "climate change",
  "sdg_goals": [13, 14],
  "institution": "MIT",
  "expertise_level": "expert",
  "collaboration_type": "joint_research"
}
```

### Innovation Marketplace
```
GET /api/innovation_marketplace.php?action=opportunities&category=all&search=
GET /api/innovation_marketplace.php?action=stats
POST /api/innovation_marketplace.php?action=apply
```

**Request Body (POST apply):**
```json
{
  "opportunity_id": 1,
  "applicant_orcid": "0000-0002-5152-9727",
  "applicant_name": "Dr. Sarah Chen",
  "applicant_email": "sarah@mit.edu",
  "applicant_institution_id": 1,
  "application_text": "We are interested in this opportunity because..."
}
```

### Admin API
```
POST /api/admin/researchers.php (create)
PUT /api/admin/researchers.php (update)
DELETE /api/admin/researchers.php?orcid=...
```

**Request Body (POST):**
```json
{
  "orcid": "0000-0002-5152-9727",
  "name": "Dr. Sarah Chen",
  "institution_id": 1,
  "collaboration_status": "open",
  "bio": "Professor of Climate Science",
  "research_keywords": ["climate", "ocean", "sustainability"],
  "profile_photo_url": "https://..."
}
```

---

## 🎨 Frontend Components

### 1. Collaboration Hub (`/collaboration`)
- Display list of researchers available for collaboration
- Filter by: status, SDG focus, search term
- Toggle between grid/list view
- Send collaboration requests
- View researcher profiles

### 2. Project Management (`/projects`)
- List all research projects with status
- Filter by: status, search
- View project statistics (budget, publications, team size)
- Track project progress
- Create new projects

### 3. Research Matching (`/research-matching`)
- AI-powered researcher matching
- Input search criteria (keywords, SDG, location, expertise)
- View match results with compatibility scores
- See match reasons
- Contact matched researchers

### 4. Innovation Marketplace (`/innovation-marketplace`)
- Browse innovation opportunities from industry/government/foundations
- Filter by: category, organization type, search
- View opportunity details (budget, deadline, requirements)
- Apply for opportunities
- Track application status

### 5. Admin Panel (`/admin/data-management`)
- Manage researchers data
- Manage projects
- Manage innovation opportunities
- Add researcher expertise and SDG focus
- Audit trail of all admin actions

---

## 🔧 Implementation Checklist

### Database
- [ ] Run `db/schema_additions.sql`
- [ ] Verify all tables created
- [ ] Seed organizations data (automatic)
- [ ] Check admin_data_logs table exists

### API Endpoints
- [ ] Test `/api/collaboration.php` endpoints
- [ ] Test `/api/projects.php` endpoints
- [ ] Test `/api/research_matching.php` endpoints
- [ ] Test `/api/innovation_marketplace.php` endpoints
- [ ] Create admin endpoints:
  - [ ] `/api/admin/researchers.php` (done)
  - [ ] `/api/admin/projects.php` (TODO)
  - [ ] `/api/admin/opportunities.php` (TODO)
  - [ ] `/api/admin/expertise.php` (TODO)

### Frontend
- [ ] Verify CollaborationHub fetches from API
- [ ] Verify ProjectManagement fetches from API
- [ ] Verify ResearchMatching fetches from API
- [ ] Verify InnovationMarketplace fetches from API
- [ ] AdminPanel accessible at `/admin/data-management`
- [ ] AdminPanel forms submit to admin endpoints

### Testing
- [ ] Test API responses with sample data
- [ ] Test form submissions from AdminPanel
- [ ] Test filtering and search functionality
- [ ] Test pagination (if implemented)
- [ ] Verify audit logs created for admin actions

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
│  React Components (CollaborationHub, Projects, etc)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP REST API
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    PHP API Endpoints                        │
│  /api/collaboration.php                                     │
│  /api/projects.php                                          │
│  /api/research_matching.php                                 │
│  /api/innovation_marketplace.php                            │
│  /api/admin/*.php                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                     PDO Driver
                         │
┌────────────────────────┴────────────────────────────────────┐
│               MySQL/MariaDB Database                        │
│  research_projects, researchers, institutions              │
│  opportunity_applications, collaboration_requests           │
│  project_budget_log, researcher_expertise                   │
│  organizations, admin_data_logs                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

**Current Implementation:** Basic (no authentication middleware)

**Recommended Future Enhancements:**
1. Add middleware untuk verify ORCID token
2. Check user role (researcher/admin) untuk access control
3. Verify ownership sebelum allow edit/delete
4. Log admin actions dengan admin_orcid

```php
// Middleware example (to be implemented)
function verifyAdminAccess($orcid) {
    // Check if user is admin
    // Log action with admin_orcid
    // Verify authorization
}
```

---

## 🚀 Performance Optimization Tips

1. **Add Indexes:** Sudah ada di schema untuk frequently queried fields
2. **Cache Strategy:** Gunakan `ecosystem_cache` untuk expensive queries
3. **Pagination:** Implement limit/offset untuk large result sets
4. **Search:** Leverage FULLTEXT indexes untuk title/description
5. **Eager Loading:** Join related tables di query, bukan per-record

---

## 📝 File Structure

```
sdgs-mapper/
├── api/
│   ├── wrapper/
│   │   ├── collaboration.php          ✅ NEW
│   │   ├── projects.php               ✅ NEW
│   │   ├── research_matching.php      ✅ NEW
│   │   └── innovation_marketplace.php ✅ NEW
│   └── admin/
│       ├── researchers.php            ✅ NEW (PARTIAL)
│       ├── projects.php               ❌ TODO
│       ├── opportunities.php          ❌ TODO
│       └── expertise.php              ❌ TODO
├── db/
│   └── schema_additions.sql           ✅ NEW
├── frontend-src/src/
│   ├── App.jsx                        ✅ UPDATED
│   └── pages/
│       ├── CollaborationHub.jsx       ✅ UPDATED
│       ├── ProjectManagement.jsx      ⏳ TODO
│       ├── ResearchMatching.jsx       ⏳ TODO
│       ├── InnovationMarketplace.jsx  ⏳ TODO
│       └── AdminPanel.jsx             ✅ NEW
└── includes/
    └── functions.php                  ✅ UPDATED

✅ = Completed
⏳ = Needs API integration
❌ = Not yet created
```

---

## 🐛 Known Issues & TODOs

### High Priority
- [ ] Implement remaining admin endpoints (projects, opportunities, expertise)
- [ ] Add authentication/authorization middleware
- [ ] Implement error handling for API failures
- [ ] Add form validation on frontend

### Medium Priority
- [ ] Add pagination for large result sets
- [ ] Implement caching for frequently accessed data
- [ ] Add email notifications for collaboration requests
- [ ] Create dashboard for admin with stats

### Low Priority
- [ ] Add export functionality (CSV/Excel)
- [ ] Implement advanced search filters
- [ ] Add data visualization for project statistics
- [ ] Create audit report generator

---

## 📞 Support & Questions

For questions or issues:
1. Check the error logs in `/storage/logs/`
2. Review admin_data_logs table for audit trail
3. Test API endpoints directly with curl/Postman
4. Check database connection and user permissions

---

## 🎯 Next Steps

1. **Apply Database Schema:** Run schema_additions.sql
2. **Test APIs:** Use Postman/curl to test endpoints
3. **Complete Admin Panel:** Implement remaining admin API endpoints
4. **Update Components:** Connect other React components to APIs
5. **Add Authentication:** Implement proper auth middleware
6. **Deploy:** Deploy to production with proper security configs

---

Generated: 2026-05-16
Version: 1.0
