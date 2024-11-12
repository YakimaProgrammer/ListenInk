mod openaiutils;
mod pdfutils;
mod s3utils;

use async_openai::Client as OpenAIClient;
use openaiutils::ChatResponse;
use pdfium_render::prelude::*;
use std::error::Error;

/// https://platform.openai.com/docs/guides/vision - quickstart
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let pdfium = Pdfium::new(Pdfium::bind_to_statically_linked_library().unwrap());
  let render_config = PdfRenderConfig::new()
    .set_target_width(2000)
    .set_maximum_height(2000);

  let config = aws_config::load_from_env().await;
  let client = aws_sdk_s3::Client::new(&config);
  s3utils::purge_bucket(&client, "com.listenink").await?;

  for (i, img) in pdfutils::export_pdf_to_jpegs(
    "/home/magnus/Downloads/331_HW_6.pdf",
    &pdfium,
    &render_config,
  )?
  .into_iter()
  .enumerate()
  {
    println!("Uploading {i}");
    s3utils::upload_object(&client, "com.listenink", img.into(), &format!("{i}.jpg")).await?;
  }

  let resp = openaiutils::ocr_img(
    OpenAIClient::new(),
    "http://s3.magnusfulton.com/com.listenink/0.jpg",
  )
  .await?;

  match resp {
    Some(ChatResponse::Refusal(r)) => eprintln!("Model refused! {r}"),
    Some(ChatResponse::Content(c)) => println!("{c}"),
    None => eprintln!("Got nothing!"),
  }

  Ok(())
}
