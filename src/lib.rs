mod openaiutils;
mod pdfutils;
mod s3utils;

use async_openai::error::OpenAIError;
use async_openai::{config::OpenAIConfig, Client as OpenAIClient};
use aws_sdk_s3::{Client as S3Client, Error as S3Error};
use data_encoding::HEXLOWER;
use openaiutils::ChatResponse;
use pdfium_render::prelude::*;
use ring::digest::{Context, Digest, SHA256};
use std::fs::File;
use std::io::{Error as IOError, Read};
use std::path::Path;
use std::sync::Arc;

fn sha256_digest<R: Read>(mut reader: R) -> Result<Digest, IOError> {
  let mut context = Context::new(&SHA256);
  let mut buffer = [0; 1024];

  loop {
    let count = reader.read(&mut buffer)?;
    if count == 0 {
      break;
    }
    context.update(&buffer[..count]);
  }

  Ok(context.finish())
}

pub struct UploadResult {
  success_ids: Vec<usize>,
  failure_ids: Vec<usize>,
}

pub struct Clients {
  pdfium: Pdfium,
  render_config: PdfRenderConfig,
  s3client: S3Client,
  openaiclient: OpenAIClient<OpenAIConfig>,
  bucket: String,
  endpoint: String,
}

pub enum Error {
  PdfiumError(PdfiumError),
  IOError(IOError),
  S3Error(S3Error),
  OpenAIError(OpenAIError),
  Refusal(String),
  NoResponse,
}

impl From<PdfiumError> for Error {
  fn from(val: PdfiumError) -> Error {
    Error::PdfiumError(val)
  }
}

impl From<IOError> for Error {
  fn from(val: IOError) -> Error {
    Error::IOError(val)
  }
}

impl From<S3Error> for Error {
  fn from(val: S3Error) -> Error {
    Error::S3Error(val)
  }
}

impl From<OpenAIError> for Error {
  fn from(val: OpenAIError) -> Error {
    Error::OpenAIError(val)
  }
}

/** UNSAFE: `Clients` is not safe to send across thread boundaries
 * See: https://crates.io/crates/pdfium-render#user-content-multi-threading
 */
pub async unsafe fn process_pdf<P: AsRef<Path>>(
  clients: Arc<Clients>,
  pdf: P,
) -> Result<UploadResult, Error> {
  let hash = {
    let file = File::open(&pdf)?;
    let digest = sha256_digest(file)?;
    HEXLOWER.encode(digest.as_ref())
  };

  let pages = pdfutils::export_pdf_to_jpegs(&pdf, &clients.pdfium, &clients.render_config)?;
  let futures = pages.into_iter().enumerate().map(|(i, page)| {
    let clients = clients.clone();
    let hash = hash.clone();
    tokio::spawn(async move { process_page(clients, page, i, &hash).await })
  });

  let results = futures::future::join_all(futures).await;

  Ok(UploadResult {
    success_ids: Vec::new(),
    failure_ids: Vec::new(),
  })
}

async fn process_page(
  clients: Arc<Clients>,
  page: Vec<u8>,
  page_num: usize,
  hash: &str,
) -> Result<(), Error> {
  s3utils::upload_object(
    &clients.s3client,
    &clients.bucket,
    page.into(),
    &format!("{hash}/{page_num}.jpg"),
  )
  .await?;

  let resp = openaiutils::ocr_img(
    &clients.openaiclient,
    &format!(
      "{}/{}/{hash}/{page_num}.jpg",
      clients.endpoint, clients.bucket
    ),
  )
  .await?;

  match resp {
    Some(ChatResponse::Content(content)) => {
      // This can happen concurrently as the TTS part, but I really don't want to
      s3utils::upload_object(
        &clients.s3client,
        &clients.bucket,
        content.as_bytes().to_vec().into(),
        &format!("{hash}/{page_num}.txt"),
      )
      .await?;

      let bytes = openaiutils::tts(&clients.openaiclient, &content).await?;
      s3utils::upload_object(
        &clients.s3client,
        "com.listenink",
        bytes.into(),
        &format!("{hash}/{page_num}.mp3"),
      )
      .await?;

      Ok(())
    }
    Some(ChatResponse::Refusal(content)) => Err(Error::Refusal(content)),
    None => Err(Error::NoResponse),
  }
}
