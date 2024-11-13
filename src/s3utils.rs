use aws_sdk_s3::operation::put_object::PutObjectOutput;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::types::{Delete, ObjectIdentifier};
use aws_sdk_s3::{Client, Error};

pub async fn purge_bucket(client: &Client, bucket: &str) -> Result<(), Error> {
  let objects = client.list_objects_v2().bucket(bucket).send().await?;

  if let Some(contents) = objects.contents {
    if !contents.is_empty() {
      let ids: Vec<ObjectIdentifier> = contents
        .into_iter()
        .filter_map(|obj| obj.key)
        .map(|key| ObjectIdentifier::builder().key(key).build())
        .filter_map(Result::ok)
        .collect();

      client
        .delete_objects()
        .bucket(bucket)
        .delete(Delete::builder().set_objects(Some(ids)).build()?)
        .send()
        .await?;
    }
  }
  Ok(())
}

pub async fn upload_object(
  client: &Client,
  bucket: &str,
  body: ByteStream,
  key: &str,
) -> Result<PutObjectOutput, Error> {
  client
    .put_object()
    .bucket(bucket)
    .key(key)
    .body(body)
    .send()
    .await
    .map_err(|e| e.into())
}
