document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("converter-form");
  const fileInput = document.getElementById("ebcdic-files");
  const dropZone = document.getElementById("drop-zone");
  const fileListContainer = document.getElementById("file-list-container");
  const fileList = document.getElementById("file-list");
  const progressContainer = document.getElementById("progress-container");
  const resultsContainer = document.getElementById("results-container");

  let selectedFiles = [];

  // Format file sizes nicely
  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Update input.files so the form submit payload uses current selection
  function updateFileInput() {
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
    
    // Toggle input required state based on selection count
    if (selectedFiles.length > 0) {
      fileInput.removeAttribute("required");
    } else {
      fileInput.setAttribute("required", "required");
    }
  }

  // Render selected files as chips
  function renderFileList() {
    fileList.innerHTML = "";
    if (selectedFiles.length === 0) {
      fileListContainer.classList.add("hidden");
      return;
    }

    fileListContainer.classList.remove("hidden");
    selectedFiles.forEach((file, index) => {
      const chip = document.createElement("div");
      chip.className = "file-chip";
      chip.innerHTML = `
        <div class="file-chip-info">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-accent);">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span class="file-chip-name" title="${file.name}">${file.name}</span>
          <span class="file-chip-size">${formatBytes(file.size)}</span>
        </div>
        <button type="button" class="file-chip-remove" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      fileList.appendChild(chip);
    });

    // Wire up delete events on chips
    document.querySelectorAll(".file-chip-remove").forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const index = parseInt(this.getAttribute("data-index"));
        selectedFiles.splice(index, 1);
        renderFileList();
        updateFileInput();
      });
    });
  }

  // Handle manual selection
  fileInput.addEventListener("change", function () {
    handleNewFiles(this.files);
  });

  // Trigger file browser when clicking dropzone container
  dropZone.addEventListener("click", function () {
    fileInput.click();
  });

  // Drag and drop event listeners
  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add("dragover"), false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove("dragover"), false);
  });

  dropZone.addEventListener("drop", function (e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleNewFiles(files);
  });

  function handleNewFiles(files) {
    let invalidCount = 0;
    Array.from(files).forEach(file => {
      // Validate file extension
      if (file.name.toLowerCase().endsWith(".ebc")) {
        // Prevent duplicate file entries
        if (!selectedFiles.some(f => f.name === file.name)) {
          selectedFiles.push(file);
        }
      } else {
        invalidCount++;
      }
    });

    if (invalidCount > 0) {
      alert(`Skipped ${invalidCount} file(s). Only mainframe EBCDIC (.ebc) files are allowed!`);
    }

    renderFileList();
    updateFileInput();
  }

  // Submit and upload processing
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    
    if (!selectedFiles.length) {
      return alert("Please select or drop at least one EBCDIC (.ebc) file.");
    }

    progressContainer.innerHTML = "";
    resultsContainer.innerHTML = "";

    // Create progress components
    const progressWrapper = document.createElement("div");
    progressWrapper.className = "progress-wrapper";
    progressWrapper.innerHTML = `
      <div class="progress-label">
        <span class="progress-status-text">Uploading and converting data...</span>
        <span class="progress-percent">0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%;"></div>
      </div>
    `;
    progressContainer.appendChild(progressWrapper);

    const progressFill = progressWrapper.querySelector(".progress-fill");
    const progressPercent = progressWrapper.querySelector(".progress-percent");
    const progressStatusText = progressWrapper.querySelector(".progress-status-text");

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append("files", file));
    formData.append("encoding", document.getElementById("source-encoding").value || "auto");
    formData.append("dest_encoding", document.getElementById("dest-encoding").value || "utf-8");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);

    xhr.upload.addEventListener("progress", function (e) {
      if (e.lengthComputable) {
        let percent = Math.round((e.loaded / e.total) * 80);
        progressFill.style.width = percent + "%";
        progressPercent.innerText = percent + "%";
        if (percent >= 80) {
          progressStatusText.innerText = "Analyzing EBCDIC encoding heuristics...";
        }
      }
    });

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const results = JSON.parse(xhr.responseText);

          // Fast smooth complete transition from 80% to 100%
          let currentPercent = parseInt(progressFill.style.width) || 80;
          progressStatusText.innerText = "Finalizing conversion packages...";
          
          const interval = setInterval(() => {
            currentPercent += 2;
            if (currentPercent >= 100) {
              currentPercent = 100;
              clearInterval(interval);
              progressStatusText.innerText = "Conversion completed successfully!";
            }
            progressFill.style.width = currentPercent + "%";
            progressPercent.innerText = currentPercent + "%";
          }, 15);

          // Render results after completion animation finishes
          setTimeout(() => {
            resultsContainer.innerHTML = "";
            results.forEach(result => {
              const card = document.createElement("div");
              
              if (result.error) {
                card.className = "result-card error";
                card.innerHTML = `
                  <div class="result-header">
                    <div class="result-title-block">
                      <div class="result-file-icon" style="color: var(--error-color);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <h3 title="${result.filename}">${result.filename}</h3>
                    </div>
                    <span class="status-badge error">Failed</span>
                  </div>
                  <div class="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>${result.error}</span>
                  </div>
                `;
              } else {
                const hasWarnings = result.replacement_count > 0;
                card.className = `result-card ${hasWarnings ? "warning" : "success"}`;
                
                card.innerHTML = `
                  <div class="result-header">
                    <div class="result-title-block">
                      <div class="result-file-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <h3 title="${result.filename}">${result.filename}</h3>
                    </div>
                    <span class="status-badge ${hasWarnings ? "warning" : "success"}">
                      ${hasWarnings ? "Warnings" : "Ready"}
                    </span>
                  </div>
                  
                  <div class="metrics-grid">
                    <div class="metric-item">
                      <div class="metric-label">Source Encoding</div>
                      <div class="metric-value"><strong>${result.used_encoding.toUpperCase()}</strong></div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-label">Target Encoding</div>
                      <div class="metric-value"><strong>${result.dest_encoding.toUpperCase()}</strong></div>
                    </div>
                    <div class="metric-item" style="grid-column: span 2;">
                      <div class="metric-label">Replacement Characters</div>
                      <div class="metric-value" style="color: ${hasWarnings ? "var(--warning-color)" : "var(--success-gradient)"}">
                        ${result.replacement_count} ${hasWarnings ? "⚠️ (Invalid translations)" : "✓ (Clean conversion)"}
                      </div>
                    </div>
                  </div>

                  <div class="download-buttons">
                    <a href="${result.zip_download}" class="btn download">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download UTF + Report (ZIP)
                    </a>
                  </div>
                `;
              }
              resultsContainer.appendChild(card);
            });
          }, 600);
        } else {
          progressStatusText.innerText = "Error: Conversion failed.";
          alert("Conversion failed. Please try again.");
        }
      }
    };

    xhr.send(formData);
  });
});