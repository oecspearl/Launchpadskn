# LaunchPad SKN - Schools Database

This document lists all secondary schools in the LaunchPad SKN application database, their information, the form structure, and the CSEC/CAPE subjects offered.

---

## Table of Contents

1. [Schools Overview](#1-schools-overview)
2. [St. Kitts Public Secondary Schools](#2-st-kitts-public-secondary-schools)
3. [St. Kitts Private Secondary Schools](#3-st-kitts-private-secondary-schools)
4. [Nevis Public Secondary Schools](#4-nevis-public-secondary-schools)
5. [Nevis Private Secondary Schools](#5-nevis-private-secondary-schools)
6. [Form Structure](#6-form-structure)
7. [CSEC Subjects Catalog](#7-csec-subjects-catalog)
8. [Institution Database Schema](#8-institution-database-schema)

---

## 1. Schools Overview

The system contains **12 secondary schools** across Saint Kitts and Nevis:

| Island | Public | Private | Total |
|---|---|---|---|
| St. Kitts | 6 | 3 | 9 |
| Nevis | 2 | 1 | 3 |
| **Total** | **8** | **4** | **12** |

All institutions are stored in the `institutions` table with `institution_type = 'SECONDARY_SCHOOL'`.

---

## 2. St. Kitts Public Secondary Schools

### 1. Basseterre High School (BHS)

| Field | Value |
|---|---|
| **Full Name** | Basseterre High School (BHS) |
| **Location** | Bernard Audain's Drive, Taylors, Basseterre, St. Kitts |
| **Phone** | +1 (869) 465-2096, +1 (869) 465-2004 |
| **Contact Email** | damian.bacchus@moe.edu.kn |
| **Type** | Public |

---

### 2. Cayon High School (CHS)

| Field | Value |
|---|---|
| **Full Name** | Cayon High School (CHS) |
| **Location** | St. Mary Cayon, St. Kitts |
| **Phone** | +1 (869) 465-7204 |
| **Contact Email** | tracy.wattley@moe.edu.kn |
| **Type** | Public |

---

### 3. Washington Archibald High School (WAHS)

| Field | Value |
|---|---|
| **Full Name** | Washington Archibald High School (WAHS) |
| **Location** | Taylor's Range, Basseterre, St. Kitts |
| **Phone** | +1 (869) 465-2834, +1 (869) 667-0870 |
| **Contact Email** | Roline.Taylor@moe.edu.kn |
| **Type** | Public |

---

### 4. Verchilds High School

| Field | Value |
|---|---|
| **Full Name** | Verchilds High School |
| **Location** | Verchild's Village, St. Thomas Middle Island, St. Kitts |
| **Phone** | +1 (869) 465-6283 |
| **Contact Email** | meguel.thomas@moe.edu.kn |
| **Type** | Public |

---

### 5. Charles E. Mills Secondary School (CEMSS)

| Field | Value |
|---|---|
| **Full Name** | Charles E. Mills Secondary School (CEMSS) |
| **Location** | Sandy Point, St. Kitts |
| **Former Name** | Sandy Point High School |
| **Phone** | +1 (869) 465-6295 |
| **Contact Email** | eisha.jackson@moe.edu.kn |
| **Type** | Public |

---

### 6. Dr. Denzil L. Douglas Secondary School

| Field | Value |
|---|---|
| **Full Name** | Dr. Denzil L. Douglas Secondary School |
| **Location** | Saddlers, St. Kitts |
| **Former Name** | Saddlers Secondary School |
| **Phone** | +1 (869) 465-5804 |
| **Contact Email** | julia.byron-isaac@moe.edu.kn |
| **Type** | Public |

---

## 3. St. Kitts Private Secondary Schools

### 7. Immaculate Conception Catholic School (ICCS)

| Field | Value |
|---|---|
| **Full Name** | Immaculate Conception Catholic School (ICCS) |
| **Location** | E Independence Street, Basseterre, St. Kitts |
| **Former Name** | St. Theresa's Convent High School |
| **Phone** | +1 (869) 465-3219 |
| **Contact** | Contact via phone |
| **Type** | Private (Catholic) |

---

### 8. St. Kitts International Academy (SKI Academy)

| Field | Value |
|---|---|
| **Full Name** | St. Kitts International Academy (SKI Academy) |
| **Location** | Box 1206, Morgan Heights, Basseterre, St. Kitts |
| **Phone** | +1 (869) 466-1026 |
| **Contact Email** | skiacademy@caribsurf.com |
| **Website** | www.skiacademy.net |
| **Type** | Private (International) |

---

### 9. St. Christopher Preparatory School

| Field | Value |
|---|---|
| **Full Name** | St. Christopher Preparatory School |
| **Location** | St. Kitts |
| **Phone** | Contact Ministry of Education |
| **Contact** | Information not publicly available |
| **Type** | Private |

---

## 4. Nevis Public Secondary Schools

### 10. Charlestown Secondary School

| Field | Value |
|---|---|
| **Full Name** | Charlestown Secondary School |
| **Location** | PO Box 207, Stoney Grove, Charlestown, Nevis |
| **Phone** | +1 (869) 469-7316 |
| **Contact Email** | dianna.browne@moe.edu.kn |
| **Type** | Public |

---

### 11. Gingerland Secondary School

| Field | Value |
|---|---|
| **Full Name** | Gingerland Secondary School |
| **Location** | Stonyhill, Gingerland, Nevis |
| **Phone** | +1 (869) 469-3926 |
| **Contact** | Contact via phone or Ministry of Education Nevis |
| **Type** | Public |

---

## 5. Nevis Private Secondary Schools

### 12. Nevis International Secondary School (NISS)

| Field | Value |
|---|---|
| **Full Name** | Nevis International Secondary School (NISS) |
| **Location** | Brown Pasture, Charlestown, Nevis |
| **Year Groups** | Forms 1-5 (Ages 11-17) |
| **Phone** | +1 (869) 469-7006 |
| **Contact Email** | nevisinternationalsecondary@sisterisles.kn |
| **Website** | www.nevisinternational.wixsite.com |
| **Type** | Private (International) |

---

## 6. Form Structure

Each school is configured with **7 forms** (year groups) following the Caribbean secondary school structure. Forms are created per academic year (e.g., "2024-2025").

### Lower Secondary: Forms 1-3

| Form | Name | Ages | Description |
|---|---|---|---|
| **Form 1** | Form 1 | 11-12 | Foundation year for secondary education. Internal assessments only. |
| **Form 2** | Form 2 | 12-13 | Continuation of foundation studies. Internal assessments only. |
| **Form 3** | Form 3 | 13-14 | Final year of lower secondary. Internal assessments. Prepares students for CSEC track in Forms 4-5. |

### Upper Secondary (CSEC): Forms 4-5

| Form | Name | Ages | Description |
|---|---|---|---|
| **Form 4** | Form 4 | 14-15 | First year of CSEC preparation. Students begin CSEC subject studies and School-Based Assessments (SBAs). |
| **Form 5** | Form 5 | 15-16 | CSEC Examination Year. Students complete SBAs and sit CSEC examinations at end of year. |

### Sixth Form (CAPE, Optional): Forms 6-7

| Form | Name | Ages | Description |
|---|---|---|---|
| **Form 6** | Lower Sixth | 16-17 | First year of CAPE (Caribbean Advanced Proficiency Examination) preparation. Optional post-CSEC education for students pursuing A-Level equivalent studies. |
| **Form 7** | Upper Sixth | 17-18 | CAPE Examination Year. Students complete CAPE coursework and sit CAPE examinations. Prepares for university admission. |

---

## 7. CSEC Subjects Catalog

All 12 secondary schools are provisioned with the following CSEC subjects. Each school gets its own copy of each subject with a unique code in the format `{CODE}_{SCHOOL_ID}`.

### Core / Compulsory Subjects

| Subject | Code | CXC Code | Description |
|---|---|---|---|
| English Language | ENG | 0500 | English A - Core compulsory subject for all students |
| Mathematics | MATH | 0502 | Core compulsory subject for all students |

### Sciences

| Subject | Code | CXC Code | Description |
|---|---|---|---|
| Biology | BIO | 0301 | General Proficiency |
| Chemistry | CHEM | 0302 | General Proficiency |
| Physics | PHYS | 0303 | General Proficiency |
| Human and Social Biology | HSB | 0304 | General Proficiency |
| Integrated Science | INTSCI | 0305 | General Proficiency |
| Agricultural Science | AGRIC | 0601 | General Proficiency |

### Social Sciences & Humanities

| Subject | Code | CXC Code | Description |
|---|---|---|---|
| Geography | GEO | 0201 | General Proficiency |
| Caribbean History | HIST | 0202 | General Proficiency |
| Social Studies | SOCST | 0203 | General Proficiency |
| Economics | ECON | 0401 | General Proficiency |

### Business Studies

| Subject | Code | CXC Code | Description |
|---|---|---|---|
| Principles of Accounts | POA | 0402 | General Proficiency |
| Principles of Business | POB | 0403 | General Proficiency |
| Office Administration | OA | 0404 | General Proficiency |
| Information Technology | IT | 0701 | General Proficiency |

### Languages

| Subject | Code | CXC Code | Description |
|---|---|---|---|
| Spanish | SPAN | 0102 | General Proficiency |
| French | FREN | 0101 | General Proficiency |
| English B | ENGB | 0501 | General Proficiency (for non-native English speakers) |

### Technical / Vocational Subjects

| Subject | Code | CXC Code | Description |
|---|---|---|---|
| Technical Drawing | TECHDR | 0702 | General Proficiency |
| Electronic Document Preparation and Management | EDPM | 0703 | General Proficiency |
| Building Technology | BUILDT | 0704 | Technical Proficiency |
| Electrical and Electronic Technology | ELEC | 0705 | Technical Proficiency |
| Mechanical Engineering Technology | MECH | 0706 | Technical Proficiency |
| Home Economics - Food and Nutrition | FOOD | 0602 | General Proficiency |
| Home Economics - Clothing and Textiles | TEXT | 0603 | General Proficiency |

### Other Subjects

| Subject | Code | CXC Code | Description |
|---|---|---|---|
| Physical Education and Sport | PE | 0801 | General Proficiency |
| Visual Arts | ARTS | 0802 | General Proficiency |
| Music | MUSIC | 0803 | General Proficiency |
| Theatre Arts | THEATRE | 0804 | General Proficiency |
| Additional Mathematics | ADDMATH | 0503 | General Proficiency (for advanced math students) |

**Total: 28 CSEC subjects per school**

---

## 8. Institution Database Schema

### institutions Table

| Column | Type | Description |
|---|---|---|
| `institution_id` | BIGSERIAL (PK) | Auto-generated unique identifier |
| `name` | VARCHAR(255) UNIQUE NOT NULL | Full institution name (e.g., "Basseterre High School (BHS)") |
| `location` | VARCHAR(255) | Physical address |
| `contact` | VARCHAR(255) | Primary contact (email or description) |
| `phone` | VARCHAR(255) | Phone number(s) |
| `website` | VARCHAR(255) | Institution website URL |
| `established_year` | INTEGER | Year the school was established |
| `institution_type` | VARCHAR(50) | Type: SECONDARY_SCHOOL, PRIMARY_SCHOOL, TERTIARY_INSTITUTION, MINISTRY_OF_EDUCATION, OTHER |
| `logo_url` | TEXT | URL to the school's logo image (Supabase Storage) |
| `address` | TEXT | Extended address field |
| `principal` | VARCHAR(255) | Name of the school principal or head of institution |
| `created_at` | TIMESTAMP | Record creation timestamp |

### Related Tables

| Table | Relationship | Description |
|---|---|---|
| `forms` | `school_id` FK | Year groups (Forms 1-7) per school per academic year |
| `subjects` | `school_id` FK | Subjects offered by each school with CXC codes |
| `users` | `institution_id` FK | Users (teachers, students, admins) assigned to an institution |
| `classes` | via `forms` | Homeroom/stream classes (e.g., 3A, 3B) within each form |
| `departments` | `institution_id` FK | Academic departments within the school |

### Institution Type Constraint

```
CHECK (institution_type IN (
    'SECONDARY_SCHOOL',
    'PRIMARY_SCHOOL',
    'TERTIARY_INSTITUTION',
    'MINISTRY_OF_EDUCATION',
    'OTHER'
))
```

Default: `SECONDARY_SCHOOL`
