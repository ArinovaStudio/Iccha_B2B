'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Layers,
  Pause,
  Play
} from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';
import { HeroSlide, HeroSliderConfig } from '@/lib/types/hero';
import { HERO_SLIDER_CONFIG } from '@/lib/data/heroData';

// GLSL Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// GLSL Fragment Shader: Liquid Glass Refraction Transition with Chromatic Dispersion
const fragmentShader = `
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTexture1Res;
  uniform vec2 uTexture2Res;
  uniform float uIntensity;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uZoom;

  varying vec2 vUv;

  vec2 getCoverUV(vec2 uv, vec2 canvasRes, vec2 imgRes) {
    float canvasAspect = canvasRes.x / canvasRes.y;
    float imgAspect = imgRes.x / imgRes.y;
    vec2 s = vec2(1.0);
    if (canvasAspect > imgAspect) {
      s = vec2(1.0, imgAspect / canvasAspect);
    } else {
      s = vec2(canvasAspect / imgAspect, 1.0);
    }
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv1 = getCoverUV(vUv, uResolution, uTexture1Res);
    vec2 uv2 = getCoverUV(vUv, uResolution, uTexture2Res);

    // Subtle zoom & mouse parallax
    vec2 mouseOffset = (uMouse - 0.5) * 0.015;
    uv1 = (uv1 - 0.5) * uZoom + 0.5 + mouseOffset;
    uv2 = (uv2 - 0.5) * uZoom + 0.5 + mouseOffset;

    float p = uProgress;

    // Fluid liquid ripple wave along the transition wipe
    float wave = sin(vUv.y * 8.0 + uTime * 1.5) * cos(vUv.x * 8.0 + uTime * 1.5);
    float waveDistort = wave * 0.02 * sin(p * 3.14159265);

    // Glass refraction displacement
    float distortion = sin(p * 3.14159265) * uIntensity;
    vec2 dir = vec2(0.5, 0.5) - vUv;

    vec2 uvDistorted1 = uv1 + (dir * distortion * (1.0 - p) + vec2(waveDistort));
    vec2 uvDistorted2 = uv2 - (dir * distortion * p + vec2(waveDistort));

    // Controlled chromatic dispersion during mid-wipe
    float dispersion = distortion * 0.03;

    vec4 tex1_r = texture2D(uTexture1, uvDistorted1 + vec2(dispersion, 0.0));
    vec4 tex1_g = texture2D(uTexture1, uvDistorted1);
    vec4 tex1_b = texture2D(uTexture1, uvDistorted1 - vec2(dispersion, 0.0));
    vec4 color1 = vec4(tex1_r.r, tex1_g.g, tex1_b.b, 1.0);

    vec4 tex2_r = texture2D(uTexture2, uvDistorted2 - vec2(dispersion, 0.0));
    vec4 tex2_g = texture2D(uTexture2, uvDistorted2);
    vec4 tex2_b = texture2D(uTexture2, uvDistorted2 + vec2(dispersion, 0.0));
    vec4 color2 = vec4(tex2_r.r, tex2_g.g, tex2_b.b, 1.0);

    // Smoothstep blend to guarantee 100% crisp pure frame at p=0 and p=1
    float blend = smoothstep(0.0, 1.0, p);
    gl_FragColor = mix(color1, color2, blend);
  }
`;

interface WebGLHeroSliderProps {
  slides: HeroSlide[];
  config?: HeroSliderConfig;
}

export default function WebGLHeroSlider({
  slides,
  config = HERO_SLIDER_CONFIG,
}: WebGLHeroSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Text Animation Refs
  const textWrapperRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleLine1Ref = useRef<HTMLSpanElement>(null);
  const titleLine2Ref = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaWrapRef = useRef<HTMLDivElement>(null);
  const tagsWrapRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  // Three.js State Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const texturesMapRef = useRef<Map<number, THREE.Texture>>(new Map());
  const reqIdRef = useRef<number | null>(null);
  const progressTweenRef = useRef<gsap.core.Tween | null>(null);
  const zoomTweenRef = useRef<gsap.core.Tween | null>(null);
  const autoSlideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimationRef = useRef<gsap.core.Tween | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Touch handling
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  console.log();
  

  const currentSlide = slides[currentIndex] || slides[0] || null;
  if (!currentSlide) {
  return (
    <section
      id="hero-slider-container"
      className="relative flex min-h-[60svh] w-full items-center justify-center overflow-hidden bg-[#141414] text-white"
      aria-label="Hero banner"
    >
      <div className="px-6 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">
          ICCHASTORE
        </p>

        <h1 className="text-3xl font-medium md:text-5xl">
          Discover Our Collection
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/60 md:text-base">
          Our latest collection will appear here soon.
        </p>
      </div>
    </section>
  );
}
  // Animate Typography on Slide Change
  const animateTextIn = useCallback(() => {
    if (!textWrapperRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Reset initial positions
    gsap.set([eyebrowRef.current, descRef.current, ctaWrapRef.current, tagsWrapRef.current], {
      opacity: 0,
      y: 18,
    });

    gsap.set([titleLine1Ref.current, titleLine2Ref.current], {
      opacity: 0,
      y: 36,
      rotateX: 10,
    });

    tl.to(eyebrowRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      delay: 0.2,
    })
      .to(
        [titleLine1Ref.current, titleLine2Ref.current],
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.85,
          stagger: 0.12,
        },
        '-=0.5'
      )
      .to(
        descRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
        },
        '-=0.5'
      )
      .to(
        [ctaWrapRef.current, tagsWrapRef.current],
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
        },
        '-=0.4'
      );
  }, []);

  // Texture loader helper
  const loadTexture = useCallback((url: string): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = 'anonymous';
      loader.load(
        url,
        (tex) => {
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          resolve(tex);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }, []);

  // WebGL Slide Transition
  const goToSlide = useCallback(
    async (nextIndex: number) => {
      if (nextIndex === currentIndex || isTransitioning || slides.length === 0) return;

      setIsTransitioning(true);

      const mat = materialRef.current;
      const texMap = texturesMapRef.current;

      // Ensure next texture is loaded
      let nextTexture = texMap.get(nextIndex);
      if (!nextTexture) {
        try {
          nextTexture = await loadTexture(slides[nextIndex].desktopImage);
          texMap.set(nextIndex, nextTexture);
        } catch (err) {
          console.warn('Failed to load next texture, falling back', err);
        }
      }

      if (mat && nextTexture) {
        const currentTexture = texMap.get(currentIndex);
        if (currentTexture) {
          const currImg = currentTexture.image as HTMLImageElement | undefined;
          mat.uniforms.uTexture1.value = currentTexture;
          mat.uniforms.uTexture1Res.value.set(
            currImg?.naturalWidth || currImg?.width || 1920,
            currImg?.naturalHeight || currImg?.height || 1080
          );
        }

        const nextImg = nextTexture.image as HTMLImageElement | undefined;
        mat.uniforms.uTexture2.value = nextTexture;
        mat.uniforms.uTexture2Res.value.set(
          nextImg?.naturalWidth || nextImg?.width || 1920,
          nextImg?.naturalHeight || nextImg?.height || 1080
        );

        mat.uniforms.uProgress.value = 0.0;

        // Reset subtle zoom
        if (zoomTweenRef.current) zoomTweenRef.current.kill();
        mat.uniforms.uZoom.value = 1.0;

        // Animate shader uProgress from 0 to 1
        if (progressTweenRef.current) progressTweenRef.current.kill();
        progressTweenRef.current = gsap.to(mat.uniforms.uProgress, {
          value: 1.0,
          duration: config.transitionDuration,
          ease: 'power2.inOut',
          onComplete: () => {
            mat.uniforms.uTexture1.value = nextTexture;
            mat.uniforms.uProgress.value = 0.0;
            setIsTransitioning(false);
            setCurrentIndex(nextIndex);

            // Trigger subtle slow zoom resting animation (1.00 -> 1.025)
            if (config.enableSubtleZoom) {
              zoomTweenRef.current = gsap.to(mat.uniforms.uZoom, {
                value: 0.975, // in UV space, < 1.0 means zoomed in
                duration: config.autoSlideInterval / 1000,
                ease: 'sine.out',
              });
            }
          },
        });

        // Trigger typography entry animation
        animateTextIn();
      } else {
        // Fallback without shader
        setCurrentIndex(nextIndex);
        setIsTransitioning(false);
        animateTextIn();
      }
    },
    [currentIndex, isTransitioning, slides, config, loadTexture, animateTextIn]
  );

  const nextSlide = useCallback(() => {
    const nextIdx = (currentIndex + 1) % slides.length;
    goToSlide(nextIdx);
  }, [currentIndex, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    const prevIdx = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(prevIdx);
  }, [currentIndex, slides.length, goToSlide]);

  // Three.js Canvas Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isCancelled = false;

    try {
      // Test WebGL context
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        queueMicrotask(() => {
          if (!isCancelled) setWebGLSupported(false);
        });
        return;
      }

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      // Scene & Camera
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      // Dummy initial texture
      const initialTex = new THREE.Texture();

      // Shader Material
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture1: { value: initialTex },
          uTexture2: { value: initialTex },
          uProgress: { value: 0.0 },
          uResolution: { value: new THREE.Vector2(width, height) },
          uTexture1Res: { value: new THREE.Vector2(1920, 1080) },
          uTexture2Res: { value: new THREE.Vector2(1920, 1080) },
          uIntensity: { value: config.distortionIntensity },
          uTime: { value: 0.0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uZoom: { value: 1.0 },
        },
      });
      materialRef.current = material;

      const geometry = new THREE.PlaneGeometry(2, 2);
      const quad = new THREE.Mesh(geometry, material);
      scene.add(quad);

      // Render Loop
      let clock = new THREE.Clock();
      const render = () => {
        reqIdRef.current = requestAnimationFrame(render);
        if (materialRef.current) {
          materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
        renderer.render(scene, camera);
      };
      render();

      // Load First 2 Textures
      const loadInitial = async () => {
        try {
          const firstTex = await loadTexture(slides[0].desktopImage);
          if (isCancelled) return;

          texturesMapRef.current.set(0, firstTex);
          const firstImg = firstTex.image as HTMLImageElement | undefined;
          material.uniforms.uTexture1.value = firstTex;
          material.uniforms.uTexture1Res.value.set(
            firstImg?.naturalWidth || firstImg?.width || 1920,
            firstImg?.naturalHeight || firstImg?.height || 1080
          );
          if (!isCancelled) {
            setTexturesLoaded(true);
            animateTextIn();
          }

          // Prefetch remaining textures quietly
          slides.forEach(async (slide, idx) => {
            if (idx === 0) return;
            try {
              const tex = await loadTexture(slide.desktopImage);
              if (!isCancelled) {
                texturesMapRef.current.set(idx, tex);
              }
            } catch (e) {
              console.warn(`Failed prefetching texture ${idx}`, e);
            }
          });
        } catch (e) {
          console.warn('WebGL texture loading error, falling back', e);
          if (!isCancelled) setWebGLSupported(false);
        }
      };

      loadInitial();

      // Resize Observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0 && rendererRef.current && materialRef.current) {
            rendererRef.current.setSize(w, h);
            materialRef.current.uniforms.uResolution.value.set(w, h);
          }
        }
      });
      resizeObserver.observe(container);

      // Cleanup
      return () => {
        isCancelled = true;
        resizeObserver.disconnect();
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    } catch (err) {
      console.warn('Error setting up WebGL slider:', err);
      queueMicrotask(() => {
        if (!isCancelled) setWebGLSupported(false);
      });
    }
  }, [slides, config, loadTexture, animateTextIn]);

  // Subtle Mouse Parallax on Desktop
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!config.enableMouseParallax || !materialRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      gsap.to(materialRef.current.uniforms.uMouse.value, {
        x: THREE.MathUtils.lerp(materialRef.current.uniforms.uMouse.value.x, x, 0.1),
        y: THREE.MathUtils.lerp(materialRef.current.uniforms.uMouse.value.y, y, 0.1),
        duration: 0.5,
        ease: 'power1.out',
      });
    },
    [config.enableMouseParallax]
  );

  // Auto-Slide Timer & Bottom Progress Bar Animation
  useEffect(() => {
    if (isPaused || isTransitioning || slides.length <= 1) return;

    // Animate active progress bar
    if (progressBarRef.current) {
      gsap.fromTo(
        progressBarRef.current,
        { width: '0%' },
        {
          width: '100%',
          duration: config.autoSlideInterval / 1000,
          ease: 'none',
        }
      );
    }

    autoSlideTimeoutRef.current = setTimeout(() => {
      nextSlide();
    }, config.autoSlideInterval);

    return () => {
      if (autoSlideTimeoutRef.current) clearTimeout(autoSlideTimeoutRef.current);
    };
  }, [currentIndex, isPaused, isTransitioning, nextSlide, config.autoSlideInterval, slides.length]);

  // Visibility & Reduced Motion Handlers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const delta = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Split title into lines for editorial rendering
  const titleLines = currentSlide.title.split('\n');

  return (
    <div
      ref={containerRef}
      id="hero-slider-container"
      className="relative w-full h-[92svh] md:h-screen bg-[#141414] text-white overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="IcchaStore Women's Kurta Collections Showcase"
    >
      {/* 1. WebGL Canvas */}
      {webGLSupported ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
      ) : (
        /* CSS Fallback Image in case WebGL is disabled */
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={currentSlide.desktopImage}
            alt={currentSlide.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-opacity duration-1000"
            style={{ objectPosition: currentSlide.desktopImagePosition || 'center 20%' }}
          />
        </div>
      )}

      {/* Fallback placeholder while first texture loads */}
      {!texturesLoaded && webGLSupported && (
        <div className="absolute inset-0 z-0 bg-[#161413]">
          <Image
            src={slides[0].desktopImage}
            alt={slides[0].imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
            style={{ objectPosition: slides[0].desktopImagePosition || 'center 20%' }}
          />
        </div>
      )}

      {/* 2. Editorial Localized Vignette & Gradients (Protects garment textile color in center/right) */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black/85 via-black/45 to-transparent md:w-[65%] lg:w-[50%]"
        aria-hidden="true" 
      />
      <div 
        className="absolute inset-x-0 bottom-0 h-48 z-10 pointer-events-none bg-gradient-to-t from-black/90 via-black/40 to-transparent"
        aria-hidden="true" 
      />
      <div 
        className="absolute inset-x-0 top-0 h-28 z-10 pointer-events-none bg-gradient-to-b from-black/60 to-transparent"
        aria-hidden="true" 
      />

      {/* 3. Top Subtle Editorial Archive Watermark */}
      <div className="absolute top-24 right-6 sm:right-12 z-20 hidden lg:flex items-center gap-3 pointer-events-none">
        {/* <span className="text-[10px] uppercase font-bold tracking-[0.35em] text-white/50 bg-black/30 backdrop-blur-md px-3 py-1.5 border border-white/10 rounded-sm">
          {currentSlide.editorialBadge || 'Contemporary Ethnicwear Archive'}
        </span> */}
        <div className="h-4 w-[1px] bg-white/20" />
        <span className="text-[11px] font-mono tracking-widest text-amber-300 font-bold">
          {currentSlide.slideNumber} / {String(slides.length).padStart(2, '0')}
        </span>
      </div>

      {/* 4. Main Editorial Content Overlay */}
      <div 
        ref={textWrapperRef}
        className="relative z-20 h-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col justify-end pb-32 md:pb-28"
      >
        <div className="max-w-xl lg:max-w-2xl space-y-4 md:space-y-6 text-left">
          
          {/* Eyebrow / Category Label */}
          <div ref={eyebrowRef} className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-bold rounded-sm backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {currentSlide.eyebrow}
            </span>
          </div>

          {/* Editorial Display Headline (Responsive clamp 42-100px) */}
          <h1 className="font-serif text-[42px] sm:text-6xl md:text-7xl lg:text-[80px] font-normal tracking-tight text-[#fdfbf7] leading-[0.96] overflow-hidden">
            <span ref={titleLine1Ref} className="block transform will-change-transform">
              {titleLines[0]}
            </span>
            {titleLines[1] && (
              <span 
                ref={titleLine2Ref} 
                className="block italic font-light text-amber-100/90 transform will-change-transform mt-0.5"
              >
                {titleLines[1]}
              </span>
            )}
          </h1>

          {/* Supporting Copy */}
          <p 
            ref={descRef} 
            className="text-stone-300 text-sm sm:text-base lg:text-lg max-w-lg leading-relaxed font-light drop-shadow-sm"
          >
            {currentSlide.description}
          </p>

          {/* Fabric / Craft Tags */}
          {currentSlide.fabricTags && (
            <div ref={tagsWrapRef} className="flex flex-wrap gap-2 pt-1">
              {currentSlide.fabricTags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-300 bg-white/10 backdrop-blur-md px-2.5 py-1 border border-white/15 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action CTAs */}
          <div ref={ctaWrapRef} className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={currentSlide.primaryCTA.href}
              className="group relative inline-flex items-center gap-3 px-7 py-4 bg-[#fdfbf7] text-[#141414] hover:bg-amber-300 text-[11px] font-bold uppercase tracking-[0.25em] rounded-sm transition-all duration-300 shadow-xl"
            >
              <span>{currentSlide.primaryCTA.label}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300 text-stone-900" />
            </Link>

            {currentSlide.secondaryCTA && (
              <Link
                href={currentSlide.secondaryCTA.href}
                className="inline-flex items-center gap-2 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7] hover:text-amber-300 transition border-b border-white/30 hover:border-amber-300"
              >
                <span>{currentSlide.secondaryCTA.label}</span>
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* 5. Desktop Horizontal Slide Navigation (01 New Arrivals, 02 Printed, etc.) */}
      <div className="absolute bottom-6 left-0 right-0 z-30 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-5 gap-4 lg:gap-8 pt-4 border-t border-white/15">
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`text-left group transition-all duration-300 focus:outline-none ${
                    isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}: ${slide.navLabel}`}
                  aria-current={isActive ? 'true' : 'false'}
                >
                  {/* Progress Line */}
                  <div className="h-[2px] w-full bg-white/20 mb-2.5 overflow-hidden relative">
                    {isActive && (
                      <div
                        ref={progressBarRef}
                        className="absolute inset-y-0 left-0 bg-amber-400 w-full"
                      />
                    )}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-amber-300 font-bold">
                      {slide.slideNumber}
                    </span>
                    <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-white group-hover:text-amber-200 transition">
                      {slide.navLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Mobile Compact Bottom Controller & Swipe Indicator */}
      <div className="absolute bottom-6 left-6 right-6 z-30 flex md:hidden items-center justify-between">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3.5 py-1.5 border border-white/15 rounded-full">
          <span className="text-xs font-mono font-bold text-amber-300">
            {currentSlide.slideNumber} / {String(slides.length).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-stone-300 font-medium">
            {currentSlide.navLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            disabled={isTransitioning}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black transition active:scale-95 disabled:opacity-50"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            disabled={isTransitioning}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black transition active:scale-95 disabled:opacity-50"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7. Side Arrow Triggers (Desktop) */}
      <div className="absolute right-8 bottom-28 z-30 hidden lg:flex items-center gap-2">
        <button
          type="button"
          onClick={prevSlide}
          disabled={isTransitioning}
          className="w-11 h-11 rounded-sm bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition active:scale-95 disabled:opacity-50 group"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          disabled={isTransitioning}
          className="w-11 h-11 rounded-sm bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition active:scale-95 disabled:opacity-50 group"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Pause/Play status indicator for accessibility */}
      {/* <button
        type="button"
        onClick={() => setIsPaused(!isPaused)}
        className="absolute top-24 left-6 sm:left-12 z-20 text-[10px] uppercase font-bold tracking-wider text-white/50 hover:text-white flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-sm border border-white/10 transition"
        aria-label={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
      >
        {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3 text-white/70" />}
        <span className="hidden sm:inline">{isPaused ? 'Paused' : 'Auto'}</span>
      </button> */}

    </div>
  );
}
