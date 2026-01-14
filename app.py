#!/usr/bin/env python3
"""
app.py - Flask Web UI for EBCDIC → Unicode converter (extended)
"""

import os
import zipfile
from flask import Flask, request, render_template, send_from_directory, jsonify
from werkzeug.utils import secure_filename
from convert import convert_file, EBCDIC_ENCODINGS

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

ALLOWED_EXTENSIONS = {"ebc"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def is_probably_ebcdic(filepath):
    """Quick heuristic: check if file content is likely EBCDIC."""
    with open(filepath, "rb") as f:
        chunk = f.read(4096)

    valid_count = 0
    for enc in EBCDIC_ENCODINGS:
        try:
            text = chunk.decode(enc, errors="replace")
            replacement_ratio = text.count("\ufffd") / max(1, len(text))
            if replacement_ratio < 0.2:
                valid_count += 1
        except Exception:
            continue

    return valid_count > 0


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        files = request.files.getlist("files")
        ccsid = request.form.get("encoding", "auto")
        dest_encoding = request.form.get("dest_encoding") or "utf-8"

        results = []

        for file in files:
            if not (file and allowed_file(file.filename)):
                results.append({
                    "filename": file.filename,
                    "error": "Invalid file type. Only .ebc files are allowed."
                })
                continue

            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            if not is_probably_ebcdic(filepath):
                os.remove(filepath)
                results.append({
                    "filename": filename,
                    "error": "File rejected: Content does not look like valid EBCDIC data."
                })
                continue

            report_path = os.path.splitext(filepath)[0] + "_report.json"
            result = convert_file(
                input_path=filepath,
                ccsid=ccsid,
                dest_encoding=dest_encoding,
                report_path=report_path
            )

            # Create zip with UTF file + JSON report
            zip_filename = os.path.splitext(filename)[0] + "_converted.zip"
            zip_path = os.path.join(UPLOAD_FOLDER, zip_filename)
            with zipfile.ZipFile(zip_path, "w") as zipf:
                zipf.write(result["output_path"], os.path.basename(result["output_path"]))
                zipf.write(report_path, os.path.basename(report_path))

            results.append({
                "filename": filename,
                "zip_download": f"/uploads/{zip_filename}",
                "replacement_count": result["replacement_count"],
                "used_encoding": result["used_encoding"],
                "dest_encoding": dest_encoding.upper()  # <-- added destination encoding
            })

        return jsonify(results)

    return render_template("index.html", known_encodings=EBCDIC_ENCODINGS)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)