mod openaiutils;
mod pdfutils;
mod s3utils;

use async_openai::Client as OpenAIClient;
use listenink::{process_pdf, Clients};
use openaiutils::ChatResponse;
use pdfium_render::prelude::*;
use std::env;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let pdfium = Pdfium::new(Pdfium::bind_to_statically_linked_library().unwrap());
  let render_config = PdfRenderConfig::new()
    .set_target_width(2000)
    .set_maximum_height(2000);

  let config = aws_config::load_from_env().await;
  let s3client = aws_sdk_s3::Client::new(&config);

  let openaiclient = OpenAIClient::new();

  let clients = Clients {
    pdfium,
    render_config,
    s3client,
    openaiclient,
    bucket: env::var("BUCKET")?,
    endpoint: env::var("AWS_ENDPOINT_URL")?,
  };

  s3utils::purge_bucket(&clients.s3client, &clients.bucket).await?;

  let results = process_pdf(&clients, "/home/magnus/Downloads/test.pdf").await?;
  println!(
    "The following pages succeeded: {}",
    results
      .success_ids
      .iter()
      .map(|i| i.to_string())
      .collect::<Vec<_>>()
      .join(", ")
  );

  println!(
    "The following pages failed: {}",
    results
      .failure_ids
      .iter()
      .map(|(i, _)| i.to_string())
      .collect::<Vec<_>>()
      .join(", ")
  );

  for (i, r) in results.failure_ids {
    eprintln!("Page {i}: {r}");
  }

  Ok(())
}
