'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Camera, Image as ImageIcon, CheckCircle2, Loader2, AlertTriangle, XCircle } from 'lucide-react';

type SessionState = 'loading' | 'pending' | 'finishing' | 'uploaded' | 'expired' | 'error';
type FileStatus = 'queued' | 'uploading' | 'done' | 'failed';

interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: FileStatus;
  error?: string;
}

const MAX_CONCURRENT_UPLOADS = 3;

export default function MobileUploadPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<SessionState>('loading');
  const [vendorName, setVendorName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [uploadedCountOnLoad, setUploadedCountOnLoad] = useState(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/public/upload-session/${token}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setState('error');
          setErrorMessage(json.error || 'This link is invalid.');
          return;
        }
        setVendorName(json.data.vendorName || '');
        if (json.data.status === 'uploaded') {
          setState('uploaded');
          setUploadedCountOnLoad(json.data.photoCount || 0);
        } else if (json.data.status === 'expired') {
          setState('expired');
        } else {
          setState('pending');
        }
      })
      .catch(() => {
        setState('error');
        setErrorMessage('Could not reach the server. Check your connection and reload.');
      });
  }, [token]);

  const handleFilesChosen = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: QueuedFile[] = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued',
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setErrorMessage('');
    uploadBatch(newFiles);
  };

  const uploadSingleFile = async (item: QueuedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', error: undefined } : f))
    );

    try {
      const formData = new FormData();
      formData.append('file', item.file);

      const res = await fetch(`/api/public/upload-session/${token}`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'done' } : f))
        );
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'failed', error: json.error || 'Upload failed.' }
              : f
          )
        );
      }
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'failed', error: 'Network error.' } : f
        )
      );
    }
  };

  const uploadBatch = async (batch: QueuedFile[]) => {
    setIsUploadingBatch(true);

    let index = 0;
    const workers = Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, batch.length) }).map(
      async () => {
        while (index < batch.length) {
          const item = batch[index];
          index += 1;
          await uploadSingleFile(item);
        }
      }
    );

    await Promise.all(workers);
    setIsUploadingBatch(false);
  };

  const retryFailed = () => {
    const failed = files.filter((f) => f.status === 'failed');
    if (failed.length === 0) return;
    uploadBatch(failed);
  };

  const doneCount = files.filter((f) => f.status === 'done').length;
  const failedCount = files.filter((f) => f.status === 'failed').length;
  const hasFailed = failedCount > 0;
  const allDone = files.length > 0 && doneCount === files.length;

  // User explicitly finishes the session. This calls PATCH on the server,
  // which is the only thing that actually flips the session's DB status
  // to "uploaded" — local state alone would never be seen by the desktop side.
  const handleFinish = async () => {
    if (!allDone || isUploadingBatch) return;

    setState('finishing');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/public/upload-session/${token}`, {
        method: 'PATCH',
      });
      const json = await res.json();

      if (json.success) {
        setState('uploaded');
      } else {
        setState('pending');
        setErrorMessage(json.error || 'Could not finish this session. Please try again.');
      }
    } catch {
      setState('pending');
      setErrorMessage('Network error — please try again.');
    }
  };

  const isBusy = isUploadingBatch || state === 'finishing';

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/iccha-logo-dark.png"
          alt="Iccha - The Women's Label"
          className="h-32 w-auto mx-auto mb-6"
        />

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-stone-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Loading upload link&hellip;</p>
          </div>
        )}

        {(state === 'pending' || state === 'finishing') && (
          <>
            <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">
              Upload product photos
            </h1>
            {vendorName && (
              <p className="text-sm text-stone-500 mb-8">for {vendorName}</p>
            )}

            {files.length > 0 && (
              <div className="mb-6 grid grid-cols-3 gap-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.previewUrl}
                      alt="Selected preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      {f.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      )}
                      {f.status === 'done' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                      {f.status === 'failed' && (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      {f.status === 'queued' && (
                        <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {files.length > 0 && (
              <p className="text-xs text-stone-500 mb-4">
                {doneCount} of {files.length} uploaded
                {isUploadingBatch ? '…' : ''}
              </p>
            )}

            {!isBusy && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-[#1a1a1a] text-white font-bold uppercase text-xs tracking-[0.15em] rounded-xl shadow"
                >
                  <Camera className="w-4 h-4" />
                  Take a photo
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-stone-300 text-stone-800 font-bold uppercase text-xs tracking-[0.15em] rounded-xl"
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose photos from gallery
                </button>
              </div>
            )}

            {hasFailed && !isBusy && (
              <button
                onClick={retryFailed}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 border border-red-300 text-red-700 font-bold uppercase text-xs tracking-[0.15em] rounded-xl"
              >
                Retry {failedCount} failed upload{failedCount > 1 ? 's' : ''}
              </button>
            )}

            {allDone && !isUploadingBatch && (
              <button
                onClick={handleFinish}
                disabled={state === 'finishing'}
                className="mt-3 w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 text-white font-bold uppercase text-xs tracking-[0.15em] rounded-xl shadow disabled:opacity-70"
              >
                {state === 'finishing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finishing&hellip;
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Done — Finish Upload
                  </>
                )}
              </button>
            )}

            {errorMessage && (
              <p className="mt-4 text-xs text-red-600 font-medium">{errorMessage}</p>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFilesChosen(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesChosen(e.target.files);
                e.target.value = '';
              }}
            />
          </>
        )}

        {state === 'uploaded' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              {(files.length || uploadedCountOnLoad) > 1 ? 'Photos uploaded!' : 'Photo uploaded!'}
            </h1>
            <p className="text-sm text-stone-500 max-w-xs">
              You&apos;re all set. Go back to your computer and refresh the product form to see{' '}
              {(files.length || uploadedCountOnLoad) > 1 ? 'them' : 'it'} filled in automatically.
            </p>
          </div>
        )}

        {state === 'expired' && (
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
            <h1 className="font-serif text-2xl font-bold text-stone-900">This link expired</h1>
            <p className="text-sm text-stone-500 max-w-xs">
              QR codes are only valid for a few minutes. Please go back to the computer and
              generate a new one.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <h1 className="font-serif text-2xl font-bold text-stone-900">Something went wrong</h1>
            <p className="text-sm text-stone-500 max-w-xs">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}