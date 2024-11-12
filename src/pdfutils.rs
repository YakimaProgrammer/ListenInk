use pdfium_render::prelude::*;
use std::io::Cursor;
use std::path::Path;

pub fn export_pdf_to_jpegs<P: AsRef<Path>>(
  path: P,
  pdfium: &Pdfium,
  config: &PdfRenderConfig,
) -> Result<Vec<Vec<u8>>, PdfiumError> {
  let document = pdfium.load_pdf_from_file(&path, None)?;

  document
    .pages()
    .iter()
    .map(|page| -> Result<Vec<u8>, PdfiumError> {
      let mut bytes: Vec<u8> = Vec::new();
      page
        .render_with_config(&config)?
        .as_image()
        .into_rgb8()
        .write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Jpeg)
        .map_err(|_| PdfiumError::ImageError)?;

      Ok(bytes)
    })
    .collect()
}
