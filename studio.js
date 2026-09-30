/* =========================================================
   SNK AD STUDIO
   File: studio.js
   Step 5 — Production Engine

   Features:
   - Camera permission + live preview
   - MediaRecorder recording
   - Recording timer
   - Teleprompter
   - Background presets
   - Lighting controls
   - Look controls
   - Graphics controls
   - Format controls
   - Timeline playhead
   - Undo / Redo
   - Auto Save
   - Project state
   - Preview modal
   - Export modal
   - Keyboard shortcuts
   ========================================================= */

"use strict";


/* =========================================================
   01. GLOBAL STATE
   ========================================================= */

const SNKStudio = {

  stream: null,

  mediaRecorder: null,

  recordedChunks: [],

  recordingStartedAt: null,

  recordingTimer: null,

  teleprompterTimer: null,

  isRecording: false,

  isPlaying: false,

  currentTool: "camera",

  currentBackground: "snk",

  currentLook: "cinematic",

  currentFormat: "9:16",

  currentAnimation: "fade",

  history: [],

  historyIndex: -1,

  project: {
    name: "New Production",

    camera: {
      enabled: false,
      resolution: "1920×1080",
      fps: 30,
      mirror: false,
      zoom: 100
    },

    background: "SNK Studio",

    lighting: {
      key: 70,
      fill: 45,
      rim: 55,
      warmth: 50,
      brightness: 100,
      preset: "Studio"
    },

    look: {
      preset: "Cinematic",
      skinSmooth: 25,
      contrast: 12,
      sharpness: 20
    },

    script: "",

    teleprompter: {
      size: 22,
      speed: 3,
      mirror: false,
      running: false
    },

    graphics: {
      text: "Your Production Starts Here",
      font: "Inter",
      color: "#ffffff",
      animation: "Fade"
    },

    audio: {
      microphone: "Default Microphone",
      volume: 100,
      noiseReduction: true,
      music: null
    },

    format: {
      ratio: "9:16",
      resolution: "1080p",
      fps: 30,
      quality: "High"
    },

    settings: {
      autoSave: true,
      darkInterface: true,
      performanceMode: false
    }
  }
};


/* =========================================================
   02. DOM HELPERS
   ========================================================= */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];


function findTextElement(text) {

  return $$("button,span,h2,h3,label,p").find(
    el => el.textContent.trim().toLowerCase() === text.toLowerCase()
  );
}


function showToast(message, type = "info") {

  let toast = $(".snk-toast");

  if (!toast) {

    toast = document.createElement("div");

    toast.className = "snk-toast";

    document.body.appendChild(toast);

    Object.assign(toast.style, {
      position: "fixed",
      left: "50%",
      bottom: "30px",
      transform: "translateX(-50%) translateY(15px)",
      zIndex: "3000",
      padding: "11px 16px",
      borderRadius: "10px",
      background: "#121a25",
      border: "1px solid rgba(255,255,255,.1)",
      color: "#edf4ff",
      fontSize: "11px",
      fontWeight: "650",
      boxShadow: "0 15px 40px rgba(0,0,0,.45)",
      opacity: "0",
      pointerEvents: "none",
      transition: ".25s ease"
    });
  }

  toast.textContent = message;

  if (type === "success") {
    toast.style.borderColor = "rgba(82,223,154,.35)";
  } else if (type === "error") {
    toast.style.borderColor = "rgba(255,95,109,.35)";
  } else {
    toast.style.borderColor = "rgba(101,169,255,.35)";
  }

  requestAnimationFrame(() => {

    toast.style.opacity = "1";
    toast.style.transform =
      "translateX(-50%) translateY(0)";
  });

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {

    toast.style.opacity = "0";

    toast.style.transform =
      "translateX(-50%) translateY(15px)";

  }, 2300);
}


/* =========================================================
   03. ICON HELPERS
   ========================================================= */

function replaceIcon(element, svg) {

  if (!element) return;

  element.innerHTML = svg;
}


/* =========================================================
   04. TOOL SYSTEM
   ========================================================= */

function activateTool(toolName) {

  SNKStudio.currentTool = toolName;

  $$(".tool-btn").forEach(button => {

    const target =
      button.dataset.tool ||
      button.getAttribute("data-tool");

    button.classList.toggle(
      "active",
      target === toolName
    );
  });

  $$(".mobile-tool").forEach(button => {

    const target =
      button.dataset.tool ||
      button.getAttribute("data-tool");

    button.classList.toggle(
      "active",
      target === toolName
    );
  });

  const sections = {
    camera: "Camera",
    background: "Background",
    lighting: "Lighting",
    look: "Look",
    script: "Script",
    graphics: "Graphics",
    audio: "Audio",
    format: "Format",
    settings: "Settings"
  };

  const title = sections[toolName] || "Production";

  const controlTitle =
    $(".control-title");

  if (controlTitle) {
    controlTitle.textContent = title;
  }

  $$(".control-section").forEach(section => {

    const sectionTool =
      section.dataset.tool;

    if (!sectionTool) return;

    section.style.display =
      sectionTool === toolName
        ? ""
        : "none";
  });
}


function setupToolButtons() {

  $$(".tool-btn").forEach(button => {

    button.addEventListener("click", () => {

      activateTool(
        button.dataset.tool ||
        button.getAttribute("data-tool")
      );
    });
  });


  $$(".mobile-tool").forEach(button => {

    button.addEventListener("click", () => {

      activateTool(
        button.dataset.tool ||
        button.getAttribute("data-tool")
      );
    });
  });
}


/* =========================================================
   05. CAMERA
   ========================================================= */

async function startCamera() {

  if (!navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia) {

    showToast(
      "Camera API is not available in this browser.",
      "error"
    );

    return;
  }


  try {

    stopCamera();

    const fps =
      Number(SNKStudio.project.camera.fps) || 30;

    const resolution =
      SNKStudio.project.camera.resolution;

    let width = 1920;
    let height = 1080;

    if (resolution.includes("1280")) {
      width = 1280;
      height = 720;
    }

    if (resolution.includes("3840")) {
      width = 3840;
      height = 2160;
    }


    SNKStudio.stream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          width: {
            ideal: width
          },

          height: {
            ideal: height
          },

          frameRate: {
            ideal: fps
          }
        },

        audio: true
      });


    const video =
      getCameraVideoElement();

    if (video) {

      video.srcObject =
        SNKStudio.stream;

      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;

      video.style.display = "block";

      await video.play().catch(() => {});
    }


    SNKStudio.project.camera.enabled = true;

    updateCameraStatus("Camera Ready");

    updateCameraButtonState(true);

    saveProject();

    showToast(
      "Camera connected successfully.",
      "success"
    );

  } catch (error) {

    console.error(error);

    updateCameraStatus("Camera Offline");

    updateCameraButtonState(false);

    showToast(
      "Camera permission was denied or unavailable.",
      "error"
    );
  }
}


function stopCamera() {

  if (SNKStudio.stream) {

    SNKStudio.stream
      .getTracks()
      .forEach(track => track.stop());

    SNKStudio.stream = null;
  }


  const video =
    getCameraVideoElement();

  if (video) {

    video.pause();

    video.srcObject = null;

    video.style.display = "none";
  }


  SNKStudio.project.camera.enabled = false;

  updateCameraStatus("Camera Offline");

  updateCameraButtonState(false);
}


function getCameraVideoElement() {

  let video =
    $(".live-camera-video");

  if (video) return video;


  const canvas =
    $(".production-canvas");

  if (!canvas) return null;


  video =
    document.createElement("video");

  video.className =
    "live-camera-video";

  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;


  Object.assign(video.style, {

    position: "absolute",

    left: "50%",
    top: "50%",

    transform:
      "translate(-50%,-50%)",

    width: "100%",
    height: "100%",

    objectFit: "cover",

    zIndex: "6",

    display: "none",

    background: "#05070b"
  });


  canvas.appendChild(video);

  return video;
}


function updateCameraStatus(text) {

  const element =
    $(".camera-status");

  if (element) {
    element.textContent = text;
  }
}


function updateCameraButtonState(enabled) {

  const buttons =
    $$("[data-camera-toggle]");

  buttons.forEach(button => {

    button.classList.toggle(
      "active",
      enabled
    );
  });
}


/* =========================================================
   06. CAMERA SETTINGS
   ========================================================= */

function setupCameraControls() {

  const toggle =
    $("[data-camera-toggle]");

  if (toggle) {

    toggle.addEventListener(
      "click",
      () => {

        if (SNKStudio.stream) {
          stopCamera();
        } else {
          startCamera();
        }
      }
    );
  }


  $$("input,select").forEach(input => {

    const key =
      input.dataset.setting;

    if (!key) return;

    input.addEventListener(
      "change",
      () => {

        applyDataSetting(
          input,
          key
        );

        pushHistory();

        saveProject();
      }
    );
  });
}


function applyDataSetting(input, key) {

  const value =
    input.type === "checkbox"
      ? input.checked
      : input.value;


  const parts =
    key.split(".");


  let target =
    SNKStudio.project;


  for (
    let i = 0;
    i < parts.length - 1;
    i++
  ) {

    if (!target[parts[i]]) {
      target[parts[i]] = {};
    }

    target =
      target[parts[i]];
  }


  target[
    parts[parts.length - 1]
  ] = value;


  if (key === "camera.mirror") {

    applyCameraMirror(value);
  }


  if (key === "camera.zoom") {

    applyCameraZoom(value);
  }
}


function applyCameraMirror(enabled) {

  const video =
    $(".live-camera-video");

  if (!video) return;

  video.style.transform =
    enabled
      ? "translate(-50%,-50%) scaleX(-1)"
      : "translate(-50%,-50%)";
}


function applyCameraZoom(value) {

  const video =
    $(".live-camera-video");

  if (!video) return;

  const zoom =
    Number(value) / 100;

  const mirror =
    SNKStudio.project.camera.mirror;

  const x =
    mirror ? -1 : 1;

  video.style.transform =
    `translate(-50%,-50%) scale(${zoom * x},${zoom})`;
}


/* =========================================================
   07. BACKGROUND
   ========================================================= */

function setupBackgrounds() {

  $$(".background-card").forEach(card => {

    card.addEventListener(
      "click",
      () => {

        $$(".background-card")
          .forEach(item =>
            item.classList.remove("active")
          );

        card.classList.add("active");

        const name =
          card.dataset.background ||
          card.textContent.trim();

        SNKStudio.currentBackground =
          name;

        SNKStudio.project.background =
          name;

        applyBackground(name);

        pushHistory();

        saveProject();

        showToast(
          `${name} background applied.`,
          "success"
        );
      }
    );
  });
}


function applyBackground(name) {

  const canvas =
    $(".production-canvas");

  if (!canvas) return;


  canvas.dataset.background =
    name.toLowerCase();


  const backgrounds = {

    "snk studio":
      "radial-gradient(circle at 25% 20%,rgba(91,160,255,.34),transparent 28%),linear-gradient(135deg,#203a59,#0a1019 58%,#070a10)",

    "modern office":
      "linear-gradient(135deg,#44576b,#18232f 48%,#0c121a)",

    "classroom":
      "linear-gradient(135deg,#536777,#1a252e 50%,#0c1118)",

    "dark cinema":
      "radial-gradient(circle at 50% 18%,#55545f,#171821 45%,#05070b)",

    "luxury room":
      "linear-gradient(135deg,#634f3b,#211913 45%,#090a0d)",

    "gradient":
      "radial-gradient(circle at 20% 20%,#496d9f,transparent 30%),linear-gradient(135deg,#263d64,#101728 60%,#080b12)"
  };


  const bg =
    backgrounds[name.toLowerCase()] ||
    backgrounds["snk studio"];


  canvas.style.background =
    bg;
}


/* =========================================================
   08. LIGHTING
   ========================================================= */

function setupLighting() {

  const lightingInputs =
    $$("[data-light]");

  lightingInputs.forEach(input => {

    input.addEventListener(
      "input",
      () => {

        const key =
          input.dataset.light;

        const value =
          Number(input.value);

        if (
          Object.prototype.hasOwnProperty.call(
            SNKStudio.project.lighting,
            key
          )
        ) {

          SNKStudio.project.lighting[key] =
            value;
        }

        applyLighting();

        saveProject();
      }
    );
  });


  $$("[data-light-preset]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $$("[data-light-preset]")
            .forEach(item =>
              item.classList.remove("active")
            );

          button.classList.add("active");

          const preset =
            button.dataset.lightPreset;

          applyLightPreset(preset);

          pushHistory();

          saveProject();
        }
      );
    });
}


function applyLightPreset(preset) {

  const presets = {

    clean: {
      key: 78,
      fill: 58,
      rim: 30,
      warmth: 42,
      brightness: 108
    },

    cinema: {
      key: 82,
      fill: 28,
      rim: 72,
      warmth: 36,
      brightness: 92
    },

    warm: {
      key: 74,
      fill: 55,
      rim: 45,
      warmth: 78,
      brightness: 102
    },

    studio: {
      key: 70,
      fill: 45,
      rim: 55,
      warmth: 50,
      brightness: 100
    }
  };


  const settings =
    presets[preset.toLowerCase()] ||
    presets.studio;


  Object.assign(
    SNKStudio.project.lighting,
    settings,
    {
      preset
    }
  );


  applyLighting();


  Object.entries(settings)
    .forEach(([key,value]) => {

      const input =
        $(`[data-light="${key}"]`);

      if (input) {
        input.value = value;
      }
    });
}


function applyLighting() {

  const canvas =
    $(".production-canvas");

  if (!canvas) return;


  const light =
    SNKStudio.project.lighting;


  const key =
    light.key / 100;

  const rim =
    light.rim / 100;

  const brightness =
    light.brightness / 100;


  canvas.style.filter =
    `brightness(${brightness})`;


  const keyLight =
    $(".key-light");

  const rimLight =
    $(".rim-light");

  if (keyLight) {
    keyLight.style.opacity =
      (.12 + key * .45).toFixed(2);
  }

  if (rimLight) {
    rimLight.style.opacity =
      (.08 + rim * .4).toFixed(2);
  }


  const warmth =
    light.warmth;

  canvas.style.setProperty(
    "--snk-warmth",
    warmth
  );
}


/* =========================================================
   09. LOOK
   ========================================================= */

function setupLookControls() {

  $$("[data-look]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $$("[data-look]")
            .forEach(item =>
              item.classList.remove("active")
            );

          button.classList.add("active");

          const look =
            button.dataset.look;

          SNKStudio.project.look.preset =
            look;

          applyLook(look);

          pushHistory();

          saveProject();
        }
      );
    });


  $$("[data-look-range]")
    .forEach(input => {

      input.addEventListener(
        "input",
        () => {

          const key =
            input.dataset.lookRange;

          SNKStudio.project.look[key] =
            Number(input.value);

          applyLook(
            SNKStudio.project.look.preset
          );

          saveProject();
        }
      );
    });
}


function applyLook(look) {

  const canvas =
    $(".production-canvas");

  if (!canvas) return;


  const looks = {

    natural:
      "brightness(1.02) contrast(1.02) saturate(.98)",

    cinematic:
      "brightness(.98) contrast(1.12) saturate(1.06)",

    professional:
      "brightness(1.01) contrast(1.08) saturate(1)",

    bright:
      "brightness(1.08) contrast(1.02) saturate(1.05)"
  };


  canvas.style.filter =
    looks[look.toLowerCase()] ||
    looks.cinematic;
}


/* =========================================================
   10. TELEPROMPTER
   ========================================================= */

function setupTeleprompter() {

  const textarea =
    $(".control-textarea");

  if (textarea) {

    textarea.value =
      SNKStudio.project.script || "";

    textarea.addEventListener(
      "input",
      () => {

        SNKStudio.project.script =
          textarea.value;

        updateTeleprompterPreview();

        saveProject();
      }
    );
  }


  const startButton =
    $("[data-teleprompter-start]");

  if (startButton) {

    startButton.addEventListener(
      "click",
      toggleTeleprompter
    );
  }


  $$("[data-teleprompter-size]")
    .forEach(input => {

      input.addEventListener(
        "input",
        () => {

          SNKStudio.project.teleprompter.size =
            Number(input.value);

          updateTeleprompterPreview();
        }
      );
    });


  $$("[data-teleprompter-speed]")
    .forEach(input => {

      input.addEventListener(
        "input",
        () => {

          SNKStudio.project.teleprompter.speed =
            Number(input.value);
        }
      );
    });
}


function createTeleprompter() {

  let prompt =
    $(".snk-teleprompter");


  if (prompt) return prompt;


  prompt =
    document.createElement("div");

  prompt.className =
    "snk-teleprompter";


  Object.assign(prompt.style, {

    position: "absolute",

    left: "50%",
    top: "50%",

    transform:
      "translate(-50%,-50%)",

    width: "72%",
    height: "62%",

    overflow: "hidden",

    padding: "20px 35px",

    background:
      "linear-gradient(180deg,rgba(0,0,0,.48),rgba(0,0,0,.18))",

    border:
      "1px solid rgba(255,255,255,.06)",

    borderRadius: "10px",

    color: "#fff",

    fontWeight: "700",

    lineHeight: "1.65",

    textAlign: "center",

    zIndex: "24",

    pointerEvents: "none",

    backdropFilter: "blur(2px)",

    display: "none"
  });


  const canvas =
    $(".production-canvas");

  if (canvas) {
    canvas.appendChild(prompt);
  }


  return prompt;
}


function updateTeleprompterPreview() {

  const prompt =
    createTeleprompter();

  if (!prompt) return;


  prompt.textContent =
    SNKStudio.project.script ||
    "Add your script from the Script panel.";


  prompt.style.fontSize =
    `${SNKStudio.project.teleprompter.size}px`;


  prompt.style.transform =
    SNKStudio.project.teleprompter.mirror
      ? "translate(-50%,-50%) scaleX(-1)"
      : "translate(-50%,-50%)";
}


function toggleTeleprompter() {

  const prompt =
    createTeleprompter();

  if (!prompt) return;


  if (SNKStudio.project.teleprompter.running) {

    SNKStudio.project.teleprompter.running =
      false;

    clearInterval(
      SNKStudio.teleprompterTimer
    );

    prompt.style.display = "none";

    showToast("Teleprompter stopped.");

    return;
  }


  updateTeleprompterPreview();

  prompt.style.display = "block";

  SNKStudio.project.teleprompter.running =
    true;


  let position = 0;

  clearInterval(
    SNKStudio.teleprompterTimer
  );


  SNKStudio.teleprompterTimer =
    setInterval(() => {

      if (!SNKStudio.project.teleprompter.running) {
        return;
      }

      position +=
        Math.max(
          .2,
          SNKStudio.project.teleprompter.speed * .18
        );

      prompt.scrollTop =
        position;

      if (
        position >=
        prompt.scrollHeight -
        prompt.clientHeight
      ) {

        clearInterval(
          SNKStudio.teleprompterTimer
        );

        SNKStudio.project.teleprompter.running =
          false;

        prompt.style.display = "none";
      }

    }, 80);


  showToast(
    "Teleprompter started.",
    "success"
  );
}


/* =========================================================
   11. GRAPHICS
   ========================================================= */

function setupGraphics() {

  $$("[data-animation]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $$("[data-animation]")
            .forEach(item =>
              item.classList.remove("active")
            );

          button.classList.add("active");

          const animation =
            button.dataset.animation;

          SNKStudio.currentAnimation =
            animation;

          SNKStudio.project.graphics.animation =
            animation;

          applyTextAnimation(
            animation
          );

          saveProject();
        }
      );
    });


  const textInput =
    $("[data-graphic-text]");

  if (textInput) {

    textInput.addEventListener(
      "input",
      () => {

        SNKStudio.project.graphics.text =
          textInput.value;

        updateCanvasTitle();

        saveProject();
      }
    );
  }


  const colorInput =
    $("[data-graphic-color]");

  if (colorInput) {

    colorInput.addEventListener(
      "input",
      () => {

        SNKStudio.project.graphics.color =
          colorInput.value;

        updateCanvasTitle();
      }
    );
  }
}


function updateCanvasTitle() {

  const title =
    $(".canvas-title");

  if (!title) return;


  title.textContent =
    SNKStudio.project.graphics.text;


  title.style.color =
    SNKStudio.project.graphics.color;
}


function applyTextAnimation(animation) {

  const title =
    $(".canvas-title");

  if (!title) return;


  title.style.animation =
    "none";


  void title.offsetWidth;


  const keyframes = {

    fade:
      "snkFade .6s ease both",

    slide:
      "snkSlide .6s cubic-bezier(.22,.8,.24,1) both",

    word:
      "snkFade .7s ease both",

    type:
      "snkType .8s steps(24,end) both",

    zoom:
      "snkZoom .7s cubic-bezier(.22,.8,.24,1) both",

    glitch:
      "snkGlitch .65s steps(2,end) both"
  };


  title.style.animation =
    keyframes[
      animation.toLowerCase()
    ] ||
    keyframes.fade;
}


/* Inject graphic animations */

function injectGraphicAnimations() {

  if ($("#snk-animation-style")) return;


  const style =
    document.createElement("style");

  style.id =
    "snk-animation-style";


  style.textContent = `

    @keyframes snkFade {
      from {
        opacity:0;
      }
      to {
        opacity:1;
      }
    }

    @keyframes snkSlide {
      from {
        opacity:0;
        transform:translateX(-30px);
      }
      to {
        opacity:1;
        transform:translateX(0);
      }
    }

    @keyframes snkZoom {
      from {
        opacity:0;
        transform:scale(.84);
      }
      to {
        opacity:1;
        transform:scale(1);
      }
    }

    @keyframes snkType {
      from {
        width:0;
        opacity:.4;
      }
      to {
        width:100%;
        opacity:1;
      }
    }

    @keyframes snkGlitch {
      0% {
        transform:translateX(0);
      }
      25% {
        transform:translateX(-3px);
      }
      50% {
        transform:translateX(3px);
      }
      75% {
        transform:translateX(-2px);
      }
      100% {
        transform:translateX(0);
      }
    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   12. FORMAT
   ========================================================= */

function setupFormats() {

  $$("[data-format]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $$("[data-format]")
            .forEach(item =>
              item.classList.remove("active")
            );

          button.classList.add("active");

          const format =
            button.dataset.format;

          SNKStudio.currentFormat =
            format;

          SNKStudio.project.format.ratio =
            format;

          applyFormat(format);

          pushHistory();

          saveProject();
        }
      );
    });
}


function applyFormat(format) {

  const canvas =
    $(".production-canvas");

  if (!canvas) return;


  const formats = {

    "9:16": "9 / 16",

    "16:9": "16 / 9",

    "1:1": "1 / 1",

    "4:5": "4 / 5"
  };


  canvas.style.aspectRatio =
    formats[format] ||
    "16 / 9";


  canvas.dataset.format =
    format;
}


/* =========================================================
   13. AUDIO
   ========================================================= */

function setupAudio() {

  $$("[data-audio-volume]")
    .forEach(input => {

      input.addEventListener(
        "input",
        () => {

          SNKStudio.project.audio.volume =
            Number(input.value);

          saveProject();
        }
      );
    });


  $$("[data-noise-reduction]")
    .forEach(toggle => {

      toggle.addEventListener(
        "click",
        () => {

          toggle.classList.toggle("active");

          SNKStudio.project.audio.noiseReduction =
            toggle.classList.contains("active");

          saveProject();
        }
      );
    });
}


/* =========================================================
   14. RECORDING
   ========================================================= */

async function startRecording() {

  if (SNKStudio.isRecording) return;


  if (!SNKStudio.stream) {

    await startCamera();

    if (!SNKStudio.stream) {
      return;
    }
  }


  const stream =
    SNKStudio.stream;


  if (!window.MediaRecorder) {

    showToast(
      "MediaRecorder is not supported in this browser.",
      "error"
    );

    return;
  }


  SNKStudio.recordedChunks = [];


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

    SNKStudio.mediaRecorder =
      new MediaRecorder(
        stream,
        {
          mimeType
        }
      );

  } catch (error) {

    console.error(error);

    showToast(
      "Could not start recording.",
      "error"
    );

    return;
  }


  SNKStudio.mediaRecorder.ondataavailable =
    event => {

      if (
        event.data &&
        event.data.size > 0
      ) {

        SNKStudio.recordedChunks.push(
          event.data
        );
      }
    };


  SNKStudio.mediaRecorder.onstop =
    handleRecordingStop;


  SNKStudio.mediaRecorder.start(
    250
  );


  SNKStudio.isRecording =
    true;

  SNKStudio.recordingStartedAt =
    Date.now();


  updateRecordingUI(true);

  startRecordingTimer();


  showToast(
    "Recording started.",
    "success"
  );
}


function stopRecording() {

  if (
    !SNKStudio.mediaRecorder ||
    !SNKStudio.isRecording
  ) {
    return;
  }


  SNKStudio.mediaRecorder.stop();

  SNKStudio.isRecording =
    false;

  clearInterval(
    SNKStudio.recordingTimer
  );

  updateRecordingUI(false);
}


function handleRecordingStop() {

  clearInterval(
    SNKStudio.recordingTimer
  );


  const blob =
    new Blob(
      SNKStudio.recordedChunks,
      {
        type:
          SNKStudio.mediaRecorder?.mimeType ||
          "video/webm"
      }
    );


  SNKStudio.lastRecordingBlob =
    blob;


  const duration =
    formatTime(
      Date.now() -
      SNKStudio.recordingStartedAt
    );


  showToast(
    `Recording ready — ${duration}`,
    "success"
  );


  const recordButton =
    $("[data-record-download]");

  if (recordButton) {
    recordButton.style.display =
      "inline-flex";
  }
}


function startRecordingTimer() {

  const timer =
    $("[data-recording-time]");


  clearInterval(
    SNKStudio.recordingTimer
  );


  SNKStudio.recordingTimer =
    setInterval(() => {

      const elapsed =
        Date.now() -
        SNKStudio.recordingStartedAt;


      const formatted =
        formatTime(elapsed);


      if (timer) {
        timer.textContent =
          formatted;
      }


      const modalTimer =
        $(".recording-time");

      if (modalTimer) {
        modalTimer.textContent =
          formatted;
      }

    }, 250);
}


function formatTime(milliseconds) {

  const totalSeconds =
    Math.floor(
      milliseconds / 1000
    );


  const minutes =
    Math.floor(
      totalSeconds / 60
    );


  const seconds =
    totalSeconds % 60;


  return (
    String(minutes).padStart(2,"0") +
    ":" +
    String(seconds).padStart(2,"0")
  );
}


function updateRecordingUI(recording) {

  const indicator =
    $(".record-indicator");

  if (indicator) {

    indicator.style.display =
      recording ? "flex" : "none";
  }


  const recordButtons =
    $$("[data-record]");


  recordButtons.forEach(button => {

    button.classList.toggle(
      "recording",
      recording
    );

    const label =
      button.querySelector(
        "[data-record-label]"
      );

    if (label) {
      label.textContent =
        recording
          ? "Stop Recording"
          : "Record";
    }
  });
}


/* =========================================================
   15. RECORD BUTTON
   ========================================================= */

function setupRecordingButtons() {

  $$("[data-record]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (SNKStudio.isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        }
      );
    });


  $$("[data-record-download]")
    .forEach(button => {

      button.addEventListener(
        "click",
        downloadRecording
      );
    });
}


function downloadRecording() {

  if (!SNKStudio.lastRecordingBlob) {

    showToast(
      "No recording available yet.",
      "error"
    );

    return;
  }


  const url =
    URL.createObjectURL(
      SNKStudio.lastRecordingBlob
    );


  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `SNK-Ad-Studio-${dateStamp()}.webm`;

  document.body.appendChild(link);

  link.click();

  link.remove();


  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);


  showToast(
    "Recording downloaded.",
    "success"
  );
}


function dateStamp() {

  const now =
    new Date();

  const pad =
    value =>
      String(value).padStart(2,"0");


  return [
    now.getFullYear(),
    pad(now.getMonth()+1),
    pad(now.getDate())
  ].join("-");
}


/* =========================================================
   16. PLAYBACK / TIMELINE
   ========================================================= */

function setupTimeline() {

  const playButton =
    $(".transport-btn.play");


  if (playButton) {

    playButton.addEventListener(
      "click",
      togglePlayback
    );
  }


  const timeline =
    $(".timeline-content");


  if (timeline) {

    timeline.addEventListener(
      "click",
      event => {

        const rect =
          timeline.getBoundingClientRect();

        const ratio =
          (event.clientX - rect.left) /
          rect.width;


        const playhead =
          $(".playhead");

        if (playhead) {

          playhead.style.left =
            `${Math.max(
              0,
              Math.min(100,ratio * 100)
            )}%`;
        }
      }
    );
  }
}


function togglePlayback() {

  SNKStudio.isPlaying =
    !SNKStudio.isPlaying;


  const button =
    $(".transport-btn.play");


  if (button) {

    button.classList.toggle(
      "active",
      SNKStudio.isPlaying
    );
  }


  if (SNKStudio.isPlaying) {

    startPlayhead();

    showToast("Preview playback started.");

  } else {

    stopPlayhead();

    showToast("Preview paused.");
  }
}


function startPlayhead() {

  stopPlayhead();


  let position =
    parseFloat(
      $(".playhead")?.style.left
    ) || 0;


  SNKStudio.playheadTimer =
    setInterval(() => {

      position += .18;


      if (position >= 100) {
        position = 0;
      }


      const playhead =
        $(".playhead");

      if (playhead) {

        playhead.style.left =
          `${position}%`;
      }

    }, 80);
}


function stopPlayhead() {

  clearInterval(
    SNKStudio.playheadTimer
  );
}


/* =========================================================
   17. PREVIEW MODAL
   ========================================================= */

function setupPreview() {

  const previewButtons =
    $$("[data-preview]");


  previewButtons.forEach(button => {

    button.addEventListener(
      "click",
      openPreview
    );
  });
}


function openPreview() {

  const modal =
    $("#previewModal") ||
    createSimpleModal(
      "previewModal",
      "Production Preview"
    );


  const body =
    $(".modal-body", modal);


  if (body) {

    body.innerHTML = `

      <div style="
        aspect-ratio:16/9;
        width:100%;
        border-radius:10px;
        overflow:hidden;
        background:#05070b;
        border:1px solid rgba(255,255,255,.08);
        display:grid;
        place-items:center;
      ">

        <div style="
          text-align:center;
          color:#9aa7b8;
        ">

          <div style="
            font-size:11px;
            font-weight:700;
            color:#edf4ff;
          ">
            ${escapeHTML(
              SNKStudio.project.graphics.text
            )}
          </div>

          <div style="
            margin-top:6px;
            font-size:9px;
          ">
            Production Preview
          </div>

        </div>

      </div>
    `;
  }


  openModal(modal);
}


/* =========================================================
   18. EXPORT MODAL
   ========================================================= */

function setupExport() {

  $$("[data-export]")
    .forEach(button => {

      button.addEventListener(
        "click",
        openExport
      );
    });
}


function openExport() {

  const modal =
    $("#exportModal") ||
    createSimpleModal(
      "exportModal",
      "Export Production"
    );


  const body =
    $(".modal-body", modal);


  if (body) {

    body.innerHTML = `

      <div class="export-grid">

        <button
          class="export-option active"
          data-export-format="webm"
        >
          <strong>WebM</strong>
          <span>Browser-ready video</span>
        </button>

        <button
          class="export-option"
          data-export-format="mp4"
        >
          <strong>MP4</strong>
          <span>Professional delivery format</span>
        </button>

      </div>

      <div style="
        padding:12px;
        border-radius:10px;
        background:#101720;
        border:1px solid rgba(255,255,255,.07);
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          margin-bottom:8px;
          font-size:9px;
        ">
          <span style="color:#7e8999">
            Format
          </span>

          <strong>
            ${escapeHTML(
              SNKStudio.project.format.ratio
            )}
          </strong>
        </div>

        <div style="
          display:flex;
          justify-content:space-between;
          font-size:9px;
        ">
          <span style="color:#7e8999">
            Quality
          </span>

          <strong>
            ${escapeHTML(
              SNKStudio.project.format.quality
            )}
          </strong>
        </div>

      </div>

    `;


    $$("[data-export-format]",body)
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            $$("[data-export-format]",body)
              .forEach(item =>
                item.classList.remove("active")
              );

            button.classList.add("active");
          }
        );
      });
  }


  const footer =
    $(".modal-footer",modal);


  if (footer) {

    footer.innerHTML = `

      <button
        class="secondary-btn"
        data-close-modal
      >
        Cancel
      </button>

      <button
        class="primary-btn"
        data-export-now
        style="width:auto;padding:0 18px"
      >
        Export Video
      </button>
    `;


    $("[data-export-now]",footer)
      .addEventListener(
        "click",
        performExport
      );
  }


  openModal(modal);
}


function performExport() {

  closeAllModals();


  if (SNKStudio.lastRecordingBlob) {

    downloadRecording();

    return;
  }


  showToast(
    "Record your production first, then export the recorded video.",
    "info"
  );
}


/* =========================================================
   19. MODAL ENGINE
   ========================================================= */

function createSimpleModal(id,title) {

  const modal =
    document.createElement("div");

  modal.id = id;

  modal.className =
    "modal";


  modal.innerHTML = `

    <div class="modal-card">

      <div class="modal-header">

        <h2>${escapeHTML(title)}</h2>

        <button
          class="modal-close"
          data-close-modal
          aria-label="Close"
        >
          ×
        </button>

      </div>

      <div class="modal-body"></div>

      <div class="modal-footer">

        <button
          class="secondary-btn"
          data-close-modal
        >
          Close
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(modal);


  setupModalClose(modal);


  return modal;
}


function openModal(modal) {

  if (!modal) return;

  modal.classList.add("open");
}


function closeModal(modal) {

  if (!modal) return;

  modal.classList.remove("open");
}


function closeAllModals() {

  $$(".modal.open")
    .forEach(closeModal);
}


function setupModalClose(root = document) {

  $$("[data-close-modal]",root)
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const modal =
            button.closest(".modal");

          closeModal(modal);
        }
      );
    });


  if (root.classList?.contains("modal")) {

    root.addEventListener(
      "click",
      event => {

        if (event.target === root) {
          closeModal(root);
        }
      }
    );
  }
}


/* =========================================================
   20. PROJECT STORAGE
   ========================================================= */

const STORAGE_KEY =
  "snk-ad-studio-project";


function saveProject(showMessage = false) {

  if (
    !SNKStudio.project.settings.autoSave &&
    !showMessage
  ) {
    return;
  }


  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        SNKStudio.project
      )
    );


    updateSavedStatus();


    if (showMessage) {

      showToast(
        "Project saved.",
        "success"
      );
    }

  } catch (error) {

    console.error(
      "Project save failed:",
      error
    );
  }
}


function loadProject() {

  try {

    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (!stored) return;


    const saved =
      JSON.parse(stored);


    SNKStudio.project =
      deepMerge(
        SNKStudio.project,
        saved
      );


    hydrateUI();


  } catch (error) {

    console.error(
      "Project load failed:",
      error
    );
  }
}


function hydrateUI() {

  const project =
    SNKStudio.project;


  const textarea =
    $(".control-textarea");

  if (textarea) {
    textarea.value =
      project.script || "";
  }


  updateCanvasTitle();

  applyBackground(
    project.background
  );

  applyLighting();

  applyLook(
    project.look.preset
  );

  applyFormat(
    project.format.ratio
  );


  const selectedBackground =
    $$(".background-card")
      .find(card =>
        (
          card.dataset.background ||
          card.textContent.trim()
        ).toLowerCase() ===
        String(
          project.background
        ).toLowerCase()
      );


  if (selectedBackground) {

    $$(".background-card")
      .forEach(card =>
        card.classList.remove("active")
      );

    selectedBackground.classList.add(
      "active"
    );
  }


  updateTeleprompterPreview();

  updateSavedStatus();
}


function deepMerge(target,source) {

  Object.keys(source || {})
    .forEach(key => {

      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {

        target[key] =
          deepMerge(
            target[key] || {},
            source[key]
          );

      } else {

        target[key] =
          source[key];
      }
    });


  return target;
}


function updateSavedStatus() {

  const status =
    $(".saved-status");

  if (!status) return;

  status.textContent =
    "Saved just now";
}


/* =========================================================
   21. UNDO / REDO
   ========================================================= */

function snapshotProject() {

  return JSON.parse(
    JSON.stringify(
      SNKStudio.project
    )
  );
}


function pushHistory() {

  const snapshot =
    snapshotProject();


  SNKStudio.history =
    SNKStudio.history.slice(
      0,
      SNKStudio.historyIndex + 1
    );


  SNKStudio.history.push(
    snapshot
  );


  if (SNKStudio.history.length > 30) {

    SNKStudio.history.shift();
  }


  SNKStudio.historyIndex =
    SNKStudio.history.length - 1;
}


function undo() {

  if (
    SNKStudio.historyIndex <= 0
  ) {

    showToast(
      "Nothing to undo."
    );

    return;
  }


  SNKStudio.historyIndex--;


  SNKStudio.project =
    JSON.parse(
      JSON.stringify(
        SNKStudio.history[
          SNKStudio.historyIndex
        ]
      )
    );


  hydrateUI();

  saveProject();

  showToast(
    "Undo applied."
  );
}


function redo() {

  if (
    SNKStudio.historyIndex >=
    SNKStudio.history.length - 1
  ) {

    showToast(
      "Nothing to redo."
    );

    return;
  }


  SNKStudio.historyIndex++;


  SNKStudio.project =
    JSON.parse(
      JSON.stringify(
        SNKStudio.history[
          SNKStudio.historyIndex
        ]
      )
    );


  hydrateUI();

  saveProject();

  showToast(
    "Redo applied."
  );
}


function setupHistoryButtons() {

  $$("[data-undo]")
    .forEach(button =>
      button.addEventListener(
        "click",
        undo
      )
    );


  $$("[data-redo]")
    .forEach(button =>
      button.addEventListener(
        "click",
        redo
      )
    );
}


/* =========================================================
   22. SETTINGS
   ========================================================= */

function setupSettings() {

  $$("[data-setting-toggle]")
    .forEach(toggle => {

      toggle.addEventListener(
        "click",
        () => {

          const key =
            toggle.dataset.settingToggle;


          toggle.classList.toggle(
            "active"
          );


          SNKStudio.project.settings[key] =
            toggle.classList.contains(
              "active"
            );


          if (
            key === "performanceMode"
          ) {

            document.body.classList.toggle(
              "performance-mode",
              SNKStudio.project.settings[
                key
              ]
            );
          }


          saveProject();
        }
      );
    });
}


/* =========================================================
   23. KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      const target =
        event.target;


      const typing =
        target &&
        (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        );


      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "z"
      ) {

        if (typing) return;

        event.preventDefault();

        undo();

        return;
      }


      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "y"
      ) {

        if (typing) return;

        event.preventDefault();

        redo();

        return;
      }


      if (event.code === "Space") {

        if (typing) return;

        event.preventDefault();

        togglePlayback();

        return;
      }


      if (
        event.key.toLowerCase() === "r"
      ) {

        if (typing) return;

        event.preventDefault();

        if (SNKStudio.isRecording) {
          stopRecording();
        } else {
          startRecording();
        }

        return;
      }


      if (event.key === "Escape") {

        closeAllModals();

        if (
          SNKStudio.project.teleprompter.running
        ) {

          toggleTeleprompter();
        }
      }
    }
  );
}


/* =========================================================
   24. NAVIGATION
   ========================================================= */

function setupNavigation() {

  $$("[data-back]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (
            SNKStudio.isRecording
          ) {

            showToast(
              "Stop recording before leaving the studio.",
              "error"
            );

            return;
          }


          if (
            document.referrer &&
            document.referrer !== location.href
          ) {

            history.back();

          } else {

            location.href =
              "index.html";
          }
        }
      );
    });
}


/* =========================================================
   25. UTILITY
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}


/* =========================================================
   26. INITIALIZATION
   ========================================================= */

function initializeStudio() {

  injectGraphicAnimations();

  setupToolButtons();

  setupCameraControls();

  setupBackgrounds();

  setupLighting();

  setupLookControls();

  setupTeleprompter();

  setupGraphics();

  setupFormats();

  setupAudio();

  setupRecordingButtons();

  setupTimeline();

  setupPreview();

  setupExport();

  setupHistoryButtons();

  setupSettings();

  setupKeyboardShortcuts();

  setupNavigation();

  setupModalClose();

  loadProject();

  pushHistory();

  updateRecordingUI(false);

  activateTool(
    SNKStudio.currentTool
  );


  /* Initial visual state */

  applyBackground(
    SNKStudio.project.background
  );

  applyLighting();

  applyLook(
    SNKStudio.project.look.preset
  );

  applyFormat(
    SNKStudio.project.format.ratio
  );

  updateCanvasTitle();


  /* Auto-save */

  setInterval(() => {

    if (
      SNKStudio.project.settings.autoSave
    ) {

      saveProject();
    }

  }, 15000);


  console.log(
    "SNK Ad Studio initialized."
  );
}


/* =========================================================
   27. PAGE START
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeStudio
  );

} else {

  initializeStudio();
}


/* =========================================================
   END — SNK AD STUDIO
   ========================================================= */
