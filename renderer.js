
// ✅ Slider Setup
const slider = document.querySelector('#slider');
noUiSlider.create(slider, {
    start: [0, 100],
    connect: true,
    behaviour: 'unconstrained-tap',
    range: {
        min: 0,
        max: 100
    }
});
slider.noUiSlider.on('start', function () {
    // You can do something when the slider starts being dragged
});

let scalingWithTouch = false;
let lastDelta = 0;
let initTouches = [];

document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) {
        scalingWithTouch = true;
        initTouches = [...e.touches]; // shallow clone
    }
}, true);

document.addEventListener('touchend', function (e) {
    if (e.touches.length < 2) {
        scalingWithTouch = false;
    }
}, true);

document.addEventListener('touchmove', function (e) {
    if (scalingWithTouch && e.touches.length > 1) {
        const newDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const initDist = Math.hypot(
            initTouches[0].clientX - initTouches[1].clientX,
            initTouches[0].clientY - initTouches[1].clientY
        );
        const delta = newDist - initDist;
        let deltaDiff = (delta - lastDelta) / 100;

        let currentScale = parseFloat(document.body.dataset.currentScale) || 1;
        const nextScale = Math.max(currentScale + deltaDiff * (currentScale / 2), 0.01);

        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        console.log("touchmove", deltaDiff, currentScale, nextScale);
        zoom(nextScale, { clientX: centerX, clientY: centerY });

        lastDelta = delta;
    }
}, true);

const factor = 0.1;
document.documentElement.addEventListener("wheel", (e) => {
    let delta = e.wheelDelta ? e.wheelDelta / 120 : -e.deltaY * factor;
    if (e.ctrlKey) { // pinch-zoom gesture
        delta = e.deltaY * factor;
    }

    if (document.querySelector('.editVideo')) return;

    let currentScale = parseFloat(document.body.dataset.currentScale) || 1;
    const nextScale = Math.max(currentScale + delta * (currentScale / 2), 0.01);
    console.log("wheel", delta, currentScale, nextScale);

    zoom(nextScale, e);
});

const zoom = (nextScale, event) => {
    let currentScale = parseFloat(document.body.dataset.currentScale) || 1;
    const ratio = 1 - nextScale / currentScale;

    const { clientX, clientY } = event;

    let translateX = parseFloat(document.body.dataset.translateX) || 0;
    let translateY = parseFloat(document.body.dataset.translateY) || 0;

    translateX += (clientX - translateX) * ratio;
    translateY += (clientY - translateY) * ratio;

    console.log('zoom');
    currentScale = nextScale;

    myAPI.updateScaleAndTranslate(currentScale, { translateX, translateY });
};

/**
 * YouTube Embed Section
 */
var player;

function onYouTubeIframeAPIReady() {
    embedYoutubeVideo();
}

function onPlayerReady(event) {
    event.target.setVolume(50);
    event.target.mute();

    // ⚠️ DOM manipulation hack (may break in some browsers)
    const iframeDoc = event.target.getIframe().contentDocument;
    if (iframeDoc) {
        const video = iframeDoc.querySelector('video');
        if (video) iframeDoc.body.appendChild(video);
    }

    event.target.playVideo();
}

var done = false;

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        let videoElement = event.target.getIframe().contentDocument.querySelector('video');
        if (!videoElement) return;

        videoElement.loop = true;

        let videoWidth = videoElement.videoWidth;
        let videoHeight = videoElement.videoHeight;
        let idcode = event.target.getIframe().parentElement.dataset.idcode;

        videoElement.dataset.idcode = idcode;

        myAPI.updateYoutubeOriginalSize(idcode, videoWidth, videoHeight);

        done = true;
    }
}

function stopVideo() {
    player.stopVideo();
}

const targetNode = document.getElementById('eventTrigger');
const config = { attributes: true };
const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes') {
            if (mutation.attributeName === 'data-youtubetrigger') {
                embedYoutubeVideo();
            } else if (mutation.attributeName === 'data-changesliders') {
                let changesliders = JSON.parse(mutation.target.dataset.changesliders);
                slider.noUiSlider.set(changesliders);
            }
        }
    }
};

const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

function embedYoutubeVideo() {
    const playerNeedsSetup = document.querySelector('.playerNeedsSetup');
    if (!playerNeedsSetup) {
        console.error('embedYoutubeVideo called without player div to setup');
        return;
    }

    playerNeedsSetup.classList.remove('playerNeedsSetup');
    const iframediv = playerNeedsSetup.querySelector('.iframeDiv');
    const code = playerNeedsSetup.dataset.idcode;

    player = new YT.Player(iframediv, {
        videoId: code,
        playerVars: {
            controls: 1,     // ✅ Show YouTube controls
            disablekb: 1,    // ✅ Allow keyboard control
            enablejsapi: 1,
            fs: 0,
            loop: 1,
            modestbranding: 1,
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}
