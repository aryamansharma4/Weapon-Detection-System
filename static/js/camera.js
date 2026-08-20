(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        // ---------------------------------------------------------
        // ELEMENTS
        // ---------------------------------------------------------

        const radios = document.querySelectorAll(
            'input[name="camera_type"]'
        );

        const ipField = document.querySelector(
            "[data-ip-field]"
        );

        const radioCards = document.querySelectorAll(
            ".radio-card"
        );

        const webcamVideo = document.querySelector(
            "[data-webcam-video]"
        );

        const detectionCanvas = document.querySelector(
            "[data-detection-canvas]"
        );

        const feedImg = document.querySelector(
            "[data-feed-img]"
        );

        const placeholder = document.querySelector(
            "[data-feed-placeholder]"
        );

        const liveFeedButton = document.querySelector(
            "[data-feed-toggle]"
        );

        // NOTE: there are TWO "Start Detection" buttons in camera.html
        // (one in the config card, one in the feed controls). Both must
        // be wired up, so we select all of them instead of just the
        // first match.
        const startDetectionButtons = document.querySelectorAll(
            "[data-start-detection]"
        );

        const statusText = document.querySelector(
            "[data-camera-status]"
        );

        const cameraForm = document.querySelector(
            "form"
        );


        // ---------------------------------------------------------
        // STATE
        // ---------------------------------------------------------

        // One of: null | "webcam-raw" | "webcam-detect" | "ip-raw" | "ip-detect"
        let activeMode = null;

        let webcamStream = null;
        let processingFrame = false;

        const captureCanvas =
            document.createElement("canvas");


        // ---------------------------------------------------------
        // CAMERA TYPE
        // ---------------------------------------------------------

        function getCameraType() {

            const selected = document.querySelector(
                'input[name="camera_type"]:checked'
            );

            return selected
                ? selected.value
                : "webcam";
        }


        function getCameraUrlInput() {

            return document.querySelector("#camera_url");
        }


        function syncIpField() {

            const selected = document.querySelector(
                'input[name="camera_type"]:checked'
            );

            const isIp =
                selected &&
                selected.value === "ip";

            if (ipField) {

                ipField.classList.toggle(
                    "is-visible",
                    !!isIp
                );

            }

            radioCards.forEach(function (card) {

                const input =
                    card.querySelector("input");

                card.classList.toggle(
                    "is-active",
                    input && input.checked
                );

            });
        }


        radios.forEach(function (radio) {

            radio.addEventListener(
                "change",
                function () {

                    syncIpField();

                    // The selected source changed -- whatever was
                    // streaming no longer matches the current
                    // selection, so stop it rather than leave a
                    // mismatched feed running in the background.
                    if (activeMode) {
                        stopActiveFeed();
                    }

                }
            );

        });


        syncIpField();


        // ---------------------------------------------------------
        // STATUS
        // ---------------------------------------------------------

        function setStatus(text) {

            if (statusText) {
                statusText.textContent = text;
            }

        }


        function setStartDetectionLabel(text) {

            startDetectionButtons.forEach(function (button) {

                const label =
                    button.querySelector(".btn-label");

                if (label) {
                    label.textContent = text;
                } else {
                    button.textContent = text;
                }

            });

        }


        function setLiveFeedLabel(text) {

            if (liveFeedButton) {
                liveFeedButton.textContent = text;
            }

        }


        // ---------------------------------------------------------
        // SHOW / HIDE FEED
        // ---------------------------------------------------------

        function showPlaceholder(show) {

            if (placeholder) {

                placeholder.classList.toggle(
                    "is-visible",
                    show
                );

            }

        }


        function hideAllFeeds() {

            if (webcamVideo) {

                webcamVideo.style.display =
                    "none";

            }

            if (detectionCanvas) {

                detectionCanvas.style.display =
                    "none";

            }

            if (feedImg) {

                feedImg.style.display =
                    "none";

            }

        }


        function showWebcam() {

            hideAllFeeds();

            if (webcamVideo) {

                webcamVideo.style.display =
                    "block";

            }

            showPlaceholder(false);

        }


        function showDetectionCanvas() {

            hideAllFeeds();

            if (detectionCanvas) {

                detectionCanvas.style.display =
                    "block";

            }

            showPlaceholder(false);

        }


        function showIpFeed() {

            hideAllFeeds();

            if (feedImg) {

                feedImg.style.display =
                    "block";

            }

            showPlaceholder(false);

        }


        // ---------------------------------------------------------
        // WEBCAM (getUserMedia) -- used for BOTH raw live feed and
        // as the frame source for client-side detection requests.
        // ---------------------------------------------------------

        async function ensureWebcamStream() {

            if (webcamStream) {
                return true;
            }

            try {

                setStatus(
                    "Requesting Camera..."
                );

                webcamStream =
                    await navigator.mediaDevices.getUserMedia({

                        video: {
                            width: {
                                ideal: 1280
                            },
                            height: {
                                ideal: 720
                            },
                            facingMode: "user"
                        },

                        audio: false

                    });

                webcamVideo.srcObject =
                    webcamStream;

                await webcamVideo.play();

                return true;

            } catch (error) {

                console.error(
                    "Unable to access webcam:",
                    error
                );

                setStatus(
                    "Camera Permission Denied"
                );

                showPlaceholder(true);

                webcamStream = null;

                return false;

            }

        }


        function stopWebcamStream() {

            if (webcamStream) {

                webcamStream
                    .getTracks()
                    .forEach(function (track) {

                        track.stop();

                    });

                webcamStream = null;

            }

            if (webcamVideo) {

                webcamVideo.pause();

                webcamVideo.srcObject =
                    null;

            }

        }


        // ---------------------------------------------------------
        // WEBCAM FRAME PROCESSING (Start Detection, webcam source)
        // ---------------------------------------------------------

        async function processWebcamFrame() {

            if (activeMode !== "webcam-detect") {
                return;
            }

            if (
                !processingFrame &&
                webcamVideo.readyState >= 2
            ) {

                processingFrame = true;

                try {

                    const width =
                        webcamVideo.videoWidth;

                    const height =
                        webcamVideo.videoHeight;


                    if (!width || !height) {

                        processingFrame = false;

                        if (activeMode === "webcam-detect") {

                            setTimeout(
                                processWebcamFrame,
                                100
                            );

                        }

                        return;

                    }


                    captureCanvas.width =
                        width;

                    captureCanvas.height =
                        height;


                    const context =
                        captureCanvas.getContext(
                            "2d"
                        );


                    context.drawImage(
                        webcamVideo,
                        0,
                        0,
                        width,
                        height
                    );


                    const blob =
                        await new Promise(
                            function (resolve) {

                                captureCanvas.toBlob(
                                    resolve,
                                    "image/jpeg",
                                    0.80
                                );

                            }
                        );


                    const formData =
                        new FormData();


                    formData.append(
                        "frame",
                        blob,
                        "webcam.jpg"
                    );


                    const response =
                        await fetch(
                            "/detect_frame",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            "Detection request failed: "
                            + response.status
                        );

                    }


                    const resultBlob =
                        await response.blob();


                    const imageUrl =
                        URL.createObjectURL(
                            resultBlob
                        );


                    const image =
                        new Image();


                    image.onload =
                        function () {

                            if (!detectionCanvas) {
                                return;
                            }

                            if (activeMode !== "webcam-detect") {
                                URL.revokeObjectURL(imageUrl);
                                return;
                            }


                            detectionCanvas.width =
                                webcamVideo.videoWidth;

                            detectionCanvas.height =
                                webcamVideo.videoHeight;


                            const outputContext =
                                detectionCanvas.getContext(
                                    "2d"
                                );


                            outputContext.clearRect(
                                0,
                                0,
                                detectionCanvas.width,
                                detectionCanvas.height
                            );


                            outputContext.drawImage(
                                image,
                                0,
                                0,
                                detectionCanvas.width,
                                detectionCanvas.height
                            );


                            URL.revokeObjectURL(
                                imageUrl
                            );

                        };


                    image.src =
                        imageUrl;


                    showDetectionCanvas();


                    setStatus(
                        "Live Detection Active"
                    );


                } catch (error) {

                    console.error(
                        "Frame processing error:",
                        error
                    );

                    setStatus(
                        "Detection Connection Error"
                    );

                } finally {

                    processingFrame = false;

                }

            }


            if (activeMode === "webcam-detect") {

                setTimeout(
                    processWebcamFrame,
                    100
                );

            }

        }


        // ---------------------------------------------------------
        // BACKEND CONFIG SYNC
        //
        // The Flask /video_feed route (used for IP-camera detection)
        // reads the camera source from the session, which is only set
        // by a POST to /camera. The form's default submit is prevented
        // below (to avoid a full page reload), so we send it via fetch
        // instead -- this is required for the IP camera to ever open.
        // ---------------------------------------------------------

        async function syncCameraConfig() {

            if (!cameraForm) {
                return true;
            }

            try {

                const formData =
                    new FormData(cameraForm);

                await fetch(
                    "/camera",
                    {
                        method: "POST",
                        credentials: "same-origin",
                        body: formData
                    }
                );

                return true;

            } catch (error) {

                console.error(
                    "Unable to save camera configuration:",
                    error
                );

                setStatus(
                    "Unable to Save Camera Settings"
                );

                return false;

            }

        }


        // ---------------------------------------------------------
        // IP CAMERA
        // ---------------------------------------------------------

        function stopIpFeed() {

            if (feedImg) {

                feedImg.onload = null;
                feedImg.onerror = null;

                feedImg.removeAttribute("src");

            }

        }


        function startIpRawFeed() {

            const input =
                getCameraUrlInput();

            if (!input || !input.value.trim()) {

                setStatus(
                    "Enter Camera URL"
                );

                if (input) {
                    input.focus();
                }

                return;

            }

            const url =
                input.value.trim();

            activeMode = "ip-raw";

            showIpFeed();

            setStatus(
                "Connecting to IP Camera..."
            );

            setLiveFeedLabel("Stop Live Feed");

            if (feedImg) {

                feedImg.onload = function () {

                    setStatus(
                        "Live Feed Active"
                    );

                };

                feedImg.onerror = function () {

                    setStatus(
                        "Unable to Connect to IP Camera"
                    );

                    stopActiveFeed();

                };

                // Raw feed: talk to the IP camera's own MJPEG stream
                // directly, with no detection applied.
                feedImg.src =
                    url
                    + (url.includes("?")
                        ? "&"
                        : "?")
                    + "t="
                    + Date.now();

            }

        }


        async function startIpDetection() {

            const input =
                getCameraUrlInput();

            if (!input || !input.value.trim()) {

                setStatus(
                    "Enter Camera URL"
                );

                if (input) {
                    input.focus();
                }

                return;

            }

            setStatus(
                "Connecting to IP Camera..."
            );

            const saved =
                await syncCameraConfig();

            if (!saved) {
                return;
            }

            activeMode = "ip-detect";

            showIpFeed();

            setStartDetectionLabel("Stop Detection");

            if (feedImg) {

                feedImg.onload = function () {

                    setStatus(
                        "Live Detection Active"
                    );

                };

                feedImg.onerror = function () {

                    setStatus(
                        "Unable to Connect to IP Camera"
                    );

                    stopActiveFeed();

                };

                // Detection feed: routed through the Flask backend,
                // which opens the session's configured camera_url and
                // runs every frame through YOLOv5 before streaming it
                // back as MJPEG.
                feedImg.src =
                    "/video_feed?t="
                    + Date.now();

            }

        }


        // ---------------------------------------------------------
        // STOP (shared by both buttons / both sources)
        // ---------------------------------------------------------

        function stopActiveFeed() {

            if (
                activeMode === "webcam-raw" ||
                activeMode === "webcam-detect"
            ) {

                stopWebcamStream();

            }

            if (
                activeMode === "ip-raw" ||
                activeMode === "ip-detect"
            ) {

                stopIpFeed();

            }

            activeMode = null;
            processingFrame = false;

            hideAllFeeds();
            showPlaceholder(true);

            setStatus("Camera Offline");

            setStartDetectionLabel("Start Detection");
            setLiveFeedLabel("Start Live Feed");

        }


        // ---------------------------------------------------------
        // START DETECTION (either camera source, WITH YOLO)
        // ---------------------------------------------------------

        async function handleStartDetectionClick() {

            const cameraType =
                getCameraType();

            const alreadyDetecting =
                (cameraType === "webcam" && activeMode === "webcam-detect") ||
                (cameraType === "ip" && activeMode === "ip-detect");

            if (alreadyDetecting) {

                stopActiveFeed();

                return;

            }

            const sameSourceRaw =
                (cameraType === "webcam" && activeMode === "webcam-raw") ||
                (cameraType === "ip" && activeMode === "ip-raw");

            // Stop anything that doesn't match what we're about to
            // start (different source, or a raw feed on a source
            // that can't stay warm client-side).
            if (activeMode && !(cameraType === "webcam" && sameSourceRaw)) {

                stopActiveFeed();

            }

            if (cameraType === "webcam") {

                const ok =
                    await ensureWebcamStream();

                if (!ok) {
                    return;
                }

                activeMode = "webcam-detect";

                showDetectionCanvas();

                setStartDetectionLabel("Stop Detection");
                setLiveFeedLabel("Start Live Feed");

                setStatus(
                    "Starting Detection..."
                );

                processWebcamFrame();

            } else if (cameraType === "ip") {

                await startIpDetection();

            }

        }


        startDetectionButtons.forEach(function (button) {

            button.addEventListener(
                "click",
                handleStartDetectionClick
            );

        });


        // ---------------------------------------------------------
        // START LIVE FEED (either camera source, WITHOUT YOLO)
        // ---------------------------------------------------------

        async function handleLiveFeedClick() {

            const cameraType =
                getCameraType();

            const alreadyRaw =
                (cameraType === "webcam" && activeMode === "webcam-raw") ||
                (cameraType === "ip" && activeMode === "ip-raw");

            if (alreadyRaw) {

                stopActiveFeed();

                return;

            }

            const sameSourceDetect =
                (cameraType === "webcam" && activeMode === "webcam-detect");

            if (activeMode && !sameSourceDetect) {

                stopActiveFeed();

            }

            if (cameraType === "webcam") {

                const ok =
                    await ensureWebcamStream();

                if (!ok) {
                    return;
                }

                activeMode = "webcam-raw";

                showWebcam();

                setStatus(
                    "Camera Connected"
                );

                setLiveFeedLabel("Stop Live Feed");
                setStartDetectionLabel("Start Detection");

            } else if (cameraType === "ip") {

                startIpRawFeed();

            }

        }


        if (liveFeedButton) {

            liveFeedButton.addEventListener(
                "click",
                handleLiveFeedClick
            );

        }


        // ---------------------------------------------------------
        // PREVENT FORM SUBMISSION (config is sent via fetch instead,
        // see syncCameraConfig above)
        // ---------------------------------------------------------

        if (cameraForm) {

            cameraForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                }
            );

        }

    });

})();
