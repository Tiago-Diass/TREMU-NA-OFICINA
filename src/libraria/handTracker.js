import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const PATHS = {
  model: '/models/hand_landmarker.task',
  wasm: '/wasm',
};

const CAMERA_SETTINGS = {
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 960 },
  aspectRatio: { ideal: 4 / 3 },
  frameRate: { ideal: 30 },
};

let cachedDetector = null;
let consolePatched = false;

const LOG_PATTERN =
  /^[IWEF]\d{4}\s+\d{1,2}:\d{2}:\d{2}\.\d+\s+\d+\s+\S+\.cc:\d+\]/;

function suppressMediapipeLogs() {
  if (consolePatched) return;

  consolePatched = true;

  ['log', 'info', 'warn', 'error'].forEach((method) => {
    const original = console[method].bind(console);

    console[method] = (...args) => {
      const first = args[0];

      if (
        typeof first === 'string' &&
        LOG_PATTERN.test(first)
      ) {
        return;
      }

      original(...args);
    };
  });
}

function detectorOptions(delegateType) {
  return {
    runningMode: 'VIDEO',
    numHands: 1,

    baseOptions: {
      modelAssetPath: PATHS.model,
      delegate: delegateType,
    },

    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
}

async function createDetector(delegate) {
  const vision = await FilesetResolver.forVisionTasks(PATHS.wasm);

  return HandLandmarker.createFromOptions(
    vision,
    detectorOptions(delegate)
  );
}

export async function loadHandLandmarker() {
  if (cachedDetector) {
    return cachedDetector;
  }

  suppressMediapipeLogs();

  cachedDetector = (async () => {
    try {
      return await createDetector('GPU');
    } catch (error) {
      console.warn(
        '[tracker] GPU não disponível, a usar CPU.'
      );

      return createDetector('CPU');
    }
  })();

  cachedDetector.catch(() => {
    cachedDetector = null;
  });

  return cachedDetector;
}

async function waitMetadata(videoElement) {
  if (videoElement.readyState >= 1) {
    return;
  }

  await new Promise((resolve) => {
    videoElement.addEventListener(
      'loadedmetadata',
      resolve,
      { once: true }
    );
  });
}

export async function attachCamera(videoElement) {
  if (!videoElement) {
    throw new Error('Elemento vídeo inválido');
  }

  let stream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: CAMERA_SETTINGS,
      audio: false,
    });
  } catch {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    });
  }

  videoElement.srcObject = stream;
  videoElement.muted = true;
  videoElement.playsInline = true;

  await waitMetadata(videoElement);

  try {
    await videoElement.play();
  } catch (error) {
    if (error?.name !== 'AbortError') {
      throw error;
    }
  }

  return stream;
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}