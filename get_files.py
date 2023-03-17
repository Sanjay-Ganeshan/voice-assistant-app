from pathlib import Path
root = Path("gptvoice/build")
for eachpath in root.glob("**/*"):
    print(f"'{str(eachpath.relative_to(root))}',")