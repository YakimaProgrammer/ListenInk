mod openaiutils;
mod pdfutils;
mod s3utils;

use async_openai::error::OpenAIError;
use async_openai::{config::OpenAIConfig, Client as OpenAIClient};
use aws_sdk_s3::{Client as S3Client, Error as S3Error};
use data_encoding::HEXLOWER;
use itertools::Itertools;
use openaiutils::ChatResponse;
use pdfium_render::prelude::*;
use ring::digest::{Context, Digest, SHA256};
use std::fmt::Display;
use std::fs::File;
use std::io::{Error as IOError, Read};
use std::path::Path;
use url::{ParseError as UrlParseError, Url};

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
  pub success_ids: Vec<usize>,
  pub failure_ids: Vec<(usize, Error)>,
}

pub struct Clients {
  pub pdfium: Pdfium,
  pub render_config: PdfRenderConfig,
  pub s3client: S3Client,
  pub openaiclient: OpenAIClient<OpenAIConfig>,
  pub bucket: String,
  pub endpoint: String,
}

#[derive(Debug)]
pub enum Error {
  PdfiumError(PdfiumError),
  IOError(IOError),
  S3Error(S3Error),
  OpenAIError(OpenAIError),
  UrlParseError(UrlParseError),
  Refusal(String),
  NoResponse,
  BaseUrlError,
}

impl std::fmt::Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> Result<(), std::fmt::Error> {
    match self {
      Error::PdfiumError(e) => e.fmt(f),
      Error::IOError(e) => e.fmt(f),
      Error::S3Error(e) => e.fmt(f),
      Error::OpenAIError(e) => e.fmt(f),
      Error::UrlParseError(e) => e.fmt(f),
      Error::Refusal(s) => write!(f, "{s}"),
      Error::NoResponse => write!(f, "The ChatGPT API did not return a response in choices!"),
      Error::BaseUrlError => write!(f, "There was an error parsing that URL"), // Because UrlParseError isn't enough apparently
    }
  }
}

impl std::error::Error for Error {}

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

impl From<UrlParseError> for Error {
  fn from(val: UrlParseError) -> Error {
    Error::UrlParseError(val)
  }
}

pub async fn process_pdf<P: AsRef<Path>>(clients: &Clients, pdf: P) -> Result<UploadResult, Error> {
  // TODO: blocking
  let hash = {
    let file = File::open(&pdf)?;
    let digest = sha256_digest(file)?;
    HEXLOWER.encode(digest.as_ref())
  };

  // TODO: not thread safe (hence concurrency)
  let pages = pdfutils::export_pdf_to_jpegs(&pdf, &clients.pdfium, &clients.render_config)?;
  let futures = pages
    .into_iter()
    .enumerate()
    .map(|(i, page)| process_page(&clients, page, i, &hash));

  let results = futures::future::join_all(futures).await;

  let (success_ids, failure_ids): (Vec<_>, Vec<_>) =
    results
      .into_iter()
      .enumerate()
      .partition_map(|(i, r)| match r {
        Ok(_) => itertools::Either::Left(i),
        Err(err) => itertools::Either::Right((i, err)),
      });

  Ok(UploadResult {
    success_ids,
    failure_ids,
  })
}

async fn process_page(
  clients: &Clients,
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

  let url: String = {
    let mut url = Url::parse(&clients.endpoint)?;
    url
      .path_segments_mut()
      .map_err(|_| Error::BaseUrlError)?
      .pop_if_empty()
      .push(&clients.bucket)
      .push(hash)
      .push(&format!("{page_num}.jpg"));
    url.to_string()
  };

  let resp = openaiutils::ocr_img(&clients.openaiclient, &url).await?;

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
