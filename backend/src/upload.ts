// The following code is a kludge for showcase. In production, I would likely recompute progress from S3 based on which database entries are still pending for the scale we are currently operating at
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { PDFDocument } from "pdf-lib";
import { dir } from "tmp";
import { OpenAI } from "openai";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

// Yields ownership of a stream of files to the caller
async function* splitPDFPages(tempPath: string, pdfPath: string): AsyncGenerator<[number, string], void, unknown> {
  const inputPdfBytes = await readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(inputPdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(copiedPage);

    const pdfBytes = await newPdf.save();
    const tempFilePath = join(tempPath, `page-${i + 1}.pdf`);
    await writeFile(tempFilePath, pdfBytes);
    yield Promise.resolve<[number, string]>([i, tempFilePath]);
  }
}

async function ocrPage(pdfPath: string): Promise<Buffer<ArrayBufferLike>> {
  const resp = await openai.responses.create({
    model: 'gpt-4o-mini',
    instructions: 'Transcribe this page in a way that would be natural to read aloud, outputting only the content on the page.',
    input: [
      {
        "role": "user",
        "content": [
          {
            "type": "input_file",
            "filename": "page.pdf",
            "file_data": (await readFile(pdfPath)).toString("base64")
          }
        ]
      }
    ]
  });

  // Errors are impossible because I said so
  return Buffer.from(resp.output_text);
}

async function tts(content: string): Promise<Buffer<ArrayBufferLike>> {
  const resp = await openai.audio.speech.create({
    input: content,
    model: "gpt-4o-mini-tts",
    voice: "nova"
  });
  return Buffer.from(await resp.arrayBuffer());
}

async function putToBucket(bucketName: string, key: string, buffer: Buffer) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer
  });

  await s3.send(command);   
}
