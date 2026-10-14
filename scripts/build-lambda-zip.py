"""Deterministic Lambda zip: forward-slash paths, sorted entries, fixed timestamps.

Windows PowerShell 5.1 Compress-Archive (the command in the project brief) writes
backslash separators (node_modules\\stripe\\...), which Lambda's Linux runtime
does not treat as directories. Usage:
    python scripts/build-lambda-zip.py lambda/webhook function.zip index.mjs package.json node_modules
Prints the Lambda CodeSha256 (base64 sha256) of the result.
"""
import base64, hashlib, os, sys, zipfile

src, out, *roots = sys.argv[1:]
FIXED = (1980, 1, 1, 0, 0, 0)
files = []
for root in roots:
    p = os.path.join(src, root)
    if os.path.isfile(p):
        files.append(root)
        continue
    for dirpath, dirnames, filenames in os.walk(p):
        dirnames.sort()
        for f in sorted(filenames):
            full = os.path.join(dirpath, f)
            files.append(os.path.relpath(full, src))
files = sorted({f.replace(os.sep, '/') for f in files})
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for rel in files:
        info = zipfile.ZipInfo(rel, date_time=FIXED)
        info.external_attr = (0o100644 << 16)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.create_system = 3  # unix
        with open(os.path.join(src, rel), 'rb') as fh:
            z.writestr(info, fh.read(), compresslevel=9)
digest = hashlib.sha256(open(out, 'rb').read()).digest()
print(f"entries={len(files)} backslash_entries={sum(chr(92) in f for f in files)} CodeSha256={base64.b64encode(digest).decode()}")
