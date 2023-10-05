import { ACTIONS, ERRORS } from '../shared/constants';
import { EmotionScore, MessageResponseBody } from '../shared/types';

let ws: WebSocket;
let video: HTMLVideoElement;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let overlayCtx: CanvasRenderingContext2D;
let overlay: HTMLCanvasElement;
let removeOverlay = false;

let latestFrame = 0; // used to ensure messages received from web socket are processed chronologically
let frameCount = -1; // used to enable inference to be performed on every 60 frames instead of every frame
const frameCaptureRate = 60; // rate of frames to perform inference on (every 60th frame)

chrome.runtime.onMessage.addListener((msg) => {
  const { action } = msg;
  const { CONNECT, DISCONNECT } = ACTIONS;
  if (action !== CONNECT && action !== DISCONNECT) return;

  chrome.storage.sync.get(['apiKey', 'streaming'], (result) => {
    const { apiKey, streaming } = result;
    if (action === CONNECT) {
      const err: keyof typeof ERRORS = 'STREAMING_IN_PROGRESS';
      streaming ? displayError(err) : captureVideoAndStream(apiKey);
    }
    if (action === DISCONNECT) {
      removeOverlay = msg.removeOverlay;
      disconnect();
    }
  });
});

/**
 * Function which queries the DOM for the video element, instantiates a websocket connection, and then
 * captures the video element's frames using canvas.
 *
 * The captured frames are converted to `image/png` Blobs, base64 encoded, and then sent through the
 * websocket for inference.
 *
 * Every 60th frame is captured, and there is a mechanism in place to ensure responses are handled in
 * order (chronologically).
 *
 * When a response is received, top five expressions are extracted and sent to the popup to be visualized.
 */
function captureVideoAndStream(apiKey: string): void {
  video = document.querySelector('video');
  if (!video) {
    const err: keyof typeof ERRORS = 'NO_VIDEO_FOUND';
    return displayError(err);
  }
  if (video.paused || video.ended) video.play();

  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');

  if (overlay) overlay.remove();
  createVideoOverlay();

  const wsURL = `wss://api.hume.ai/v0/stream/models?apikey=${apiKey}`;
  ws = connect(wsURL);

  video.addEventListener('pause', disconnect);
  video.addEventListener('ended', disconnect);

  captureAndSendFrames();
}

/**
 * Function which creates the overlay canvas dom element, and appends it to the DOM, positioned over the
 * video element's container.
 */
function createVideoOverlay(): void {
  overlay = document.createElement('canvas');
  overlayCtx = overlay.getContext('2d');

  overlay.style['position'] = 'relative';
  overlay.style['top'] = '0';
  overlay.style['left'] = '0';

  const container = video.parentElement;
  container.appendChild(overlay);
}

/**
 * Function which creates instantiates a new WebSocket connection and defines the various
 * callback functions for each event (`open`, `message`, `close`, & `error`)
 */
function connect(webSocketURL: string): WebSocket {
  const socket = new WebSocket(webSocketURL);

  socket.addEventListener('open', () => {
    console.log('WebSocket connection established.');
    const streaming = true;
    chrome.storage.sync.set({ streaming });
    chrome.runtime.sendMessage({
      action: ACTIONS.STREAMING_STATE_UPDATED,
      streaming,
    });
  });

  socket.addEventListener('message', (event) => {
    const data: MessageResponseBody = JSON.parse(event.data);
    const frame = Number(data.payload_id);
    // guard clause ensuring messages are processed in order (chronologically)
    if (frame < latestFrame) return;
    // update the latestFrame for each processed message
    latestFrame = frame;
    // draw bounding box and extract top 5 expressions from message response body
    drawBoundingBox(data);
    const topFiveExpressions = extractTopFiveExpressions(data);
    // update top five expressions in popup menu
    chrome.runtime.sendMessage({
      action: ACTIONS.TOP_FIVE_UPDATED,
      topFiveExpressions,
    });
  });

  socket.addEventListener('close', (event) => {
    chrome.storage.sync.get(['streaming'], ({ streaming }) => {
      // IF the stream is disconnected unintentionally then reconnect
      if (streaming) {
        ws = connect(webSocketURL);
        console.log('WebSocket reconnecting...');
        return;
      }
      // IF video is playing when streaming is stopped then pause the video
      if (!video.paused && !video.ended) video.pause();
      // updates streaming state, so extension Popup menu UI updates accordingly
      chrome.runtime.sendMessage({
        action: ACTIONS.STREAMING_STATE_UPDATED,
        streaming,
      });
      console.log('WebSocket connection closed:', event.reason);
    });
  });

  socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
}

/**
 * Function which closes the websocket and updates state accordingly
 */
function disconnect(): void {
  if (removeOverlay) overlay.remove();
  if (!ws) chrome.storage.sync.set({ streaming: false });
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  // update streaming state before closing WebSocket, so it doesn't try to reconnect
  chrome.storage.sync.set({ streaming: false });
  ws.close(1000, 'video stopped');
  // reset values for next stream
  latestFrame = 0;
  frameCount = -1;
}

/**
 * Function which recursively draws each video frame to be converted to an image/png Blob, base64 encoded,
 * and sent in the message body through the socket. The overlay border is also drawn to indicate which
 * video on the webpage is being processed.
 */
function captureAndSendFrames(): void {
  frameCount++;
  if (video.paused || video.ended) return;
  // only capture frames at a specified rate (in this implementation we capture every 60 frames)
  if (frameCount % frameCaptureRate === 0) {
    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(toBlobCallback, 'image/png', 0.9);
  }
  // recursively called to continually capture frames
  requestAnimationFrame(captureAndSendFrames);
}

/**
 * Function which takes a Blob and triggers building the message and sending it IF the WebSocket is open.
 */
function toBlobCallback(blob: Blob): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  createAndSendMessage(blob, frameCount);
}

/**
 * Function which takes a Blob, base64 encodes it, and builds the message to send through the
 * WebSocket.
 *
 * For more information on structuring request bodies see our Streaming API docs:
 * `https://streaming.hume.ai/doc/streaming-api/operation/operation-publish-models`
 *
 * @param blob An `image/png` Blob to be base64 encoded and added to the body of the message
 * @param frame A reference to the current drawn frame passed in as the payload_id. This value
 * is later used when processing the response to ensure each response is handled in order
 * (chronologically)
 */
async function createAndSendMessage(blob: Blob, frame: number): Promise<void> {
  const data = await blobToBase64(blob);
  // specifies Face Model only, as we are processing images (the captured video frames)
  const models = { face: {} };
  // payload_id is included in the response— used as reference to ensure responses are handled in order
  const payload_id = `${frame}`;

  const message = JSON.stringify({ data, models, payload_id });
  ws.send(message);
}

/**
 * Function which takes a Blob, converts it to a file, and base64 encodes it.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve: (value: string) => void, _) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (!reader.result) return;

      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Function which first resets the dimensions of the overlay, and then extracts the bounding box coordinates
 * from the streaming API message response body and draws the bounding box in the overlay canvas to indicate
 * which face the top five expressions in the popup menu correspond to.
 *
 * IF no predictions are present in the response, a bounding box is not drawn (face not detected)
 */
function drawBoundingBox(res: MessageResponseBody): void {
  overlay.width = video.offsetWidth;
  overlay.height = video.offsetHeight;

  if (!res.face.predictions) return;
  const { bbox } = res.face.predictions[0];

  const borerColor = 'red';
  const borderWidth = 3;

  const x = bbox.x + bbox.w / 2;
  const y = bbox.y + bbox.h / 2;
  const radiusX = bbox.w / 2;
  const radiusY = bbox.h / 2;
  const rotation = 0;
  const startAngle = 0;
  const endAngle = 2 * Math.PI;

  overlayCtx.strokeStyle = borerColor;
  overlayCtx.lineWidth = borderWidth;
  overlayCtx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
  overlayCtx.stroke();
}

/**
 * Function which extracts the top five expressions from the streaming API message response body. The top
 * five expressions are the expressions with the highest scores— indicating Hume's Model determined the
 * signals for those expressions were of the highest intensity relative to others for a given expression.
 *
 * If no predictions are present in the response body, an empty array is returned to indicate for the
 * extension's Popup menu that there are no predictions (face not detected).
 *
 * For information on interpreting outputs see our documentation:
 *  - https://intercom.help/hume-ai/en/articles/8062849-how-do-i-interpret-my-results
 *  - https://intercom.help/hume-ai/en/articles/8062903-what-can-i-do-with-my-outputs
 */
function extractTopFiveExpressions(res: MessageResponseBody): EmotionScore[] {
  if (!res.face.predictions) return [];
  const { emotions } = res.face.predictions[0];
  const topFiveExpressions = emotions
    .sort((a, b) => {
      if (a.score > b.score) return -1;
      if (a.score < b.score) return 1;
      return 0;
    })
    .slice(0, 5);
  return topFiveExpressions;
}

/**
 * Function which displays an alert on the webpage with the specified error message
 */
function displayError(error: keyof typeof ERRORS): void {
  alert(`Hume Extension Error: ${ERRORS[error]}`);
}
