'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, readAsDataURL, useCopyState } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, TextStatLine } from '@/tools/_shared/text-tool-kit';

async function scanQrFromImageSource(source) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = source.videoWidth || source.naturalWidth || source.width;
  canvas.height = source.videoHeight || source.naturalHeight || source.height;
  if (!context || !canvas.width || !canvas.height) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(imageData.data, imageData.width, imageData.height);
}

export default function QrCodeReader() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const [mode, setMode] = useState('upload');
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [copied, copy] = useCopyState();

  const stopCamera = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => stopCamera(), []);

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    stopCamera();
    setMode('upload');
    setError(null);
    setResult('');

    try {
      const dataUrl = await readAsDataURL(file);
      setPreviewUrl(dataUrl);
      const image = new Image();
      image.src = dataUrl;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      const code = await scanQrFromImageSource(image);
      if (!code) {
        setError('No QR code was found in the uploaded image.');
        return;
      }
      setResult(code.data);
    } catch {
      setError('The uploaded image could not be scanned.');
    }
  };

  const startCamera = async () => {
    stopCamera();
    setMode('camera');
    setPreviewUrl('');
    setError(null);
    setResult('');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not available in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      const scanFrame = async () => {
        if (!videoRef.current) return;
        const code = await scanQrFromImageSource(videoRef.current);
        if (code) {
          setResult(code.data);
          setScanning(false);
          stopCamera();
          return;
        }
        frameRef.current = requestAnimationFrame(scanFrame);
      };

      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (cameraError) {
      setError(cameraError.message || 'Camera access failed. Allow camera permission and try again.');
      setScanning(false);
    }
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">QR Input</div>
        {mode === 'upload' && !previewUrl ? (
          <DropZone
            accept="image/*"
            onFiles={handleFiles}
            title="Drop a QR image here"
            subtitle="or click to browse for a screenshot or photo"
            icon={<Icon icon={ICON_MAP.QrCode} size={28} />}
          />
        ) : mode === 'camera' ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: 16,
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: '100%',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-2)',
                minHeight: 280,
                objectFit: 'cover',
              }}
            />
            {scanning ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
                <Icon icon={ICON_MAP.Loader2} size={14} className="spin" />
                Scanning camera feed...
              </div>
            ) : null}
          </div>
        ) : previewUrl ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: 16,
            }}
          >
            <img
              src={previewUrl}
              alt="QR preview"
              style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 360, objectFit: 'contain', background: 'var(--surface-2)' }}
            />
          </div>
        ) : (
          <EmptyState
            iconName="QrCode"
            title="Upload an image or use your camera"
            message="The reader scans uploaded screenshots and photos, and it can also decode QR codes live from your camera feed."
          />
        )}

        <ErrorCallout message={error} />

        {result ? (
          <>
            <div className="panel-label">Decoded Result</div>
            <textarea
              className="textarea"
              value={result}
              readOnly
              style={{ minHeight: 140, marginBottom: 8 }}
            />
            <TextStatLine items={[`${result.length} characters`]} marginBottom={0} />
          </>
        ) : null}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Source</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          {[
            ['upload', 'Upload'],
            ['camera', 'Camera'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${mode === value ? ' active' : ''}`}
              onClick={() => {
                setMode(value);
                setError(null);
                setPreviewUrl('');
                if (value === 'camera') {
                  startCamera();
                } else {
                  stopCamera();
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'camera' ? (
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
            onClick={scanning ? stopCamera : startCamera}
          >
            {scanning ? 'Stop Camera' : 'Start Camera'}
          </button>
        ) : null}

        <div className="panel-divider" />

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => copy(result)}
            disabled={!result}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              stopCamera();
              setPreviewUrl('');
              setResult('');
              setError(null);
              setMode('upload');
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => downloadText(result, 'qr-code-result.txt')}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">
          QR scanning runs fully in the browser, including camera decoding.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
