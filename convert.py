#!/usr/bin/env python3
"""
convert.py - EBCDIC → Unicode converter (extended with auto-UTF selection)
"""

import os
import json

# Supported IBM EBCDIC encodings
EBCDIC_ENCODINGS = [
    "cp037", "cp273", "cp277", "cp278", "cp280", "cp281", "cp284",
    "cp285", "cp297", "cp420", "cp424", "cp437", "cp500", "cp875",
    "cp880", "cp891", "cp903", "cp904", "cp905", "cp918", "cp1026",
    "cp1047", "cp1140", "cp1141", "cp1142", "cp1143", "cp1144", "cp1145",
    "cp1146", "cp1147", "cp1148", "cp1149"
]

def detect_encoding(raw_data: bytes) -> str:
    """Heuristic detection: highest number of valid characters"""
    best_score = -1
    best_enc = None
    for enc in EBCDIC_ENCODINGS:
        try:
            text = raw_data.decode(enc, errors="replace")
            score = text.count("\ufffd")  # fewer replacement chars = better
            if best_score == -1 or score < best_score:
                best_score = score
                best_enc = enc
        except Exception:
            continue
    return best_enc or "cp037"

def choose_optimal_utf(text: str):
    """
    Choose UTF encoding that is safest:
    - fewer bytes lost
    - minimal replacement characters
    """
    encodings = ["utf-8", "utf-16", "utf-32"]
    best_enc = "utf-8"
    min_size = None
    for enc in encodings:
        try:
            encoded = text.encode(enc, errors="replace")
            replacement_count = encoded.count(b'\xef\xbf\xbd') if enc == "utf-8" else text.count("\ufffd")
            size = len(encoded) + replacement_count * 1000  # penalize replacement heavily
            if min_size is None or size < min_size:
                min_size = size
                best_enc = enc
        except Exception:
            continue
    return best_enc

def convert_file(input_path: str, ccsid: str = None, dest_encoding: str = None, report_path: str = None):
    """Convert file and save report"""
    with open(input_path, "rb") as f:
        raw_data = f.read()

    used_encoding = ccsid.lower() if ccsid and ccsid.lower() != "auto" else detect_encoding(raw_data)
    text = raw_data.decode(used_encoding, errors="replace")
    replacement_count = text.count("\ufffd")

    # Auto-select UTF if dest_encoding not specified
    if not dest_encoding:
        dest_enc = choose_optimal_utf(text)
    else:
        dest_enc = dest_encoding.lower()

    out_path = os.path.splitext(input_path)[0] + f"_{dest_enc}.txt"
    with open(out_path, "w", encoding=dest_enc) as f_out:
        f_out.write(text)

    report = {
        "input_file": input_path,
        "output_file": out_path,
        "source_encoding": used_encoding,
        "destination_encoding": dest_enc.upper(),
        "input_bytes": len(raw_data),
        "output_bytes": len(text.encode(dest_enc)),
        "replacement_characters": replacement_count,
    }

    if report_path:
        with open(report_path, "w", encoding="utf-8") as rf:
            json.dump(report, rf, indent=2, ensure_ascii=False)

    return {
        "output_path": out_path,
        "replacement_count": replacement_count,
        "used_encoding": used_encoding,
        "destination_encoding": dest_enc
    }