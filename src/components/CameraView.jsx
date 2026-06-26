import React, { useEffect, useRef, useState } from 'react';
import { loadHandLandmarker, attachCamera, stopCamera } from '../lib/handTracker.js';
import { classify, createStabilityFilter } from '../lib/lgpAlphabet.js';

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];

export default function CameraView({
  target,
  holdFrames,
  onRecognition,
  recognised,
  lockKey
}) {
  const cameraRef = useRef(null);
  const overlayRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationRef = useRef(0);

  const trackerRef = useRef(
    createStabilityFilter({
      holdFrames,
      minConf: 0.78
    })
  );

  const targetLetterRef = useRef(target);
  const callbackRef = useRef(onRecognition);
  const lastFrameRef = useRef(-1);
  const previousPayloadRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState('A preparar a câmara…');
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    targetLetterRef.current = target;
    trackerRef.current.clearLock();
  }, [target]);

  // Sempre que a App avança de letra (ou usa o botão de apagar),
  // o lockKey muda e limpamos o "lock" de letra já confirmada,
  // para podermos voltar a reconhecer a mesma letra de imediato.
  useEffect(() => {
    trackerRef.current.clearLock();
  }, [lockKey]);

  useEffect(() => {
    callbackRef.current = onRecognition;
  }, [onRecognition]);

  useEffect(() => {
    let disposed = false;
    let detector = null;

    const sendRecognition = (payload) => {
      const previous = previousPayloadRef.current;

      if (
        previous &&
        previous.letter === payload.letter &&
        previous.candidate === payload.candidate &&
        previous.committed === payload.committed &&
        previous.progress === payload.progress
      ) {
        return;
      }

      previousPayloadRef.current = payload;
      callbackRef.current?.(payload);
    };

    const processFrame = () => {
      if (disposed) return;

      const video = cameraRef.current;
      const canvas = overlayRef.current;

      if (!video || !canvas || !detector) return;

      const canProcess =
        video.readyState >= 2 &&
        video.videoWidth &&
        video.currentTime !== lastFrameRef.current;

      if (canProcess) {
        lastFrameRef.current = video.currentTime;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        let detectionResult = null;

        try {
          detectionResult = detector.detectForVideo(
            video,
            performance.now()
          );
        } catch {
          detectionResult = null;
        }

        const ctx = canvas.getContext('2d');

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let recognition = {
          letter: null,
          confidence: 0
        };

        if (detectionResult?.landmarks?.length) {
          const landmarks = detectionResult.landmarks[0];

          renderHand(
            ctx,
            landmarks,
            canvas.width,
            canvas.height
          );

          recognition = classify(landmarks);
        }

        ctx.restore();

        const stability =
          trackerRef.current.push(recognition);

        sendRecognition({
          letter: recognition.letter,
          confidence: recognition.confidence,
          candidate: stability.candidate,
          committed: stability.committed,
          progress: stability.progress,
          target: targetLetterRef.current
        });
      }

      animationRef.current =
        requestAnimationFrame(processFrame);
    };

    const startCamera = async () => {
      try {
        setCameraStatus('A carregar modelo…');

        detector = await loadHandLandmarker();

        if (disposed) return;

        setCameraStatus('A ligar câmara…');

        mediaStreamRef.current =
          await attachCamera(cameraRef.current);

        if (disposed) return;

        setCameraStatus(null);

        processFrame();
      } catch (err) {
        if (disposed) return;

        setCameraError(
          err?.message || 'Erro desconhecido'
        );
      }
    };

    startCamera();

    return () => {
      disposed = true;

      cancelAnimationFrame(animationRef.current);

      stopCamera(mediaStreamRef.current);

      mediaStreamRef.current = null;
      lastFrameRef.current = -1;
    };
  }, []);

  const progressValue = recognised?.progress ?? 0;
  const detectedLetter = recognised?.candidate;
  const isCorrect =
    detectedLetter && detectedLetter === target;

  return (
    <div className="cam-wrap">
      <video
        ref={cameraRef}
        playsInline
        muted
        className="cam-video"
      />

      <canvas
        ref={overlayRef}
        className="cam-canvas"
      />

      {!cameraStatus && !cameraError && (
        <div className="cam-target-badge">
          <span className="cam-target-label">
            faz
          </span>
          <span className="cam-target-letter">
            {target}
          </span>
        </div>
      )}

      {!cameraStatus &&
        !cameraError &&
        detectedLetter && (
          <div
            className={`cam-detected-badge ${
              isCorrect ? 'match' : ''
            }`}
          >
            <span className="cam-target-label">
              vejo
            </span>
            <span className="cam-target-letter">
              {detectedLetter}
            </span>
          </div>
        )}

      {!cameraStatus &&
        !cameraError &&
        progressValue > 0 && (
          <div className="cam-progress-bar">
            <div
              className="cam-progress-fill"
              style={{
                width: `${Math.round(
                  progressValue * 100
                )}%`
              }}
            />
          </div>
        )}

      {(cameraStatus || cameraError) && (
        <div
          className={`cam-overlay ${
            cameraError ? 'error' : ''
          }`}
        >
          {!cameraError && (
            <div className="cam-spinner" />
          )}

          <p>
            {cameraError
              ? `Erro: ${cameraError}`
              : cameraStatus}
          </p>

          {cameraError && (
            <p className="cam-overlay-hint">
              Verifica as permissões da
              câmara e recarrega.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function renderHand(ctx, landmarks, width, height) {
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;

  CONNECTIONS.forEach(([start, end]) => {
    ctx.beginPath();
    ctx.moveTo(
      landmarks[start].x * width,
      landmarks[start].y * height
    );
    ctx.lineTo(
      landmarks[end].x * width,
      landmarks[end].y * height
    );
    ctx.stroke();
  });

  landmarks.forEach((point) => {
    ctx.beginPath();
    ctx.arc(
      point.x * width,
      point.y * height,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  });
}