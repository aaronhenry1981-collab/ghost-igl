"""Local, credential-free Lambda packaging; writes only a new named output."""
import argparse, base64, hashlib, json, pathlib, shutil, zipfile
root = pathlib.Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--out', default='squad-package')
args = parser.parse_args()
target = pathlib.Path(args.out).resolve()
archive = pathlib.Path(str(target) + '.zip')
if target.exists() or archive.exists():
    raise SystemExit('Output already exists. Preserve it and choose a new named output.')
source = root / 'lambda/squad'
target.mkdir(parents=True)
names = ['index.mjs', 'service.mjs', 'dynamo-repository.mjs', 'hosting-policy.mjs', 'history-cursor.mjs', 'gateway-auth.mjs', 'websocket.mjs', 'package.json', 'package-lock.json']
for name in names:
    shutil.copy2(source / name, target / name)
domain = (root / 'src/features/squad/domain.mjs').read_bytes()
(target / 'domain.mjs').write_bytes(domain)
shutil.copytree(source / 'node_modules', target / 'node_modules')
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as out:
    for path in sorted(target.rglob('*')):
        if path.is_file():
            info = zipfile.ZipInfo(path.relative_to(target).as_posix(), date_time=(2026, 11, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            out.writestr(info, path.read_bytes())
raw = archive.read_bytes(); digest = hashlib.sha256(raw).digest()
receipt = {'sha256': digest.hex(), 'codeSha256Base64': base64.b64encode(digest).decode(), 'bytes': len(raw), 'domainSha256': hashlib.sha256(domain).hexdigest(), 'sourceFiles': {name: hashlib.sha256((source / name).read_bytes()).hexdigest() for name in names}, 'codeBucket': 'recon-player-data-sam-artifacts-183678667221', 'codeKey': f'recon-squad/{digest.hex()}/lambda.zip', 'uploaded': False}
pathlib.Path(str(target) + '.receipt.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
print(json.dumps(receipt, indent=2))
