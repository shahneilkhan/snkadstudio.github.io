```javascript
/* =========================================================
   SNK AD STUDIO
   Main Application Script
   V1 Foundation
   ========================================================= */

"use strict";


/* =========================================================
   GLOBAL APP
   ========================================================= */

const SNK = {

  version: "1.0.0",

  storageKey: "snk-ad-studio-projects",

  settingsKey: "snk-ad-studio-settings",

  currentProject: null,

  mediaRecorder: null,

  recordedChunks: [],

  stream: null,

  isRecording: false,

  recordingStartedAt: null,

  recordingTimer: null

};


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector, parent = document) => {
  return parent.querySelector(selector);
};

const $$ = (selector, parent = document) => {
  return [...parent.querySelectorAll(selector)];
};


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeTheme();

  initializeNavigation();

  initializeQuickStart();

  initializeTemplates();

  initializeProjectSystem();

  initializeKeyboardShortcuts();

  initializeSmoothInteractions();

  console.log(
    `%cSNK Ad Studio ${SNK.version}`,
    "font-weight:700;color:#d8a64b;"
  );

});


/* =========================================================
   THEME
   ========================================================= */

function initializeTheme() {

  const toggle = $("#themeToggle");

  if (!toggle) return;

  const savedTheme =
    localStorage.getItem("snk-theme");

  if (savedTheme === "light") {

    document.body.classList.add("light-mode");

  }

  updateThemeButton();

  toggle.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const theme =
      document.body.classList.contains("light-mode")
        ? "light"
        : "dark";

    localStorage.setItem(
      "snk-theme",
      theme
    );

    updateThemeButton();

  });

}


function initializeTheme() {

  const toggle = $("#themeToggle");

  if (!toggle) return;

  const savedTheme =
    localStorage.getItem("snk-theme");

  if (savedTheme === "light") {

    document.body.classList.add("light-mode");

  }

  updateThemeButton();

  toggle.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const theme =
      document.body.classList.contains("light-mode")
        ? "light"
        : "dark";

    localStorage.setItem(
      "snk-theme",
      theme
    );

    updateThemeButton();

  });

}


function updateThemeButton() {

  const button = $("#themeToggle");

  if (!button) return;

  const isLight =
    document.body.classList.contains("light-mode");

  button.textContent =
    isLight ? "☀" : "◐";

  button.setAttribute(
    "aria-label",
    isLight
      ? "Switch to dark mode"
      : "Switch to light mode"
  );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

  $$('a[href^="#"]').forEach(link => {

    link.addEventListener("click", event => {

      const targetID =
        link.getAttribute("href");

      if (
        !targetID ||
        targetID === "#"
      ) {

        event.preventDefault();

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

        return;

      }

      const target =
        document.querySelector(targetID);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    });

  });

}


/* =========================================================
   QUICK START
   ========================================================= */

function initializeQuickStart() {

  const cards =
    $$(".quick-card");

  cards.forEach(card => {

    card.addEventListener("click", () => {

      const title =
        $("h3", card)?.textContent.trim();

      if (!title) return;

      switch (title) {

        case "New Ad":
          createNewProject();
          break;

        case "Presenter Video":
          openPresenterMode();
          break;

        case "Animated Text":
          createTemplateProject(
            "Animated Text"
          );
          break;

        case "Social Ad":
          createTemplateProject(
            "Social Ad"
          );
          break;

        default:
          showToast(
            "Starting new project..."
          );

      }

    });

  });

}


/* =========================================================
   TEMPLATES
   ========================================================= */

function initializeTemplates() {

  const templateCards =
    $$(".template-card");

  templateCards.forEach(card => {

    const button =
      $("button", card);

    if (!button) return;

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        const name =
          $("h3", card)
            ?.textContent
            .trim();

        if (!name) return;

        createTemplateProject(name);

      }
    );

  });

}


function createTemplateProject(templateName) {

  const project = {

    id: generateID(),

    name: templateName,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

    format: "9:16",

    duration: 15,

    template: templateName,

    scenes: [],

    layers: [],

    assets: [],

    audio: [],

    settings: {

      fps: 30,

      resolution: "1080p"

    }

  };

  addProject(project);

  SNK.currentProject = project;

  showToast(
    `${templateName} project created`
  );

  setTimeout(() => {

    showEditorComingSoon();

  }, 350);

}


/* =========================================================
   NEW PROJECT
   ========================================================= */

function createNewProject() {

  const project = {

    id: generateID(),

    name: "Untitled Ad",

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

    format: "9:16",

    duration: 15,

    template: null,

    scenes: [],

    layers: [],

    assets: [],

    audio: [],

    settings: {

      fps: 30,

      resolution: "1080p"

    }

  };

  addProject(project);

  SNK.currentProject = project;

  showToast(
    "New ad project created"
  );

  setTimeout(() => {

    showEditorComingSoon();

  }, 350);

}


/* =========================================================
   PROJECT STORAGE
   ========================================================= */

function getProjects() {

  try {

    const projects =
      localStorage.getItem(
        SNK.storageKey
      );

    return projects
      ? JSON.parse(projects)
      : [];

  } catch (error) {

    console.error(
      "Could not load projects:",
      error
    );

    return [];

  }

}


function saveProjects(projects) {

  try {

    localStorage.setItem(
      SNK.storageKey,
      JSON.stringify(projects)
    );

    return true;

  } catch (error) {

    console.error(
      "Could not save projects:",
      error
    );

    showToast(
      "Could not save project"
    );

    return false;

  }

}


function addProject(project) {

  const projects =
    getProjects();

  projects.unshift(project);

  saveProjects(projects);

}


function updateProject(project) {

  const projects =
    getProjects();

  const index =
    projects.findIndex(
      item => item.id === project.id
    );

  if (index === -1) {

    projects.unshift(project);

  } else {

    projects[index] = project;

  }

  saveProjects(projects);

}


function deleteProject(projectID) {

  const projects =
    getProjects()
      .filter(
        project =>
          project.id !== projectID
      );

  saveProjects(projects);

}


function duplicateProject(projectID) {

  const projects =
    getProjects();

  const original =
    projects.find(
      project =>
        project.id === projectID
    );

  if (!original) return null;

  const duplicate =
    structuredClone
      ? structuredClone(original)
      : JSON.parse(
          JSON.stringify(original)
        );

  duplicate.id =
    generateID();

  duplicate.name =
    `${original.name} Copy`;

  duplicate.createdAt =
    new Date().toISOString();

  duplicate.updatedAt =
    new Date().toISOString();

  projects.unshift(duplicate);

  saveProjects(projects);

  return duplicate;

}


/* =========================================================
   PROJECT ID
   ========================================================= */

function generateID() {

  return (
    "snk_" +
    Date.now().toString(36) +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 8)
  );

}


/* =========================================================
   PRESENTER MODE
   ========================================================= */

function openPresenterMode() {

  const modal =
    createPresenterModal();

  document.body.appendChild(modal);

  requestCamera();

}


/* =========================================================
   PRESENTER MODAL
   ========================================================= */

function createPresenterModal() {

  const modal =
    document.createElement("div");

  modal.className =
    "snk-presenter-modal";

  modal.innerHTML = `

    <div class="presenter-overlay"></div>

    <div class="presenter-window">

      <div class="presenter-header">

        <div>

          <strong>
            SNK Presenter Mode
          </strong>

          <span>
            Camera + microphone recording
          </span>

        </div>

        <button
          class="presenter-close"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <div class="presenter-stage">

        <video
          class="presenter-video"
          autoplay
          muted
          playsinline
        ></video>

        <div class="presenter-placeholder">

          <div class="presenter-camera-icon">
            🎥
          </div>

          <strong>
            Camera preview
          </strong>

          <span>
            Allow camera access to begin.
          </span>

        </div>

        <div class="recording-indicator">

          <span></span>

          <strong>
            REC
          </strong>

          <time>
            00:00
          </time>

        </div>

      </div>


      <div class="presenter-controls">

        <button
          class="presenter-control"
          data-action="camera"
        >
          🎥 Camera
        </button>

        <button
          class="presenter-control"
          data-action="microphone"
        >
          🎙 Microphone
        </button>

        <button
          class="presenter-record"
          data-action="record"
        >
          <span></span>
          Start Recording
        </button>

        <button
          class="presenter-control"
          data-action="stop"
          disabled
        >
          ■ Stop
        </button>

      </div>


      <div class="presenter-footer">

        <span>
          Your recording stays in this browser
          until you save/export it.
        </span>

        <button
          class="presenter-save"
          disabled
        >
          Save Recording
        </button>

      </div>

    </div>

  `;

  const closeButton =
    $(".presenter-close", modal);

  const overlay =
    $(".presenter-overlay", modal);

  closeButton.addEventListener(
    "click",
    () => closePresenterModal(modal)
  );

  overlay.addEventListener(
    "click",
    () => closePresenterModal(modal)
  );

  const recordButton =
    $('[data-action="record"]', modal);

  const stopButton =
    $('[data-action="stop"]', modal);

  const saveButton =
    $(".presenter-save", modal);

  recordButton.addEventListener(
    "click",
    () => startRecording(modal)
  );

  stopButton.addEventListener(
    "click",
    () => stopRecording(modal)
  );

  saveButton.addEventListener(
    "click",
    () => saveRecording()
  );

  return modal;

}


/* =========================================================
   CAMERA
   ========================================================= */

async function requestCamera() {

  const modal =
    $(".snk-presenter-modal");

  if (!modal) return;

  const video =
    $(".presenter-video", modal);

  const placeholder =
    $(".presenter-placeholder", modal);

  try {

    SNK.stream =
      await navigator.mediaDevices.getUserMedia({

        video: {

          width: {
            ideal: 1920
          },

          height: {
            ideal: 1080
          },

          facingMode: "user"

        },

        audio: true

      });

    video.srcObject =
      SNK.stream;

    video.style.display =
      "block";

    placeholder.style.display =
      "none";

    showToast(
      "Camera and microphone connected"
    );

  } catch (error) {

    console.error(
      "Camera error:",
      error
    );

    placeholder.innerHTML = `

      <div class="presenter-camera-icon">
        ⚠
      </div>

      <strong>
        Camera access required
      </strong>

      <span>
        Please allow camera and microphone
        permission in your browser.
      </span>

      <button
        class="permission-retry"
      >
        Try Again
      </button>

    `;

    const retry =
      $(".permission-retry", placeholder);

    retry.addEventListener(
      "click",
      requestCamera
    );

  }

}


/* =========================================================
   RECORDING
   ========================================================= */

function startRecording(modal) {

  if (!SNK.stream) {

    showToast(
      "Connect your camera first"
    );

    return;

  }

  if (
    !window.MediaRecorder
  ) {

    showToast(
      "Recording is not supported in this browser"
    );

    return;

  }

  SNK.recordedChunks = [];

  let mimeType =
    "video/webm;codecs=vp9,opus";

  if (
    !MediaRecorder.isTypeSupported(
      mimeType
    )
  ) {

    mimeType =
      "video/webm;codecs=vp8,opus";

  }

  if (
    !MediaRecorder.isTypeSupported(
      mimeType
    )
  ) {

    mimeType =
      "video/webm";

  }

  try {

    SNK.mediaRecorder =
      new MediaRecorder(
        SNK.stream,
        {
          mimeType
        }
      );

  } catch (error) {

    console.error(error);

    showToast(
      "Could not start recorder"
    );

    return;

  }

  SNK.mediaRecorder.ondataavailable =
    event => {

      if (
        event.data &&
        event.data.size > 0
      ) {

        SNK.recordedChunks.push(
          event.data
        );

      }

    };


  SNK.mediaRecorder.onstop =
    () => {

      const blob =
        new Blob(
          SNK.recordedChunks,
          {
            type: mimeType
          }
        );

      SNK.recordedBlob =
        blob;

      const saveButton =
        $(".presenter-save", modal);

      if (saveButton) {

        saveButton.disabled =
          false;

      }

      showToast(
        "Recording ready"
      );

    };


  SNK.mediaRecorder.start(
    250
  );

  SNK.isRecording = true;

  SNK.recordingStartedAt =
    Date.now();

  updateRecordingUI(
    modal,
    true
  );

  startRecordingTimer(modal);

}


/* =========================================================
   STOP RECORDING
   ========================================================= */

function stopRecording(modal) {

  if (
    !SNK.mediaRecorder ||
    SNK.mediaRecorder.state ===
      "inactive"
  ) {

    return;

  }

  SNK.mediaRecorder.stop();

  SNK.isRecording = false;

  stopRecordingTimer();

  updateRecordingUI(
    modal,
    false
  );

}


/* =========================================================
   RECORDING UI
   ========================================================= */

function updateRecordingUI(
  modal,
  recording
) {

  const recordButton =
    $('[data-action="record"]', modal);

  const stopButton =
    $('[data-action="stop"]', modal);

  const indicator =
    $(".recording-indicator", modal);

  if (recording) {

    recordButton.disabled =
      true;

    stopButton.disabled =
      false;

    indicator.classList.add(
      "active"
    );

    recordButton.innerHTML = `
      <span class="recording-pulse"></span>
      Recording...
    `;

  } else {

    recordButton.disabled =
      false;

    stopButton.disabled =
      true;

    indicator.classList.remove(
      "active"
    );

    recordButton.innerHTML = `
      <span></span>
      Start Recording
    `;

  }

}


/* =========================================================
   RECORDING TIMER
   ========================================================= */

function startRecordingTimer(modal) {

  const timeElement =
    $("time", modal);

  if (!timeElement) return;

  clearInterval(
    SNK.recordingTimer
  );

  SNK.recordingTimer =
    setInterval(() => {

      if (!SNK.recordingStartedAt)
        return;

      const elapsed =
        Math.floor(
          (
            Date.now() -
            SNK.recordingStartedAt
          ) / 1000
        );

      const minutes =
        Math.floor(
          elapsed / 60
        )
          .toString()
          .padStart(2, "0");

      const seconds =
        (
          elapsed % 60
        )
          .toString()
          .padStart(2, "0");

      timeElement.textContent =
        `${minutes}:${seconds}`;

    }, 250);

}


function stopRecordingTimer() {

  clearInterval(
    SNK.recordingTimer
  );

  SNK.recordingTimer =
    null;

}


/* =========================================================
   SAVE RECORDING
   ========================================================= */

function saveRecording() {

  if (!SNK.recordedBlob) {

    showToast(
      "No recording available"
    );

    return;

  }

  const url =
    URL.createObjectURL(
      SNK.recordedBlob
    );

  const anchor =
    document.createElement("a");

  anchor.href =
    url;

  anchor.download =
    `SNK-Presenter-${Date.now()}.webm`;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  setTimeout(() => {

    URL.revokeObjectURL(url);

  }, 1000);

  showToast(
    "Recording exported"
  );

}


/* =========================================================
   CLOSE PRESENTER
   ========================================================= */

function closePresenterModal(modal) {

  if (
    SNK.isRecording &&
    SNK.mediaRecorder
  ) {

    try {

      SNK.mediaRecorder.stop();

    } catch {}

  }

  stopRecordingTimer();

  if (SNK.stream) {

    SNK.stream
      .getTracks()
      .forEach(
        track => track.stop()
      );

    SNK.stream = null;

  }

  SNK.mediaRecorder = null;

  modal.remove();

}


/* =========================================================
   EDITOR PLACEHOLDER
   ========================================================= */

function showEditorComingSoon() {

  const existing =
    $(".snk-editor-notice");

  if (existing) {

    existing.remove();

  }

  const notice =
    document.createElement("div");

  notice.className =
    "snk-editor-notice";

  notice.innerHTML = `

    <div class="notice-card">

      <button
        class="notice-close"
        aria-label="Close"
      >
        ×
      </button>

      <div class="notice-icon">
        ✦
      </div>

      <span>
        PROJECT CREATED
      </span>

      <h3>
        Your SNK Ad workspace is ready.
      </h3>

      <p>
        The full editor, timeline, animation engine
        and export system will open here.
      </p>

      <button
        class="primary-btn notice-action"
      >
        Continue
      </button>

    </div>

  `;

  document.body.appendChild(
    notice
  );

  $(".notice-close", notice)
    .addEventListener(
      "click",
      () => notice.remove()
    );

  $(".notice-action", notice)
    .addEventListener(
      "click",
      () => notice.remove()
    );

}


/* =========================================================
   SMOOTH INTERACTIONS
   ========================================================= */

function initializeSmoothInteractions() {

  const cards =
    $$(".feature-card, .template-card");

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (!entry.isIntersecting)
            return;

          entry.target.classList.add(
            "is-visible"
          );

          observer.unobserve(
            entry.target
          );

        });

      },
      {
        threshold: 0.12
      }
    );

  cards.forEach(card => {

    observer.observe(card);

  });

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function initializeKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "s"
      ) {

        event.preventDefault();

        if (SNK.currentProject) {

          SNK.currentProject.updatedAt =
            new Date().toISOString();

          updateProject(
            SNK.currentProject
          );

          showToast(
            "Project saved"
          );

        } else {

          showToast(
            "No active project"
          );

        }

      }


      if (
        event.key === "Escape"
      ) {

        const presenter =
          $(".snk-presenter-modal");

        if (presenter) {

          closePresenterModal(
            presenter
          );

        }

        const notice =
          $(".snk-editor-notice");

        if (notice) {

          notice.remove();

        }

      }

    }
  );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  const old =
    $(".snk-toast");

  if (old) {

    old.remove();

  }

  const toast =
    document.createElement("div");

  toast.className =
    "snk-toast";

  toast.textContent =
    message;

  document.body.appendChild(
    toast
  );

  requestAnimationFrame(() => {

    toast.classList.add(
      "show"
    );

  });

  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

    setTimeout(
      () => toast.remove(),
      250
    );

  }, 2600);

}


/* =========================================================
   EXPORT GLOBAL API
   ========================================================= */

window.SNKStudio = {

  createNewProject,

  createTemplateProject,

  openPresenterMode,

  requestCamera,

  startRecording,

  stopRecording,

  saveRecording,

  getProjects,

  updateProject,

  deleteProject,

  duplicateProject,

  showToast

};
```
