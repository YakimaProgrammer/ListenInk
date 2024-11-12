use listenink::Clients;

use async_openai::Client as OpenAIClient;
use openaiutils::ChatResponse;
use pdfium_render::prelude::*;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let pdfium = Pdfium::new(Pdfium::bind_to_statically_linked_library().unwrap());
  let render_config = PdfRenderConfig::new()
    .set_target_width(2000)
    .set_maximum_height(2000);

  let config = aws_config::load_from_env().await;
  let s3client = aws_sdk_s3::Client::new(&config);
  s3utils::purge_bucket(&s3client, "com.listenink").await?;

  for (i, img) in pdfutils::export_pdf_to_jpegs(
    "/home/magnus/Downloads/331_HW_6.pdf",
    &pdfium,
    &render_config,
  )?
  .into_iter()
  .enumerate()
  {
    println!("Uploading {i}");
  }

  let openaiclient = OpenAIClient::new();
  let resp = openaiutils::ocr_img(
    &openaiclient,
    "http://s3.magnusfulton.com/com.listenink/0.jpg",
  )
  .await?;

  if let Some(ChatResponse::Content(c)) = resp {
    let bytes = openaiutils::tts(&openaiclient, &c).await?;
    s3utils::upload_object(&s3client, "com.listenink", bytes.into(), &format!("1.mp3")).await?;
  } else {
    eprintln!("Error getting response!");
  }

  Ok(())
}
