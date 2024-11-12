use async_openai::{
  config::OpenAIConfig,
  error::OpenAIError,
  types::{
    ChatCompletionRequestMessageContentPartImageArgs,
    ChatCompletionRequestMessageContentPartTextArgs, ChatCompletionRequestUserMessageArgs,
    CreateChatCompletionRequestArgs, CreateSpeechRequestArgs, ImageDetail, ImageUrlArgs,
    SpeechModel, Voice,
  },
  Client,
};

const PROMPT: &'static str = include_str!("../prompt.txt");

pub enum ChatResponse {
  Content(String),
  Refusal(String),
}

pub async fn ocr_img(
  client: &Client<OpenAIConfig>,
  image_url: &str,
) -> Result<Option<ChatResponse>, OpenAIError> {
  let request = CreateChatCompletionRequestArgs::default()
    .model("gpt-4o-mini")
    //.max_tokens(300_u32)
    .messages([ChatCompletionRequestUserMessageArgs::default()
      .content(vec![
        ChatCompletionRequestMessageContentPartTextArgs::default()
          .text(PROMPT)
          .build()?
          .into(),
        ChatCompletionRequestMessageContentPartImageArgs::default()
          .image_url(
            ImageUrlArgs::default()
              .url(image_url)
              .detail(ImageDetail::Auto)
              .build()?,
          )
          .build()?
          .into(),
      ])
      .build()?
      .into()])
    .build()?;

  let response = client.chat().create(request).await?;
  let choice = response.choices.get(0);

  if let Some(choice) = choice {
    if let Some(ref refusal) = choice.message.refusal {
      Ok(Some(ChatResponse::Refusal(refusal.clone())))
    } else if let Some(ref message) = choice.message.content {
      Ok(Some(ChatResponse::Content(message.clone())))
    } else {
      Ok(None)
    }
  } else {
    Ok(None)
  }
}

pub async fn tts(client: &Client<OpenAIConfig>, msg: &str) -> Result<Vec<u8>, OpenAIError> {
  let request = CreateSpeechRequestArgs::default()
    .input(msg)
    .voice(Voice::Alloy)
    .model(SpeechModel::Tts1)
    .build()?;

  let response = client.audio().speech(request).await?;

  Ok(response.bytes.to_vec())
}
