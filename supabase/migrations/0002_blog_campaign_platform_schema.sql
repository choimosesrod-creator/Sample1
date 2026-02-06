-- Migration: Blog Campaign Platform (체험단 플랫폼) — docs/database.md 기반
-- Enums, profiles, terms, influencer/advertiser profiles, campaigns, applications

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 2.1 Enum types
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 2.2 프로필 및 약관
-- ---------------------------------------------------------------------------

-- auth.users와 1:1. 회원가입 시 최소 레코드 생성, 역할 저장 (userflow §1)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 약관 이력 (userflow §1)
CREATE TABLE public.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  terms_type text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_terms_acceptances_profile_id ON public.terms_acceptances(profile_id);

-- ---------------------------------------------------------------------------
-- 2.3 인플루언서
-- ---------------------------------------------------------------------------

-- 인플루언서 정보 등록 (userflow §2): 생년월일
CREATE TABLE public.influencer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  birthdate date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_influencer_profiles_profile_id ON public.influencer_profiles(profile_id);

-- SNS 채널: 유형/채널명/URL, 검증대기·성공·실패 (userflow §2)
CREATE TABLE public.influencer_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_profile_id uuid NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
  channel_type channel_type NOT NULL,
  channel_name text NOT NULL,
  channel_url text NOT NULL,
  verification_status channel_verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_influencer_channels_influencer_profile_id ON public.influencer_channels(influencer_profile_id);

-- ---------------------------------------------------------------------------
-- 2.4 광고주
-- ---------------------------------------------------------------------------

-- 광고주 정보 등록 (userflow §3): 업체명, 위치, 카테고리, 사업자등록번호
CREATE TABLE public.advertiser_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  location text NOT NULL,
  category text NOT NULL,
  business_registration_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_advertiser_profiles_profile_id ON public.advertiser_profiles(profile_id);

-- ---------------------------------------------------------------------------
-- 2.5 체험단 (캠페인)
-- ---------------------------------------------------------------------------

-- 체험단 (userflow §4, §8): 체험단명, 모집기간, 모집인원, 제공혜택, 매장정보, 미션, 상태
-- 배너(공지/추천)는 is_featured로 구분 (PRD §3 홈 상단 배너)
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_profile_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
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

CREATE INDEX idx_campaigns_advertiser_profile_id ON public.campaigns(advertiser_profile_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_recruitment_end_at ON public.campaigns(recruitment_end_at);
CREATE INDEX idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX idx_campaigns_is_featured ON public.campaigns(is_featured) WHERE is_featured = true;

-- ---------------------------------------------------------------------------
-- 2.6 지원 (applications)
-- ---------------------------------------------------------------------------

-- 체험단 지원 (userflow §6, §7, §9): 각오 한마디, 방문 예정일, 상태(신청완료/선정/반려)
-- 중복 지원 방지: (campaign_id, influencer_profile_id) UNIQUE
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_profile_id uuid NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  planned_visit_date date NOT NULL,
  status application_status NOT NULL DEFAULT 'applied',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, influencer_profile_id)
);

CREATE INDEX idx_applications_campaign_id ON public.applications(campaign_id);
CREATE INDEX idx_applications_influencer_profile_id ON public.applications(influencer_profile_id);
CREATE INDEX idx_applications_status ON public.applications(status);
