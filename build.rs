fn main() {
  // Specify the path to your `libpdfium.a` file
  let lib_path = "/home/magnus/programming/rust/listenink/pdfium/pdfium/out/Default/obj";

  // Tell cargo to re-run the build script if the library file changes
  println!("cargo:rerun-if-changed={}", lib_path);

  // Add the directory containing `libpdfium.a` to the linker search path
  println!("cargo:rustc-link-search=native={}", lib_path);

  // Link the library statically
  println!("cargo:rustc-link-lib=static=pdfium");

  // Link against the C++ standard library
  println!("cargo:rustc-link-lib=dylib=stdc++");
}
