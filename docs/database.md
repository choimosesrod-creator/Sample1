# 블로그 체험단 플랫폼 — 데이터베이스 설계

PRD·userflow에 명시된 기능만을 구현하기 위한 **최소 스펙**의 PostgreSQL 스키마 및 데이터플로우 문서입니다.  
인증·회원관리는 Supabase Auth(`auth.users`)를 사용하며, 애플리케이션 DB는 프로필·역할별 정보·체험단·지원만 관리합니다.

---

## 1. 데이터플로우 (간략)

### 1.1 흐름 개요

```
[Supabase Auth] → auth.users
       │
       ▼
   profiles (이름, 휴대폰, 이메일, 역할) + terms_acceptances (약관 이력)
       │
       ├── [역할: 인플루언서] → influencer_profiles (생년월일)
       │                            └── influencer_channels (채널 유형/명/URL, 검증상태)
       │
       └── [역할: 광고주] → advertiser_profiles (업체명, 위치, 카테고리, 사업자등록번호)
                                    │
                                    ▼
                              campaigns (체험단명, 모집기간/인원, 혜택, 매장, 미션, 상태)
                                    │
                                    ▼
                              applications (각오 한마디, 방문예정일, 상태: 신청완료/선정/반려)
                                    ↑
                    influencer_profiles (인플루언서가 지원)
```

### 1.2 시나리오별 데이터플로우

| 시나리오 | 주체 | DB 동작 |
|----------|------|---------|
| **회원가입·역할선택** | 시스템 | Auth 계정 생성 → `profiles` INSERT(이름, 휴대폰, 이메일, 역할) → `terms_acceptances` INSERT |
| **인플루언서 정보 등록** | 인플루언서 | `influencer_profiles` INSERT/UPDATE(생년월일) → `influencer_channels` INSERT/UPDATE/DELETE(채널명, URL, 검증상태) |
| **광고주 정보 등록** | 광고주 | `advertiser_profiles` INSERT/UPDATE(업체명, 위치, 카테고리, 사업자등록번호) |
| **홈·배너·목록** | 조회 | `campaigns` SELECT (상태=모집중, 배너용은 추천 플래그), 최신순·페이징 |
| **체험단 상세** | 조회 | `campaigns` SELECT by id; 지원 버튼 노출 여부는 해당 유저의 `influencer_profiles` 존재 여부로 판단 |
| **체험단 지원** | 인플루언서 | 모집기간·중복 검사 → `applications` INSERT(각오 한마디, 방문 예정일, 상태=신청완료) |
| **내 지원 목록** | 인플루언서 | `applications` SELECT (본인 influencer_profile_id, 상태 필터: 신청완료/선정/반려) |
| **체험단 관리 목록** | 광고주 | `campaigns` SELECT (본인 advertiser_profile_id) |
| **체험단 신규 등록** | 광고주 | `campaigns` INSERT(체험단명, 모집기간, 모집인원, 혜택, 매장, 미션, 상태=모집중) |
| **모집종료** | 광고주 | `campaigns` UPDATE status → 모집종료 |
| **체험단 선정** | 광고주 | 선정 인원에 대해 `applications` UPDATE status=선정, 미선정은 반려 → `campaigns` UPDATE status=선정완료 |

---

## 2. 구체적인 데이터베이스 스키마 (PostgreSQL)

Supabase 사용을 가정하며, `auth.users(id)`는 Supabase가 관리하는 UUID입니다.  
모든 `id`는 `uuid`이며 기본값 `gen_random_uuid()`를 사용합니다.

### 2.1 Enum 타입

```sql
-- 역할 (회원가입 시 선택)
CREATE TYPE app_role AS ENUM ('advertiser', 'influencer');

-- 체험단 상태 (userflow §8, §9)
CREATE TYPE campaign_status AS ENUM ('recruiting', 'recruitment_closed', 'selection_completed');

-- 지원 상태 (userflow §6, §7, §9)
CREATE TYPE application_status AS ENUM ('applied', 'selected', 'rejected');

-- SNS 채널 검증 상태 (userflow §2)
CREATE TYPE channel_verification_status AS ENUM ('pending', 'success', 'failed');

-- SNS 채널 유형 (PRD: Naver, YouTube, Instagram, Threads)
CREATE TYPE channel_type AS ENUM ('naver', 'youtube', 'instagram', 'threads');
```

### 2.2 프로필 및 약관

```sql
-- auth.users와 1:1. 회원가입 시 최소 레코드 생성, 역할 저장 (userflow §1)
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- 약관 이력 (userflow §1)
CREATE TABLE terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  terms_type text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_terms_acceptances_profile_id ON terms_acceptances(profile_id);
```

### 2.3 인플루언서

```sql
-- 인플루언서 정보 등록 (userflow §2): 생년월일
CREATE TABLE influencer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  birthdate date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_influencer_profiles_profile_id ON influencer_profiles(profile_id);

-- SNS 채널: 유형/채널명/URL, 검증대기·성공·실패 (userflow §2)
CREATE TABLE influencer_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_profile_id uuid NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  channel_type channel_type NOT NULL,
  channel_name text NOT NULL,
  channel_url text NOT NULL,
  verification_status channel_verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_influencer_channels_influencer_profile_id ON influencer_channels(influencer_profile_id);
```

### 2.4 광고주

```sql
-- 광고주 정보 등록 (userflow §3): 업체명, 위치, 카테고리, 사업자등록번호
CREATE TABLE advertiser_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  location text NOT NULL,
  category text NOT NULL,
  business_registration_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_advertiser_profiles_profile_id ON advertiser_profiles(profile_id);
```

### 2.5 체험단 (캠페인)

```sql
-- 체험단 (userflow §4, §8): 체험단명, 모집기간, 모집인원, 제공혜택, 매장정보, 미션, 상태
-- 배너(공지/추천)는 is_featured로 구분 (PRD §3 홈 상단 배너)
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_profile_id uuid NOT NULL REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  recruitment_start_at timestamptz NOT NULL,
  recruitment_end_at timestamptz NOT NULL,
  recruitment_count int NOT NULL CHECK (recruitment_count > 0),
  benefits text NOT NULL,
  store_info text NOT NULL,
  mission text NOT NULL,
  status campaign_status NOT NULL DEFAULT 'recruiting',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_recruitment_period CHECK (recruitment_end_at > recruitment_start_at)
);

CREATE INDEX idx_campaigns_advertiser_profile_id ON campaigns(advertiser_profile_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_recruitment_end_at ON campaigns(recruitment_end_at);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_campaigns_is_featured ON campaigns(is_featured) WHERE is_featured = true;
```

### 2.6 지원 (applications)

```sql
-- 체험단 지원 (userflow §6, §7, §9): 각오 한마디, 방문 예정일, 상태(신청완료/선정/반려)
-- 중복 지원 방지: (campaign_id, influencer_profile_id) UNIQUE
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_profile_id uuid NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  planned_visit_date date NOT NULL,
  status application_status NOT NULL DEFAULT 'applied',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, influencer_profile_id)
);

CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_influencer_profile_id ON applications(influencer_profile_id);
CREATE INDEX idx_applications_status ON applications(status);
```

### 2.7 RLS (Row Level Security) 권장

Supabase 사용 시 `auth.uid()`와 매핑해 RLS 정책을 두는 것을 권장합니다.

- `profiles`: `auth_user_id = auth.uid()`인 행만 조회/수정
- `influencer_profiles`, `influencer_channels`: 해당 `profile_id`가 본인인 경우만
- `advertiser_profiles`: 해당 `profile_id`가 본인인 경우만
- `campaigns`: `advertiser_profile_id`가 본인 광고주 프로필인 경우만 수정/삭제; 조회는 모집중 공개 등 정책에 따라
- `applications`: 인플루언서는 본인 지원만, 광고주는 자신의 캠페인에 대한 지원만

RLS 정책 DDL은 운영 환경에 맞게 별도 작성하는 것을 권장합니다.

---

## 3. 엔티티 관계 요약

| 테이블 | 설명 | 주요 FK |
|--------|------|----------|
| `profiles` | 공통 프로필(이름, 휴대폰, 이메일, 역할) | `auth_user_id` → auth.users |
| `terms_acceptances` | 약관 동의 이력 | `profile_id` → profiles |
| `influencer_profiles` | 인플루언서 생년월일 | `profile_id` → profiles |
| `influencer_channels` | SNS 채널(유형/명/URL/검증상태) | `influencer_profile_id` → influencer_profiles |
| `advertiser_profiles` | 광고주(업체명, 위치, 카테고리, 사업자번호) | `profile_id` → profiles |
| `campaigns` | 체험단(모집기간, 인원, 혜택, 매장, 미션, 상태) | `advertiser_profile_id` → advertiser_profiles |
| `applications` | 지원(각오 한마디, 방문예정일, 상태) | `campaign_id`, `influencer_profile_id` |

유저플로우에 명시된 데이터만 포함한 최소 스펙이며, 추후 리뷰·리포트 등 확장 시 테이블/컬럼을 추가하면 됩니다.
