'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Copy, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Upload, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sliders,
  AlertCircle,
  Monitor,
  Smartphone,
  X
} from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { HeroSlide, CreateHeroSlideDTO } from '@/lib/types/hero';
import { CategoryService } from '@/lib/services';
import { Category } from '@/lib/types';

export default function AdminHeroManagementPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState<HeroSlide | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Partial<CreateHeroSlideDTO> & { id?: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Fetch Slides & Categories
  const fetchSlides = useCallback(async () => {
    try {
      const [heroRes, cats] = await Promise.all([
        fetch('/api/admin/hero').then((r) => r.json()),
        CategoryService.getCategories(),
      ]);

      if (heroRes.success) {
        setSlides(heroRes.data);
        setSelectedSlide((prev) => {
          if (!prev && heroRes.data.length > 0) return heroRes.data[0];
          if (prev) {
            const updated = heroRes.data.find((s: HeroSlide) => s.id === prev.id);
            return updated || heroRes.data[0] || null;
          }
          return null;
        });
      }
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching admin hero slides:', err);
      showNotification('Failed to load slides', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        const [heroRes, cats] = await Promise.all([
          fetch('/api/admin/hero').then((r) => r.json()),
          CategoryService.getCategories(),
        ]);

        if (isCancelled) return;

        if (heroRes.success) {
          setSlides(heroRes.data);
          setSelectedSlide((prev) => {
            if (!prev && heroRes.data.length > 0) return heroRes.data[0];
            if (prev) {
              const updated = heroRes.data.find((s: HeroSlide) => s.id === prev.id);
              return updated || heroRes.data[0] || null;
            }
            return null;
          });
        }
        setCategories(cats);
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching admin hero slides:', err);
          showNotification('Failed to load slides', 'error');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [showNotification]);

  // Actions
  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/hero/${id}/publish`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showNotification('Campaign published live! WebGL Hero updated.', 'success');
        fetchSlides();
      }
    } catch {
      showNotification('Failed to publish slide', 'error');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/hero/${id}/unpublish`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showNotification('Slide changed to Draft status.', 'success');
        fetchSlides();
      }
    } catch {
      showNotification('Failed to unpublish slide', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/hero/${id}/duplicate`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showNotification('Slide duplicated as Draft.', 'success');
        fetchSlides();
      }
    } catch {
      showNotification('Failed to duplicate slide', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to permanently delete this slide? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/hero/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (json.success) {
        showNotification('Hero slide permanently deleted.', 'success');
        await fetchSlides();
      } else {
        showNotification(
          json.error?.message || 'Failed to delete slide',
          'error'
        );
      }
    } catch {
      showNotification('Failed to delete slide', 'error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(targetIndex, 0, moved);

    const reorderedPayload = newSlides.map((s, idx) => ({
      id: s.id,
      sortOrder: idx + 1,
    }));

    try {
      const res = await fetch('/api/admin/hero/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: reorderedPayload }),
      });
      const json = await res.json();
      if (json.success) {
        setSlides(json.data);
        showNotification('Hero slide sequence reordered.', 'success');
      }
    } catch {
      showNotification('Failed to reorder slides', 'error');
    }
  };

  // Image Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'desktopImage' | 'mobileImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', field === 'desktopImage' ? 'HERO_DESKTOP' : 'HERO_MOBILE');

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setEditingSlide((prev) => ({
          ...prev,
          [field]: json.data.publicUrl,
        }));
        showNotification(`${field === 'desktopImage' ? 'Desktop' : 'Mobile'} image uploaded!`, 'success');
      } else {
        showNotification(json.error?.message || 'Upload failed', 'error');
      }
    } catch {
      showNotification('Network error during upload', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Save Modal
  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isNew = !editingSlide.id;
      const url = isNew ? '/api/admin/hero' : `/api/admin/hero/${editingSlide.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const payload = {
        ...editingSlide,
        internalName: editingSlide.internalName || 'Kurta Campaign',
        eyebrow: editingSlide.eyebrow || 'NEW COLLECTION',
        title: editingSlide.title || 'Everyday,\nMade Beautiful.',
        description: editingSlide.description || 'Contemporary ethnicwear.',
        desktopImage: editingSlide.desktopImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&auto=format&fit=crop&q=85',
        mobileImage: editingSlide.mobileImage || editingSlide.desktopImage,
        imageAlt: editingSlide.imageAlt || 'Kurta Collection',
        primaryCtaLabel: editingSlide.primaryCtaLabel || 'EXPLORE COLLECTION',
        primaryCtaUrl: editingSlide.primaryCtaUrl || '/collections',
        secondaryCtaLabel: editingSlide.secondaryCtaLabel || '',
        secondaryCtaUrl: editingSlide.secondaryCtaUrl || '/register',
        contentPosition: editingSlide.contentPosition || 'left',
        textTheme: editingSlide.textTheme || 'light',
        desktopImagePosition: editingSlide.desktopImagePosition || 'center 25%',
        mobileImagePosition: editingSlide.mobileImagePosition || '60% 20%',
        status: editingSlide.status || 'PUBLISHED',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setIsEditModalOpen(false);
        showNotification(isNew ? 'New hero slide created!' : 'Hero slide updated successfully!', 'success');
        fetchSlides();
      } else {
        showNotification(json.error?.message || 'Failed to save slide', 'error');
      }
    } catch {
      showNotification('Failed to submit slide form', 'error');
    }
  };

  const openNewSlideModal = () => {
    setEditingSlide({
      internalName: 'New Kurta Campaign',
      eyebrow: 'NEW COLLECTION • VOL. 27',
      title: 'Graceful Craft,\nPure Comfort.',
      description: 'Stitched wholesale kurtis & 2-piece ensembles direct from Surat and Jaipur textile hubs.',
      desktopImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1920&auto=format&fit=crop&q=85',
      mobileImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1080&auto=format&fit=crop&q=85',
      imageAlt: 'IcchaStore Premium Stitched Kurti Set',
      primaryCtaLabel: 'EXPLORE COLLECTION',
      primaryCtaUrl: '/collections',
      secondaryCtaLabel: 'APPLY FOR ACCESS →',
      secondaryCtaUrl: '/register',
      contentPosition: 'left',
      textTheme: 'light',
      desktopImagePosition: 'center 25%',
      mobileImagePosition: '50% 20%',
      status: 'PUBLISHED',
      fabricTags: ['Pure Cotton', 'Mill Direct', 'Set Packing'],
      editorialBadge: 'Direct Factory Archive',
    });
    setIsEditModalOpen(true);
  };

  const openEditSlideModal = (slide: HeroSlide) => {
    setEditingSlide({
      id: slide.id,
      internalName: slide.internalName || slide.navLabel,
      navLabel: slide.navLabel,
      eyebrow: slide.eyebrow,
      title: slide.title,
      description: slide.description,
      desktopImage: slide.desktopImage,
      mobileImage: slide.mobileImage,
      imageAlt: slide.imageAlt,
      primaryCtaLabel: slide.primaryCTA.label,
      primaryCtaUrl: slide.primaryCTA.href,
      secondaryCtaLabel: slide.secondaryCTA?.label || '',
      secondaryCtaUrl: slide.secondaryCTA?.href || '',
      contentPosition: slide.contentPosition,
      textTheme: slide.textTheme,
      desktopImagePosition: slide.desktopImagePosition || 'center 25%',
      mobileImagePosition: slide.mobileImagePosition || '60% 20%',
      categoryId: slide.categoryId,
      collectionId: slide.collectionId,
      fabricTags: slide.fabricTags,
      editorialBadge: slide.editorialBadge,
      status: slide.status,
      startAt: slide.startAt,
      endAt: slide.endAt,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      {/* Admin Sidebar with active hero tab */}
      <AdminSidebar activeTab="hero" />

      {/* Main Admin Console */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto max-w-7xl">
        
        {/* Header Notification Banner */}
        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between shadow-md transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
                : 'bg-rose-900 text-rose-100 border border-rose-700'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
                Merchandising & Campaign Desk
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                WebGL 3D Engine Live
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Homepage Hero & Campaign Showcase
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Manage campaign images, editorial copy, button actions, and scheduling without rebuilding or redeploying the app.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchSlides}
              className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-stone-700 transition"
              title="Refresh Slides"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={openNewSlideModal}
              className="px-4 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Hero Slide</span>
            </button>
          </div>
        </div>

        {/* Content Layout: 2 Columns (Slide Management Grid & Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Slides List & Management (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#831843]" />
                Active Slide Sequence ({slides.length})
              </h2>
              <span className="text-[11px] text-stone-400 font-medium">
                Changes reflect immediately on public homepage
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#831843]" />
                Loading hero slides...
              </div>
            ) : slides.length === 0 ? (
              <div className="p-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
                No hero slides found. Click &quot;Add New Hero Slide&quot; to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {slides.map((slide, index) => {
                  const isSelected = selectedSlide?.id === slide.id;
                  const isPublished = slide.status === 'PUBLISHED';
                  const isDraft = slide.status === 'DRAFT';
                  const isScheduled = slide.status === 'SCHEDULED';

                  return (
                    <div
                      key={slide.id}
                      onClick={() => setSelectedSlide(slide)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                        isSelected
                          ? 'border-[#831843] shadow-md ring-1 ring-[#831843]/20'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Slide Number & Order Controls */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            #{slide.slideNumber || String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveOrder(index, 'up');
                              }}
                              className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-20 transition"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === slides.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveOrder(index, 'down');
                              }}
                              className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-20 transition"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <Image
                            src={slide.desktopImage}
                            alt={slide.imageAlt || 'Slide thumbnail'}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>

                        {/* Slide Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#831843] truncate">
                              {slide.eyebrow}
                            </span>
                            {/* Status Badge */}
                            {isPublished && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Live
                              </span>
                            )}
                            {isDraft && (
                              <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-[10px] font-bold">
                                Draft
                              </span>
                            )}
                            {isScheduled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                Scheduled
                              </span>
                            )}
                          </div>

                          <h3 className="font-serif text-sm font-bold text-stone-900 truncate mt-0.5">
                            {slide.title.replace('\n', ' ')}
                          </h3>

                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                            {slide.description}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
                            <span>Tab: <strong>{slide.navLabel}</strong></span>
                            <span>&bull;</span>
                            <span>CTA: <strong>{slide.primaryCTA.label}</strong></span>
                          </div>
                        </div>

                        {/* Quick Actions Dropdown / Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSlideModal(slide);
                            }}
                            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                            title="Edit Slide"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(slide.id);
                            }}
                            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                            title="Duplicate Slide"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {isPublished ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnpublish(slide.id);
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition text-xs font-semibold"
                              title="Unpublish (Convert to Draft)"
                            >
                              Draft
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(slide.id);
                              }}
                              className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition text-xs font-semibold"
                              title="Publish Live"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(slide.id);
                            }}
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Live Editorial Preview Frame (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#831843]" />
                Live Preview
              </h2>

              {/* Desktop vs Mobile Toggle */}
              <div className="flex items-center gap-1 bg-stone-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    previewMode === 'desktop'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    previewMode === 'mobile'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Preview Viewport Frame */}
            {selectedSlide ? (
              <div className="bg-stone-900 rounded-3xl p-4 shadow-xl border border-stone-800 space-y-3">
                <div
                  className={`relative overflow-hidden rounded-2xl bg-black text-white mx-auto transition-all ${
                    previewMode === 'desktop'
                      ? 'w-full aspect-[16/9]'
                      : 'w-[260px] aspect-[9/16]'
                  }`}
                >
                  {/* Background Image with Focal Position */}
                  <Image
                    src={
                      previewMode === 'mobile' && selectedSlide.mobileImage
                        ? selectedSlide.mobileImage
                        : selectedSlide.desktopImage
                    }
                    alt={selectedSlide.imageAlt}
                    fill
                    className="object-cover"
                    style={{
                      objectPosition:
                        previewMode === 'mobile'
                          ? selectedSlide.mobileImagePosition || '60% 20%'
                          : selectedSlide.desktopImagePosition || 'center 25%',
                    }}
                  />

                  {/* Gradient Masks */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent" />

                  {/* Editorial Text Overlay */}
                  <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end text-left space-y-2 z-10">
                    <span className="inline-block text-[9px] uppercase tracking-widest font-bold text-amber-300">
                      {selectedSlide.eyebrow}
                    </span>

                    <h3 className="font-serif text-lg sm:text-xl font-normal leading-tight text-white whitespace-pre-line">
                      {selectedSlide.title}
                    </h3>

                    <p className="text-[10px] sm:text-xs text-stone-300 line-clamp-2 leading-relaxed font-light">
                      {selectedSlide.description}
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-[#fdfbf7] text-[#141414] text-[9px] font-bold uppercase tracking-wider rounded-sm">
                        {selectedSlide.primaryCTA.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inspect Focal Details */}
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Desktop Focal:</span>
                    <strong className="text-stone-200 font-mono">{selectedSlide.desktopImagePosition || 'center 25%'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Mobile Focal:</span>
                    <strong className="text-stone-200 font-mono">{selectedSlide.mobileImagePosition || '60% 20%'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Destination URL:</span>
                    <strong className="text-amber-400 font-mono truncate max-w-[200px]">{selectedSlide.primaryCTA.href}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
                Select a slide to inspect live preview
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Slide Edit & Creation Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6">
            
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {editingSlide.id ? 'Edit Hero Slide Campaign' : 'Create New Hero Slide'}
                </h3>
                <p className="text-xs text-stone-500">
                  Campaign changes take effect immediately on the live WebGL canvas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-5 text-xs">
              
              {/* Row 1: Internal Name & Nav Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Internal Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.internalName || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, internalName: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none"
                    placeholder="e.g. Festive Kurti Edit Vol. 26"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Bottom Navigation Tab Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.navLabel || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, navLabel: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none"
                    placeholder="e.g. Festive Edit"
                  />
                </div>
              </div>

              {/* Row 2: Eyebrow & Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Eyebrow / Sub-tag *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.eyebrow || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none"
                    placeholder="e.g. THE FESTIVE EDIT • JAIPUR"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingSlide.status || 'PUBLISHED'}
                    onChange={(e) => setEditingSlide({ ...editingSlide, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none bg-white font-semibold"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live on Homepage)</option>
                    <option value="DRAFT">DRAFT (Admin Only)</option>
                    <option value="SCHEDULED">SCHEDULED (Date Controlled)</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Display Headline (Multi-line) */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Headline Title (Line breaks render as two-tier editorial text) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingSlide.title || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none font-serif text-sm"
                  placeholder="e.g. Made For&#10;Beautiful Moments."
                />
              </div>

              {/* Row 4: Description */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Supporting Editorial Copy *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingSlide.description || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none"
                  placeholder="Brief 1-2 sentence description of fabrics and silhouettes."
                />
              </div>

              {/* Row 5: Desktop & Mobile Media Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-700">Desktop Campaign Image (16:9 / 1920px+)</label>
                    <label className="text-[10px] text-[#831843] hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'desktopImage')}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    required
                    value={editingSlide.desktopImage || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, desktopImage: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none font-mono text-[11px]"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-stone-500">Desktop Focal Point:</span>
                    <input
                      type="text"
                      value={editingSlide.desktopImagePosition || 'center 25%'}
                      onChange={(e) => setEditingSlide({ ...editingSlide, desktopImagePosition: e.target.value })}
                      className="px-2 py-1 border border-stone-300 rounded text-[11px] font-mono w-32"
                      placeholder="center 25%"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-700">Mobile Image (Portrait / Optional)</label>
                    <label className="text-[10px] text-[#831843] hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'mobileImage')}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={editingSlide.mobileImage || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, mobileImage: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none font-mono text-[11px]"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-stone-500">Mobile Focal Point:</span>
                    <input
                      type="text"
                      value={editingSlide.mobileImagePosition || '60% 20%'}
                      onChange={(e) => setEditingSlide({ ...editingSlide, mobileImagePosition: e.target.value })}
                      className="px-2 py-1 border border-stone-300 rounded text-[11px] font-mono w-32"
                      placeholder="60% 20%"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: CTAs & Relational Category Linking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Primary CTA Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.primaryCtaLabel || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, primaryCtaLabel: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none"
                    placeholder="e.g. EXPLORE COLLECTION"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Primary CTA URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.primaryCtaUrl || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, primaryCtaUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none"
                    placeholder="e.g. /collections or /categories/daily-wear-pure-cotton-2-pc-sets"
                  />
                </div>
              </div>

              {/* Row 7: Link directly to real category */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Relational Category Link (Auto-populates destination)
                </label>
                <select
                  value={editingSlide.categoryId || ''}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const cat = categories.find((c) => c.id === catId);
                    setEditingSlide({
                      ...editingSlide,
                      categoryId: catId,
                      primaryCtaUrl: cat ? `/categories/${cat.slug}` : editingSlide.primaryCtaUrl,
                    });
                  }}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#831843] outline-none bg-white"
                >
                  <option value="">-- No Direct Category Binding --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow-md transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{editingSlide.id ? 'Save & Update Campaign' : 'Create Slide'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}