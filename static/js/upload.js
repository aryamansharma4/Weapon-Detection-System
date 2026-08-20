/* =============================================================
   WDS Upload Detection JS
   Drag & drop + client-side preview layered on top of the
   existing multipart form POST to /upload. The form still
   submits normally to the server; nothing here talks to the
   backend directly.
============================================================= */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var dropzone = document.querySelector("[data-dropzone]");
    var input = document.querySelector("[data-file-input]");
    var form = document.querySelector("[data-upload-form]");
    if (!dropzone || !input || !form) return;

    var previewWrap = document.querySelector("[data-preview-wrap]");
    var previewImg = document.querySelector("[data-preview-img]");
    var previewName = document.querySelector("[data-preview-name]");
    var removeBtn = document.querySelector("[data-preview-remove]");
    var submitBtn = form.querySelector('[type="submit"]');
    var dropzoneText = dropzone.querySelector("[data-dropzone-text]");

    function updateSubmitState() {
      if (!submitBtn) return;
      var hasFile = input.files && input.files.length > 0;
      submitBtn.toggleAttribute("disabled", !hasFile);
    }

    function readAndPreview(file) {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) {
        window.WDS && window.WDS.showToast("Please choose an image file.", "error");
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        if (previewImg) previewImg.src = e.target.result;
        if (previewName) previewName.textContent = file.name;
        if (previewWrap) previewWrap.classList.add("is-visible");
        if (dropzoneText) dropzone.style.display = "none";
      };
      reader.readAsDataURL(file);
    }

    function setFiles(fileList) {
      try {
        input.files = fileList;
      } catch (e) {
        /* Some browsers disallow programmatic FileList assignment on drop
           in older engines; input still holds the dropped file via change. */
      }
      if (fileList && fileList[0]) readAndPreview(fileList[0]);
      updateSubmitState();
    }

    dropzone.addEventListener("click", function () {
      input.click();
    });

    dropzone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });

    ["dragenter", "dragover"].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) setFiles(files);
    });

    input.addEventListener("change", function () {
      if (input.files && input.files.length) readAndPreview(input.files[0]);
      updateSubmitState();
    });

    if (removeBtn) {
      removeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        input.value = "";
        if (previewWrap) previewWrap.classList.remove("is-visible");
        if (dropzone) dropzone.style.display = "";
        updateSubmitState();
      });
    }

    form.addEventListener("submit", function (e) {
      if (!input.files || input.files.length === 0) {
        e.preventDefault();
        window.WDS && window.WDS.showToast("Select an image before running detection.", "error");
      }
    });

    updateSubmitState();
  });
})();
