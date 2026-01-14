# EBCDIC to UTF Converter – Mainframe Data Integrity Solution

## 📌 Project Title
EBCDIC to UTF Conversion System for Reducing Character Corruption in Mainframe Data Transfers

---

## 📖 Project Overview
Mainframe systems commonly store and exchange data using **EBCDIC (Extended Binary Coded Decimal Interchange Code)** encoding, while modern distributed systems and applications primarily use **UTF (UTF-8)** encoding. During data migration, file transfers, or system integration, improper or naive conversion techniques often lead to **corrupted characters, unreadable symbols, and data integrity issues**.

This project provides a **robust EBCDIC → UTF conversion solution** implemented as a **Flask-based web application**. It focuses on:
- Accurate encoding detection
- Controlled decoding and re-encoding
- Reducing character corruption during conversion
- Making the conversion process accessible through a simple web interface

The application allows users to upload EBCDIC-encoded files, processes them safely, and outputs UTF-encoded files with minimal data loss.

---

## 🎯 Problem Statement
- Mainframe-generated files encoded in EBCDIC often become corrupted when opened or processed in UTF-based systems.
- Direct conversions can introduce invalid characters due to encoding mismatches.
- There is a need for a **controlled, repeatable, and transparent conversion mechanism** that minimizes corruption and preserves data integrity.

---

## ✅ Solution Approach
- Detect the EBCDIC encoding using reliable libraries.
- Decode EBCDIC data carefully instead of forcing UTF conversion.
- Re-encode validated content into UTF format.
- Provide a web-based interface to make the process user-friendly.
- Allow easy download of converted UTF files.

---

## 🏗️ System Architecture
User (Web Browser)
-->
Flask Web Application (app.py)
- File Upload Handler
- Encoding Detection (chardet)
- Data Processing (pandas, numpy)
- EBCDIC → UTF Conversion Logic (convert.py)
-->
UTF Encoded Output File (zip)
-->
Download to User System

---

## 🛠️ Tools & Technologies Used
- **Programming Language:** Python 3
- **Backend Framework:** Flask
- **Encoding Detection:** chardet
- **Data Processing:** pandas, numpy
- **Frontend:** HTML, CSS (Flask Templates)
- **Development Environment:** VS Code
- **Operating System:** macOS / Linux / Windows

---

## 📦 Dependencies Required
Install the following Python libraries inside a virtual environment:
- flask
- pandas
- numpy
- chardet

---

## 🚀 How to Run the Project (macOS / zsh)
1. Create virtual environment : python3 -m venv venv
2. Activate venv : source venv/bin/activate
3. Install dependencies : pip3 install flask pandas numpy chardet
4. Run flask application : python3 app.py

## To terminate the process
1. In project terminal : CTRL + C 
2. Deactivate venv : deactivate

---

## 📈 Key Outcomes
	•	Reduced corrupted characters during EBCDIC to UTF conversion
	•	Improved reliability of mainframe data integration
	•	Simple and accessible conversion workflow
	•	Demonstrates practical handling of real-world encoding issues

---

## 🔮 Future Enhancements
	•	Support for batch file conversion
	•	Encoding selection options
	•	Logging and conversion reports
	•	Deployment on cloud platforms
	•	Enhanced UI and validation checks

---

## 👨‍💻 Author
Developed as part of a system integration and data integrity solution focused on mainframe encoding challenges.