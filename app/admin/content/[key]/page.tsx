'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { AboutContent, ContactContent, defaultAbout, defaultContact, defaultHomeFeatures, HomeFeaturesContent } from '@/lib/site-content';

type PageKey = 'about' | 'contact' | 'homeFeatures';
type Content = AboutContent | ContactContent | HomeFeaturesContent;
const inputClass = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900';
const sectionClass = 'space-y-4 rounded-xl border border-stone-200 bg-white p-5';

export default function SiteContentEditor() {
  const params = useParams<{ key: string }>();
  const key = params.key as PageKey;
  const validKey = key === 'about' || key === 'contact' || key === 'homeFeatures';
  const [content, setContent] = useState<Content>(key === 'contact' ? defaultContact : key === 'homeFeatures' ? defaultHomeFeatures : defaultAbout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/public/site-content', { cache: 'no-store' });
    const json = await response.json();
    if (json.success && validKey) setContent({ ...(key === 'about' ? defaultAbout : key === 'contact' ? defaultContact : defaultHomeFeatures), ...json.data[key] } as Content);
    setLoading(false);
  }, [key, validKey]);
  useEffect(() => { void load(); }, [load]);

  const setField = (field: string, value: unknown) => setContent((old) => ({ ...old, [field]: value }));
  const save = async () => {
    setSaving(true); setNotice('');
    try {
      const response = await fetch(`/api/admin/site-content/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Could not save content');
      setNotice('Saved. The public page now uses this content.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not save content'); }
    finally { setSaving(false); }
  };
  const upload = async (file: File, field: string): Promise<string> => {
    const form = new FormData(); form.append('file', file); form.append('mediaType', 'SITE_CONTENT_IMAGE');
    const response = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.error?.message || 'Upload failed');
    if (!field.startsWith('__')) setField(field, json.data.publicUrl);
    return json.data.publicUrl as string;
  };

  if (!validKey) return <div className="p-8">Unknown page.</div>;
  const isAbout = key === 'about';
  const isHomeFeatures = key === 'homeFeatures';
  const c = content as AboutContent & ContactContent & HomeFeaturesContent;
  const text = (label: string, field: string, multiline = false, type = 'text') => <label className="block space-y-1 text-sm text-stone-600">{label}{multiline ? <textarea className={`${inputClass} min-h-24`} value={String((content as unknown as Record<string, unknown>)[field] ?? '')} onChange={(e) => setField(field, e.target.value)} /> : <input className={inputClass} type={type} value={String((content as unknown as Record<string, unknown>)[field] ?? '')} onChange={(e) => setField(field, e.target.value)} />}</label>;
  const image = (label: string, field: keyof AboutContent) => <div className="space-y-2"><label className="block space-y-1 text-sm text-stone-600">{label}<input className={inputClass} value={String(c[field] ?? '')} onChange={(e) => setField(field, e.target.value)} placeholder="Paste an image URL" /></label><label className="inline-flex cursor-pointer items-center rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700">Upload image<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file, field).catch((error) => setNotice(error.message)); }} /></label>{String(c[field] ?? '').startsWith('http') && <img src={String(c[field])} alt="Preview" className="h-28 w-40 rounded-lg object-cover" />}</div>;
  const list = (field: 'categories' | 'stats' | 'steps' | 'reasons' | 'faqs', entries: Record<string, string | number>[], names: string[], labels: string[]) => <div className="space-y-3">{entries.map((entry, index) => <div className="grid gap-3 rounded-lg bg-stone-50 p-4 md:grid-cols-2" key={index}>{names.map((name, i) => <label key={name} className="space-y-1 text-xs text-stone-500">{labels[i]}{field === 'categories' && name === 'image' ? <><input className={inputClass} value={String(entry[name] ?? '')} onChange={(e) => { const next = [...entries]; next[index] = { ...entry, [name]: e.target.value }; setField(field, next); }} /><input type="file" accept="image/*" className="mt-2 block text-xs" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file, `__${field}_${index}`).then(() => setContent((old) => ({ ...old, [field]: (old as AboutContent)[field].map((item, i) => i === index ? { ...item, image: String((old as unknown as Record<string, unknown>)[`__${field}_${index}`] ?? item.image) } : item) }))).catch((error) => setNotice(error.message)); }} /></> : <input className={inputClass} type={name === 'value' ? 'number' : 'text'} value={String(entry[name] ?? '')} onChange={(e) => { const next = [...entries]; next[index] = { ...entry, [name]: name === 'value' ? Number(e.target.value) : e.target.value }; setField(field, next); }} />}</label>)}<button type="button" className="text-left text-xs text-rose-700" onClick={() => setField(field, entries.filter((_, i) => i !== index))}>Remove</button></div>)}<button type="button" className="rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-700" onClick={() => setField(field, [...entries, Object.fromEntries(names.map((name) => [name, name === 'value' ? 0 : '']))])}>+ Add item</button></div>;

  return <div className="flex h-screen max-h-screen overflow-hidden bg-stone-100"><AdminSidebar activeTab="Content"/><main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-5 md:p-8"><div className="mx-auto max-w-5xl space-y-6"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Site content</p><h1 className="mt-1 text-3xl font-semibold text-stone-900">{isAbout ? 'About page' : key === 'contact' ? 'Contact page' : 'Home feature cards'}</h1><p className="mt-2 text-sm text-stone-600">Edit the content shown on the public {isHomeFeatures ? 'home page feature section' : `/${key} page`}. Changes preserve its current design.</p></div><button disabled={saving || loading} onClick={() => void save()} className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button></header>
  {notice && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{notice}</div>}{loading ? <div>Loading…</div> : isHomeFeatures ? <section className={sectionClass}><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-stone-900">Home page feature cards</h2><span className="text-xs text-stone-500">{c.cards.length}/4 cards</span></div>{text('Section heading','title')}{c.cards.map((card,index)=><div key={index} className="grid gap-3 rounded-lg bg-stone-50 p-4"><label className="space-y-1 text-xs text-stone-500">Card icon<select className={inputClass} value={card.icon} onChange={(e)=>setField('cards',c.cards.map((item,i)=>i===index?{...item,icon:e.target.value}:item))}><option>Scissors</option><option>Building2</option><option>Lock</option></select></label><label className="space-y-1 text-xs text-stone-500">Card title<input className={inputClass} value={card.title} onChange={(e)=>setField('cards',c.cards.map((item,i)=>i===index?{...item,title:e.target.value}:item))}/></label><label className="space-y-1 text-xs text-stone-500">Card text<textarea className={`${inputClass} min-h-24`} value={card.body} onChange={(e)=>setField('cards',c.cards.map((item,i)=>i===index?{...item,body:e.target.value}:item))}/></label><button type="button" className="text-left text-xs text-rose-700" onClick={()=>setField('cards',c.cards.filter((_,i)=>i!==index))}>Delete card</button></div>)}<button type="button" disabled={c.cards.length >= 4} className="rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={()=>{if(c.cards.length < 4) setField('cards',[...c.cards,{icon:'Scissors',title:'',body:''}]);}}>+ Add card</button>{c.cards.length >= 4 && <p className="text-xs text-stone-500">You’ve reached the maximum of 4 cards.</p>}</section> : isAbout ? <>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Hero section</h2>{text('Trust badge','heroBadge')}{text('Main heading','heroTitle')}{text('Introductory text','heroBody',true)}<div className="grid gap-4 md:grid-cols-2">{image('Hero image','heroImage')}{text('Hero image description','heroImageAlt')}</div><div className="grid gap-4 md:grid-cols-2">{text('Primary button label','heroPrimaryLabel')}{text('Primary button link','heroPrimaryUrl')}{text('WhatsApp button label','whatsappLabel')}{text('WhatsApp link','whatsappUrl')}{text('Dispatch metric','dispatchValue')}{text('Metric caption','dispatchLabel')}</div></section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Our story</h2>{text('Section heading','storyTitle')}{text('Story text','storyBody',true)}<div className="grid gap-4 md:grid-cols-2">{image('Story image','storyImage')}{text('Story image description','storyImageAlt')}</div></section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Categories on the floor</h2>{text('Section heading','categoriesTitle')}{c.categories.map((category, index) => <div key={index} className="grid gap-3 rounded-lg bg-stone-50 p-4 md:grid-cols-2"><label className="space-y-1 text-xs text-stone-500">Label<input className={inputClass} value={category.label} onChange={(e) => setField('categories', c.categories.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} /></label><label className="space-y-1 text-xs text-stone-500">Alt text<input className={inputClass} value={category.alt} onChange={(e) => setField('categories', c.categories.map((item, i) => i === index ? { ...item, alt: e.target.value } : item))} /></label><label className="space-y-1 text-xs text-stone-500">Image URL<input className={inputClass} value={category.image} onChange={(e) => setField('categories', c.categories.map((item, i) => i === index ? { ...item, image: e.target.value } : item))} /></label><label className="space-y-1 text-xs text-stone-500">Upload image<input type="file" accept="image/*" className="mt-2 block" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file, '__category').then((url) => setField('categories', c.categories.map((item, i) => i === index ? { ...item, image: url } : item))).catch((error) => setNotice(error.message)); }} /></label><button type="button" className="text-left text-xs text-rose-700" onClick={() => setField('categories', c.categories.filter((_, i) => i !== index))}>Remove category</button></div>)}<button type="button" className="rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-700" onClick={() => setField('categories', [...c.categories, { label: '', image: '', alt: '' }])}>+ Add category</button></section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Retailer statistics</h2>{list('stats',c.stats as unknown as Record<string,string|number>[],['value','suffix','label'],['Number','Suffix','Caption'])}</section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">How ordering works</h2>{text('Section heading','stepsTitle')}{list('steps',c.steps as unknown as Record<string,string|number>[],['title','body'],['Step title','Description'])}</section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Why retailers return</h2>{text('Section heading','reasonsTitle')}{list('reasons',c.reasons as unknown as Record<string,string|number>[],['title','body'],['Reason title','Description'])}</section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Visit call to action</h2>{text('Section heading','ctaTitle')}{text('Description','ctaBody',true)}<div className="grid gap-4 md:grid-cols-2">{image('CTA image','ctaImage')}{text('Image description','ctaImageAlt')}</div>{text('Catalog email','catalogEmail',false,'email')}</section>
  </> : <>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Contact introduction</h2>{text('Eyebrow','eyebrow')}{text('Heading','title')}{text('Description','intro',true)}</section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Showroom details</h2>{text('Block title','showroomTitle')}{text('Address','address',true)}{text('Directions link label','directionsLabel')}{text('Directions URL','directionsUrl')}</section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Phone and WhatsApp</h2>{text('Block title','phoneTitle')}{text('Display phone','phone')}{text('WhatsApp number, country code included','whatsapp')}{text('WhatsApp link label','whatsappLabel')}</section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Opening hours</h2>{text('Block title','hoursTitle')}{text('Hours','hours')}{text('Closed note','closed')}</section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Frequently asked questions</h2>{text('Section heading','faqTitle')}{list('faqs',c.faqs as unknown as Record<string,string|number>[],['question','answer'],['Question','Answer'])}</section>
    <section className={sectionClass}><h2 className="font-semibold text-stone-900">Enquiry form panel</h2>{text('Heading','formTitle')}{text('Description','formIntro',true)}{text('Submit button label','submitLabel')}{text('Note under form','formNote',true)}</section>
  </>}
  <div className="flex justify-end pb-10"><button disabled={saving} onClick={() => void save()} className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button></div></div></main></div>;
}
