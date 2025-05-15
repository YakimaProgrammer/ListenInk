// The following code is a kludge for showcase. In production, I would likely recompute progress from S3 based on which database entries are still pending for the scale we are currently operating at
import { OpenAI } from "openai";
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { pdfToPng, PngPageOutput } from "pdf-to-png-converter";

import { openaiKey } from "./secrets/openai.json";
import { accessKey, secretKey } from "./secrets/s3credentials.json";

const openai = new OpenAI({ apiKey: openaiKey });
const s3 = new S3Client({
  region: 'us-east-1', // Replace with your region
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey
  },
  endpoint: "https://s3.magnusfulton.com/"
});

const BUCKET = "com.listenink";

export type UploadEvents = {
  "start": {},
  "pdf-split": { numpages: number },
  "page-start": { page: number },
  "page-retry": { page: number, "try": number },
  "page-done": { page: number },
  "done": { success: boolean },
  "failure": { err: string }
};

export type UploadEventTuple = { [K in keyof UploadEvents]: [K, UploadEvents[K]] }[keyof UploadEvents];

export class UploadEventEmitter {
  private listeners: {
    [K in keyof UploadEvents]?: Array<(payload: UploadEvents[K]) => void>
  } = {};
  
  private omnilisteners: Array<(payload: UploadEventTuple) => void> = [];
  
  private eventLog: UploadEventTuple[] = [];
  
  on<K extends keyof UploadEvents>(
    type: K,
    listener: (ev: UploadEvents[K]) => void
  ): void {
    // Typedancing... 
    if (this.listeners[type] === undefined) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  onAny(listener: (ev: UploadEventTuple) => void) {
    this.omnilisteners.push(listener);
  }

  dispatch<K extends keyof UploadEvents>(type: K, detail: UploadEvents[K]) {
    for (let l of (this.listeners[type] ?? [])) {
      l(detail);
    }
    const tuple = [type, detail] as UploadEventTuple;
    // I'm tired of typedancing
    for (let l of this.omnilisteners) {
      l(tuple);
    }
    this.eventLog.push(tuple);
  }

  // At the time of writing, this code was mostly used in two trusted areas, so I chose a `readonly` modifier as a general reminder to not be a dumbass
  getEventLog(): readonly UploadEventTuple[] {
    return this.eventLog;
  }
}

async function retrying(pngpage: PngPageOutput, page: number, id: string, events: UploadEventEmitter): Promise<boolean> {
  for (let t = 0; t < 3; t++) {
    try {
      await processPage(pngpage, page, id);
      return true;
    } catch {
      events.dispatch("page-retry", { page, "try": t });
    }
  }
  return false;
}

// Does everything entirely in memory. This should horrify you
export async function pdfPipeline(id: string, pdf: Buffer, events: UploadEventEmitter): Promise<void> {
  events.dispatch("start", {});
  // Run this at the same time as everything else
  const uploadTask = putToBucket(BUCKET, `${id}/src.pdf`, pdf, "application/pdf");

  // Wait for pages to be rasterized
  const pages = await pdfToPng(pdf, { viewportScale: 4.0 });
  events.dispatch("pdf-split", { numpages: pages.length });

  // await Promise.all(pages.map((p, i) => processPage(p, i, id)));
  // Process pages sequentially so OpenAI & Co. don't ratelimit me
  // The document upload endpoint relies on this assumption on monotonicity
  for (let i = 0; i < pages.length; i++) {
    events.dispatch("page-start", { page: i });
    if (false) {//(process.env.NODE_ENV === "development") {
      await new Promise(resolve => setTimeout(resolve, 1_500));
    } else {
      if (!(await retrying(pages[i], i, id, events))) {
	events.dispatch("failure", { err: "Maximum number of retries exceeded. Aborting..." });
	events.dispatch("done", { success: false });
	return;
      }
    }
    events.dispatch("page-done", { page: i });
  }
  
  await uploadTask;

  events.dispatch("done", { success: true });
  return;
}

async function processPage(page: PngPageOutput, pageNum: number, id: string) {
  // Concurrently with everything else
  const uploadPngTask = putToBucket(BUCKET, `${id}/${pageNum}.png`, page.content, "image/png");
  const content = await ocrPage(page.content);
  // Concurrently with tts generation
  const uploadContentTask = putToBucket(BUCKET, `${id}/${pageNum}.txt`, Buffer.from(content), "text/plain");
  const mp3 = await tts(content);
  await putToBucket(BUCKET, `${id}/${pageNum}.mp3`, mp3, "audio/mpeg");
  await uploadContentTask;
  await uploadPngTask;
}

async function ocrPage(png: Buffer): Promise<string> {
  const resp = await openai.responses.create({
    model: 'gpt-4o-mini',
    instructions: 'Transcribe this page in a way that would be natural to read aloud, outputting only the content on the page.',
    input: [
      {
        "role": "user",
        "content": [
          {
            "type": "input_image",
            "image_url": "data:image/png;base64," + png.toString("base64"),
	    "detail": "high"
          }
        ]
      }
    ]
  });

  // Errors are impossible because I said so
  return resp.output_text;
}

async function tts(content: string): Promise<Buffer<ArrayBufferLike>> {
  const resp = await openai.audio.speech.create({
    input: content,
    model: "gpt-4o-mini-tts",
    voice: "nova"
  });
  return Buffer.from(await resp.arrayBuffer());
}

async function putToBucket(bucketName: string, key: string, buffer: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });

  await s3.send(command);   
}
