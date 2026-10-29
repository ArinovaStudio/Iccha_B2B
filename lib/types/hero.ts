export type ContentPosition = 'left' | 'right' | 'center';
export type TextTheme = 'light' | 'dark';
export type HeroSlideStatus = 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'ARCHIVED';

export interface HeroCTA {
  label: string;
  href: string;
}

export interface HeroSlide {
  id: string;
  internalName?: string;
  slideNumber: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  desktopImage: string;
  mobileImage?: string;
  desktopAssetId?: string;
  mobileAssetId?: string;
  imageAlt: string;
  primaryCTA: HeroCTA;
  secondaryCTA?: HeroCTA;
  contentPosition: ContentPosition;
  textTheme: TextTheme;
  desktopImagePosition?: string;
  mobileImagePosition?: string;
  productId?: string;
  categoryId?: string;
  collectionId?: string;
  fabricTags?: string[];
  editorialBadge?: string;
  sortOrder?: number;
  status?: HeroSlideStatus;
  startAt?: string | null;
  endAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
}

export interface HeroSliderConfig {
  autoSlideInterval: number; // in milliseconds, e.g. 5500
  transitionDuration: number; // in seconds, e.g. 1.6
  distortionIntensity: number; // 0.1 to 0.4
  enableSubtleZoom: boolean;
  enableMouseParallax: boolean;
}

export interface CreateHeroSlideDTO {
  internalName: string;
  eyebrow: string;
  title: string;
  description: string;
  desktopImage: string;
  mobileImage?: string;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  contentPosition?: ContentPosition;
  textTheme?: TextTheme;
  desktopImagePosition?: string;
  mobileImagePosition?: string;
  productId?: string;
  categoryId?: string;
  collectionId?: string;
  fabricTags?: string[];
  editorialBadge?: string;
  navLabel?: string;
  sortOrder?: number;
  status?: HeroSlideStatus;
  startAt?: string | null;
  endAt?: string | null;
}
