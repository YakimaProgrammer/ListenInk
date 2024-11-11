mod openaiutils;

use async_openai::Client as OpenAIClient;
use openaiutils::ChatResponse;
use std::error::Error;

/// https://platform.openai.com/docs/guides/vision - quickstart
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let resp = openaiutils::ocr_img(OpenAIClient::new(), "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg").await?;

  match resp {
    Some(ChatResponse::Refusal(r)) => eprintln!("Model refused! {r}"),
    Some(ChatResponse::Content(c)) => println!("{c}"),
    None => eprintln!("Got nothing!"),
  }

  Ok(())
}
