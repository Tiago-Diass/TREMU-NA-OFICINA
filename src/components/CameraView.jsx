import React, { useEffect, useRef, useState } from 'react';
import { loadHandLandmarker, attachCamera, stopCamera } from '../lib/handTracker.js';
import { classify, createStabilityFilter } from '../lib/lgpAlphabet.js';

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];

export default function CameraView({ target, holdFrames, onRecognition }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const filterRef = useRef(null);
  if (!filterRef.current) {
    filterRef.current = createStabilityFilter({ holdFrames, minConf: 0.78 });
  }
  const targetRef = useRef(target);
  const onRecognitionRef = useRef(onRecognition);
  const lastVideoTimeRef = useRef(-1);
  const lastSentRef = useRef(null);
  const [status, setStatus] = useState('A inicializar câmara…');
  const [error, setError] = useState(null);

  useEffect(() => { targetRef.current = target; filterRef.current.clearLock(); }, [target]);
  useEffect(() => { onRecognitionRef.current = onRecognition; }, [onRecognition]);

  useEffect(() => {
    let cancelled = false;
    let landmarker = null;

    (async () => {
      try {
        setStatus('A carregar modelo de gestos…');
        landmarker = await loadHandLandmarker();
        if (cancelled) return;
        setStatus('A pedir acesso à câmara…');
        streamRef.current = await attachCamera(videoRef.current);
        if (cancelled) return;
        setStatus(null);
        loop();
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError(e?.message || 'Falha desconhecida');
      }
    })();

    function emit(payload) {
      const prev = lastSentRef.current;
      if (
        prev &&
        prev.letter === payload.letter &&
        prev.candidate === payload.candidate &&
        prev.committed === payload.committed &&
        prev.progress === payload.progress
      ) return;
      lastSentRef.current = payload;
      onRecognitionRef.current?.(payload);
    }

    function loop() {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !landmarker) return;

      if (video.readyState >= 2 && video.videoWidth && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        let result;
        try {
          result = landmarker.detectForVideo(video, performance.now());
        } catch (e) {
          console.error('[CameraView] detectForVideo falhou:', e?.message || e);
          result = null;
        }
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        let recognised = { letter: null, confidence: 0 };
        if (result && result.landmarks && result.landmarks.length) {
          const lm = result.landmarks[0];
          drawHand(ctx, lm, canvas.width, canvas.height);
          recognised = classify(lm);
        }
        ctx.restore();
        const filt = filterRef.current.push(recognised);
        emit({
          letter: recognised.letter,
          confidence: recognised.confidence,
          candidate: filt.candidate,
          committed: filt.committed,
          progress: filt.progress,
          target: targetRef.current,
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stopCamera(streamRef.current);
      streamRef.current = null;
      lastVideoTimeRef.current = -1;
    };
  }, []);

  return (
    <section className="camera">
      <div className="camera-label">Feed da câmara — reconhecimento LGP</div>
      <div className="camera-frame">
        <video ref={videoRef} playsInline muted className="camera-video" />
        <canvas ref={canvasRef} className="camera-canvas" />
        {(status || error) && (
          <div className={`camera-overlay ${error ? 'error' : ''}`}>
            <p>{error ? `ERRO: ${error}` : status}</p>
            {error && <p className="hint">Verifica as permissões da câmara e recarrega a página.</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function drawHand(ctx, lm, w, h) {
  // Ligações — azul néon
  ctx.strokeStyle = 'rgba(0, 207, 255, 0.75)';
  ctx.lineWidth = 2.5;
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  }
  // Pontos — amarelo néon
  for (const p of lm) {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,230,0,0.95)';
    ctx.fill();
  }
}
