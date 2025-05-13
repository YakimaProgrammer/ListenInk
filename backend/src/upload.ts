// The following code is a kludge for showcase. In production, I would likely recompute progress from S3 based on which database entries are still pending for the scale we are currently operating at
import { OpenAI } from "openai";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

// Does everything entirely in memory. This should horrify you
export async function pdfPipeline(id: string, pdf: Buffer): Promise<number> {
  // Run this at the same time as everything else
  const uploadTask = putToBucket(BUCKET, `${id}/src.pdf`, pdf, "application/pdf");

  // Wait for pages to be rasterized
  const pages = await pdfToPng(pdf, { viewportScale: 4.0 });

  //await Promise.all(pages.map((p, i) => processPage(p, i, id)));
  // Process pages sequentially so OpenAI & Co. don't ratelimit me
  for (let i = 0; i < pages.length; i++) {
    console.log(`Starting page ${i} for doc ${id}.`);
    await processPage(pages[i], i, id);
    console.log("Done with that page!");
  }
  
  await uploadTask;

  return pages.length;
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
