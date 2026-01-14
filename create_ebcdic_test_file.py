import os

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# CP500-safe characters: A-Z, a-z, 0-9, space, basic punctuation, and CP500-supported Nordic letters
safe_text = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789 .,;:!?-_" 
) * 10000  # ~1.2MB

file_path = os.path.join(UPLOAD_FOLDER, "large_cp500_sample.ebc")
with open(file_path, "wb") as f:
    f.write(safe_text.encode("cp500", errors="strict"))

print(f"Large CP500-compatible EBCDIC file created at: {file_path}")