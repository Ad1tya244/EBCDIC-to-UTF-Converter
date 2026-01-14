document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("converter-form");
  const progressContainer = document.getElementById("progress-container");
  const resultsContainer = document.getElementById("results-container");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const files = document.querySelector("input[name='files']").files;
    if (!files.length) return alert("Please select at least one file.");

    for (let file of files) {
      if (!file.name.toLowerCase().endsWith(".ebc")) {
        alert("Only EBCDIC (.ebc) files are allowed!");
        return;
      }
    }

    progressContainer.innerHTML = "";
    resultsContainer.innerHTML = "";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.innerText = "0%";
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("files", file));
    formData.append("encoding", document.getElementById("source-encoding").value || "auto");
    formData.append("dest_encoding", document.getElementById("dest-encoding").value || "utf-8");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);

    xhr.upload.addEventListener("progress", function (e) {
      if (e.lengthComputable) {
        let percent = Math.round((e.loaded / e.total) * 80);
        progressFill.style.width = percent + "%";
        progressFill.innerText = percent + "%";
      }
    });

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const results = JSON.parse(xhr.responseText);

        let currentPercent = parseInt(progressFill.style.width) || 0;
        const interval = setInterval(() => {
          currentPercent += 1;
          if (currentPercent >= 100) {
            currentPercent = 100;
            clearInterval(interval);
          }
          progressFill.style.width = currentPercent + "%";
          progressFill.innerText = currentPercent + "%";
        }, 20);

        setTimeout(() => {
          resultsContainer.innerHTML = "";
          results.forEach(result => {
            const card = document.createElement("div");
            card.className = "result-card";
            card.innerHTML = `
              <h3>${result.filename}</h3>
              <p>Detected Source Encoding: <strong>${result.used_encoding}</strong></p>
              <p>Destination Encoding: <strong>${result.dest_encoding}</strong></p>
              <p>Replacement Characters: ${result.replacement_count}</p>
              <div class="download-buttons">
                <a href="${result.zip_download}" class="btn download">Download UTF + Report (ZIP)</a>
              </div>
            `;
            resultsContainer.appendChild(card);
          });
        }, 500);
      }
    };

    xhr.send(formData);
  });
});