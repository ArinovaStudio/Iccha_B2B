'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  parseColors,
  serializeColors,
  nearestColorName,
  NAMED_COLORS,
  type ProductColor,
} from '@/lib/product-colors';

interface MultiColorInputProps {
  /** Stored comma-separated colour string (see lib/product-colors.ts). */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function MultiColorInput({ value, onChange, required }: MultiColorInputProps) {
  const colors = parseColors(value);
  const [hex, setHex] = useState('#800000');
  const [name, setName] = useState(() => nearestColorName('#800000'));
  // Once the user types their own name we stop overwriting it when they move the picker.
  const [nameEdited, setNameEdited] = useState(false);

  const commit = (next: ProductColor[]) => onChange(serializeColors(next));

  const pushColor = (entry: ProductColor) => {
    const exists = colors.some(
      c => c.name.toLowerCase() === entry.name.toLowerCase() && (c.hex || '') === (entry.hex || '')
    );
    if (!exists) commit([...colors, entry]);
  };

  const addColor = () => {
    const finalName = name.trim() || nearestColorName(hex);
    pushColor({ name: finalName, hex });
    setNameEdited(false);
    setName(nearestColorName(hex));
  };

  const handlePick = (value: string) => {
    setHex(value);
    if (!nameEdited) setName(nearestColorName(value));
  };

  const removeColor = (index: number) => commit(colors.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <span
              key={`${c.name}-${c.hex}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white py-1 pl-1.5 pr-1 text-xs font-semibold text-stone-800"
            >
              <span
                className="h-4 w-4 rounded-full border border-stone-300"
                style={{ backgroundColor: c.hex || 'transparent' }}
                title={c.hex || 'No swatch'}
              />
              {c.name}
              <button
                type="button"
                onClick={() => removeColor(i)}
                aria-label={`Remove ${c.name}`}
                className="grid h-4 w-4 place-items-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-stone-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
        Add a custom colour — pick any shade, then name it
      </p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={e => handlePick(e.target.value)}
          aria-label="Pick a colour"
          className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-stone-300 bg-stone-50 p-1"
        />
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setNameEdited(true); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
          placeholder="Name this colour (auto-filled, type your own to change)"
          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
        />
        <button
          type="button"
          onClick={addColor}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-rose-900 px-3 py-2 text-xs font-bold text-white hover:bg-rose-800"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">Or tap a common colour</p>
        <div className="flex flex-wrap gap-1.5">
          {NAMED_COLORS.map(c => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onClick={() => pushColor({ name: c.name, hex: c.hex })}
              className="h-6 w-6 rounded-full border border-stone-300 transition hover:scale-110"
              style={{ backgroundColor: c.hex }}
              aria-label={`Add ${c.name}`}
            />
          ))}
        </div>
      </div>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="sr-only"
        />
      )}
    </div>
  );
}