import urllib.request
import os

def download_file(url, filepath):
    print(f"Downloading {os.path.basename(filepath)}...")
    try:
        urllib.request.urlretrieve(url, filepath)
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"[OK] Downloaded {os.path.basename(filepath)} ({size_mb:.1f} MB)")
        return True
    except Exception as e:
        print(f"[ERROR] Error downloading {os.path.basename(filepath)}: {e}")
        return False

# Create models directory
os.makedirs("models", exist_ok=True)

# Download Amy model (smallest, good quality - 60MB)
models = [
    ("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx",
     "models/en_US-amy-medium.onnx"),
    ("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json",
     "models/en_US-amy-medium.onnx.json"),
]

print("=" * 50)
print("Quick Download - Amy Voice Model (60MB)")
print("=" * 50)
print()

for url, filepath in models:
    if not os.path.exists(filepath):
        download_file(url, filepath)
    else:
        print(f"[OK] {os.path.basename(filepath)} already exists")

print()
print("=" * 50)
print("Amy model ready! You can now test the app.")
print("=" * 50)
