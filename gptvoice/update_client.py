import boto3
from botocore.config import Config
from pathlib import Path
import tqdm

my_config = Config(
    region_name = 'us-east-2',
)

BUCKET_NAME: str = "gptvoicewebsite"

def deduce_content_type(path: Path) -> str:
    if path.name.endswith('.js'):
        return 'application/javascript'
    if path.name.endswith('.html'):
        return 'text/html'
    if path.name.endswith('.txt'):
        return 'text/plain'
    if path.name.endswith('.json'):
        return 'application/json'
    if path.name.endswith('.ico'):
        return 'image/x-icon'
    if path.name.endswith('.svg'):
        return 'image/svg+xml'
    if path.name.endswith('.css'):
        return 'text/css'
    if path.name.endswith('.jpg') or path.name.endswith('.jpeg'):
        return 'image/jpeg'
    if path.name.endswith('.png'):
        return 'image/png'
    if path.name.endswith('.webp'):
        return 'image/webp'
    if path.name.endswith('.map'):
        return 'binary/octet-stream'
    
    return 'application/octet-stream'

def do_upload():
    s3 = boto3.client('s3', config=my_config)
    build_dir = Path(__file__).resolve().parent / "build"
    if not build_dir.is_dir():
        return
    
    for each_file in tqdm.tqdm(list(build_dir.glob("**/*"))):
        if not each_file.is_file():
            continue
        outp = str(each_file.relative_to(build_dir)).replace("\\", "/")
        #with open(each_file, "rb") as f:
        s3.upload_file(str(each_file.resolve()), BUCKET_NAME, outp, ExtraArgs={
            "ContentType": deduce_content_type(each_file),
            'ACL':'public-read',
        })

if __name__ == "__main__":
    do_upload()