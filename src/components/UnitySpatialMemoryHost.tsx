import React, { useEffect, useRef, useState } from 'react';
import type { SpatialMemoryResult } from './SpatialMemoryGameHtml';
import { SpatialMemoryGameHtml } from './SpatialMemoryGameHtml';

declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: Record<string, unknown>,
      onProgress?: (p: number) => void,
    ) => Promise<UnityInstance>;
    senwittUnityReady?: () => void;
    senwittUnityComplete?: (json: string) => void;
    senwittUnityCancel?: () => void;
  }
}

interface UnityInstance {
  SendMessage: (objectName: string, methodName: string, value?: string) => void;
  Quit: () => Promise<void>;
}

interface UnitySpatialMemoryHostProps {
  onComplete: (result: SpatialMemoryResult) => void;
  onCancel: () => void;
  gridSize?: number;
}

const UNITY_BASE = '/unity/spatial-memory';

/** Detect a WebGL build folder that Unity exported into public/unity/spatial-memory. */
async function probeUnityBuild(): Promise<{
  loaderUrl: string;
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
} | null> {
  // Unity 6 gzip/brotli builds keep *.loader.js uncompressed and compress the rest.
  const candidates = [
    {
      loaderUrl: `${UNITY_BASE}/Build/spatial-memory.loader.js`,
      dataUrl: `${UNITY_BASE}/Build/spatial-memory.data.gz`,
      frameworkUrl: `${UNITY_BASE}/Build/spatial-memory.framework.js.gz`,
      codeUrl: `${UNITY_BASE}/Build/spatial-memory.wasm.gz`,
    },
    {
      loaderUrl: `${UNITY_BASE}/Build/spatial-memory.loader.js`,
      dataUrl: `${UNITY_BASE}/Build/spatial-memory.data.br`,
      frameworkUrl: `${UNITY_BASE}/Build/spatial-memory.framework.js.br`,
      codeUrl: `${UNITY_BASE}/Build/spatial-memory.wasm.br`,
    },
    {
      loaderUrl: `${UNITY_BASE}/Build/spatial-memory.loader.js`,
      dataUrl: `${UNITY_BASE}/Build/spatial-memory.data`,
      frameworkUrl: `${UNITY_BASE}/Build/spatial-memory.framework.js`,
      codeUrl: `${UNITY_BASE}/Build/spatial-memory.wasm`,
    },
    {
      loaderUrl: `${UNITY_BASE}/Build/Build.loader.js`,
      dataUrl: `${UNITY_BASE}/Build/Build.data.gz`,
      frameworkUrl: `${UNITY_BASE}/Build/Build.framework.js.gz`,
      codeUrl: `${UNITY_BASE}/Build/Build.wasm.gz`,
    },
  ];

  for (const c of candidates) {
    try {
      const loader = await fetch(c.loaderUrl, { method: 'HEAD' });
      if (!loader.ok) continue;
      const data = await fetch(c.dataUrl, { method: 'HEAD' });
      if (data.ok) return c;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Loads Unity WebGL Spatial Memory when a build is present; otherwise falls back
 * to the HTML engine so the arcade never blanks.
 */
export const UnitySpatialMemoryHost: React.FC<UnitySpatialMemoryHostProps> = ({
  onComplete,
  onCancel,
  gridSize = 3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const instanceRef = useRef<UnityInstance | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [useHtmlFallback, setUseHtmlFallback] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const build = await probeUnityBuild();
      if (!build || cancelled) {
        if (!cancelled) setUseHtmlFallback(true);
        return;
      }

      window.senwittUnityComplete = (json: string) => {
        if (finishedRef.current) return;
        try {
          const parsed = JSON.parse(json) as SpatialMemoryResult;
          finishedRef.current = true;
          onComplete(parsed);
        } catch (e) {
          console.warn('senwittUnityComplete parse failed', e);
          setError('Unity returned an invalid result — using HTML fallback next time.');
        }
      };
      window.senwittUnityCancel = () => {
        if (!finishedRef.current) onCancel();
      };
      window.senwittUnityReady = () => {
        const inst = instanceRef.current;
        if (!inst) return;
        const resolved = gridSize === 4 ? 4 : 3;
        inst.SendMessage('GameRoot', 'Configure', JSON.stringify({ gridSize: resolved }));
        inst.SendMessage('GameRoot', 'StartGame', '');
      };

      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = build.loaderUrl;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Unity loader script'));
          document.body.appendChild(script);
        });

        if (cancelled || !canvasRef.current || !window.createUnityInstance) {
          setUseHtmlFallback(true);
          return;
        }

        const instance = await window.createUnityInstance(
          canvasRef.current,
          {
            dataUrl: build.dataUrl,
            frameworkUrl: build.frameworkUrl,
            codeUrl: build.codeUrl,
            companyName: 'SENWITT',
            productName: 'Spatial Memory Grid',
            productVersion: '0.1.0',
          },
          (p) => setProgress(p),
        );
        if (cancelled) {
          await instance.Quit().catch(() => undefined);
          return;
        }
        instanceRef.current = instance;
      } catch (e) {
        console.warn('Unity WebGL boot failed', e);
        if (!cancelled) {
          setError('Unity WebGL failed to load — showing HTML version.');
          setUseHtmlFallback(true);
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
      window.senwittUnityReady = undefined;
      window.senwittUnityComplete = undefined;
      window.senwittUnityCancel = undefined;
      const inst = instanceRef.current;
      instanceRef.current = null;
      if (inst) void inst.Quit().catch(() => undefined);
    };
  }, [gridSize, onCancel, onComplete]);

  if (useHtmlFallback) {
    return (
      <SpatialMemoryGameHtml
        gridSize={gridSize}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 min-h-[calc(100vh-var(--navbar-height))] flex flex-col items-stretch relative z-10">
      <div className="w-full flex items-center justify-between mb-4 gap-3 flex-wrap">
        <button
          type="button"
          onClick={onCancel}
          className="btn-3d px-4 py-2 text-xs"
          style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
        >
          ✕ Exit
        </button>
        <span
          className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-xl"
          style={{ background: '#ccfbf1', color: 'var(--accent-teal)' }}
        >
          Unity WebGL pilot
        </span>
      </div>

      <div className="surface p-3 md:p-4 flex flex-col items-center gap-3">
        {error && (
          <p className="text-sm font-semibold" style={{ color: 'var(--accent-coral)' }}>
            {error}
          </p>
        )}
        {progress < 1 && !error && (
          <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
            Loading Unity… {Math.round(progress * 100)}%
          </p>
        )}
        <canvas
          ref={canvasRef}
          id="senwitt-unity-canvas"
          width={960}
          height={720}
          className="w-full max-w-[960px] rounded-2xl"
          style={{ background: '#eef3f8', aspectRatio: '4 / 3' }}
        />
        <p className="text-xs font-semibold text-center" style={{ color: 'var(--text-muted)' }}>
          Build missing? Export WebGL to <code>public/unity/spatial-memory/</code> — see{' '}
          <code>unity/SpatialMemoryGrid/README.md</code>. Until then the HTML game is used automatically.
        </p>
        <button
          type="button"
          className="btn-3d btn-3d-teal text-xs px-4 py-2"
          onClick={() => setUseHtmlFallback(true)}
        >
          Play HTML version instead
        </button>
      </div>
    </div>
  );
};
