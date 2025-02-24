find . \( -path "*/.git*" -o -path "*/node_modules*" -o -path "*/hocr*" -o -path "*/package-lock*" \) -prune -o -print | sed -e 's;[^/]*/;|____;g;s;____|; |;g'
