const { ipcRenderer } = require('electron');

const sliderElement = document.querySelector('#slider')

noUiSlider.create(sliderElement, {
    start: [0, 100],
    connect: true,
    behaviour: 'unconstrained-tap',
    range: {
        'min': 0,
        'max': 100
    }
});
slider.noUiSlider.on('start', function () {

});

let scalingWithTouch = false
let lastDelta = 0

let initTouches = []
//ontouchstart
document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) {
        scalingWithTouch = true
        initTouches = e.touches
    }
}, true);

document.addEventListener('touchend', function (e) {
    if (e.touches.length < 2) {
        scalingWithTouch = false
    }
}, true);

docu
ment.addEventListener('touchmove', function (e) {
    if (scalingWithTouch) {
        //zoom
        // delta between e.touches[1], e.touches[0] and initTouches[1], initTouches[0]
        let delta = Math.sqrt(Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)) - Math.sqrt(Math.pow(initTouches[0].clientX - initTouches[1].clientX, 2) + Math.pow(initTouches[0].clientY - initTouches[1].clientY, 2))
        let deltaDiff = delta - lastDelta
        deltaDiff = deltaDiff / 100
        currentScale = parseFloat(document.body.dataset.currentScale) || 1
        const nextScale = Math.max(currentScale + deltaDiff * (currentScale / 2), 0.01)
        console.log("touchmove", deltaDiff, currentScale, nextScale)
        e.clientX = (initTouches[0].clientX + initTouches[0].clientX) / 2
        e.clientY = (initTouches[0].clientY + initTouches[0].clientY) / 2
        //zoom(nextScale, e) // this is not working
        lastDelta = delta
    }
}, true);

const factor = 0.1
document.documentElement.addEventListener("wheel", (e) => {
    let delta = e.wheelDelta / 120
    if (e.ctrlKey) { // is pinch zoom on touchpad(idk why it's ctrlKey but it is)
        delta = e.deltaY * factor
    }
    if (document.querySelector('.editVideo')) return;
    currentScale = parseFloat(document.body.dataset.currentScale) || 1

    const nextScale = Math.max(currentScale + delta * (currentScale / 2), 0.01)
    console.log("wheel", delta, currentScale, nextScale)
    zoom(nextScale, e)

})

const zoom = (nextScale, event) => {
    currentScale = parseFloat(document.body.dataset.currentScale) || 1

    const ratio = 1 - nextScale / currentScale

    const {
        clientX,
        clientY
    } = event

    let translateX = (parseFloat(document.body.dataset.translateX) || 0);
    let translateY = (parseFloat(document.body.dataset.translateY) || 0);

    translateX += (clientX - translateX) * ratio
    translateY += (clientY - translateY) * ratio
    console.log('zoom')

    //console.log(translateX, translateY, nextScale, ratio, currentScale)
    currentScale = nextScale
    myAPI.updateScaleAndTranslate(currentScale, { translateX, translateY })
}

/**
 * Youtube Embed Section
 */

var player;
function onYouTubeIframeAPIReady() { } // idk why it breaks without this

function onPlayerReady(event) {
    event.target.setVolume(0);
    event.target.mute();

    // lifts youtube video to last element at the root of body 
    event.target.getIframe().contentDocument.body.appendChild(player.getIframe().contentDocument.querySelector('video'))

    event.target.playVideo();

    // --- Custom code ---
    addVideoControls();
    setupKeyboardShortcuts();
    // --- End of Custom Code ---
}


var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        //setTimeout(stopVideo, 6000);
        let videoElement = event.target.getIframe().contentDocument.querySelector('video')
        videoElement.loop = true
        /*
        videoElement.addEventListener('timeupdate', function(){
            //if im the editvideo
            if(document.querySelector(.editVideo[data-idcode="${this.dataset.idcode}"])){
                onPlayerProgress.apply(this, arguments)
            }
        })*/

        let videoWidth = videoElement.videoWidth
        let videoHeight = videoElement.videoHeight
        //console.log('inside onPlayerStateChange', videoWidth, videoHeight)
        let idcode = event.target.getIframe().parentElement.dataset.idcode

        videoElement.dataset.idcode = idcode
        //console.log('after onPlayerStateChange', videoElement.dataset.idcode, videoWidth, videoHeight)
        myAPI.updateYoutubeOriginalSize(idcode, videoWidth, videoHeight)
        //event.target.getIframe().parentElement.style.width = videoWidth + 'px'
        //event.target.getIframe().parentElement.style.height = videoHeight + 'px'
        done = true;
    }
}
function stopVideo() {
    player.stopVideo();
}
const targetNode = document.getElementById('eventTrigger');
const config = { attributes: true };
const callback = function (mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            console.log('A child node has been added or removed.');
        }
        else if (mutation.type === 'attributes') {
            console.log('The ' + mutation.attributeName + ' attribute was modified.');
            if (mutation.attributeName == 'data-youtubetrigger') {
                embedYoutubeVideo()
            } else if (mutation.attributeName == 'data-changesliders') {
                //console.log(mutation)
                //
                let changesliders = JSON.parse(mutation.target.dataset.changesliders)
                slider.noUiSlider.set(changesliders);
            }

        }
    }
};
const observer = new MutationObserver(callback);
// Start observing the target node for configured mutations
observer.observe(targetNode, config);
function embedYoutubeVideo() {
    var playerNeedsSetup = document.querySelector('.playerNeedsSetup');
    if (!playerNeedsSetup) {
        console.error('embedYoutubeVideo called without player div to setup')
    };
    playerNeedsSetup.classList.remove('playerNeedsSetup')
    var iframediv = playerNeedsSetup.querySelector('.iframeDiv')
    var code = playerNeedsSetup.dataset.idcode

    //document.querySelector()
    player = new YT.Player(iframediv, {
        videoId: code,
        playerVars: {
            //'playsinline': 1
            'controls': 0,
            'disablekb': 1,
            'enablejsapi': 1,
            'fs': 0,
            'loop': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// --- Custom Code ---
// function addVideoControls() {
//     const controls = document.createElement('div');
//     controls.id = 'customVideoControls';
//     controls.innerHTML = 
//         <style>
//             #customVideoControls {
//                 position: fixed;
//                 bottom: 20px;
//                 left: 50%;
//                 transform: translateX(-50%);
//                 background: rgba(30, 30, 30, 0.85);
//                 padding: 12px 20px;
//                 border-radius: 10px;
//                 display: flex;
//                 gap: 15px;
//                 align-items: center;
//                 z-index: 10000;
//                 box-shadow: 0 0 10px rgba(0,0,0,0.4);
//             }
//             #customVideoControls button {
//                 background: #444;
//                 border: none;
//                 color: white;
//                 font-size: 18px;
//                 padding: 8px 12px;
//                 border-radius: 6px;
//                 cursor: pointer;
//                 transition: background 0.3s;
//             }
//             #customVideoControls button:hover {
//                 background: #666;
//             }
//             #customVideoControls input[type="range"] {
//                 width: 100px;
//             }
//         </style>
//         <button id="rewindBtn">⏪ 5s</button>
//         <button id="playPauseBtn">▶️/⏸️</button>
//         <button id="forwardBtn">5s ⏩</button>
//         <input type="range" id="volumeSlider" min="0" max="100" value="50" title="Volume">
//     ;
//     document.body.appendChild(controls);
//     wireUpControlEvents();
// }

// function wireUpControlEvents() {
//     const playPauseBtn = document.getElementById('playPauseBtn');
//     const rewindBtn = document.getElementById('rewindBtn');
//     const forwardBtn = document.getElementById('forwardBtn');
//     const volumeSlider = document.getElementById('volumeSlider');

//     playPauseBtn.addEventListener('click', () => {
//         const state = player.getPlayerState();
//         if (state === YT.PlayerState.PLAYING) player.pauseVideo();
//         else player.playVideo();
//     });

//     rewindBtn.addEventListener('click', () => {
//         const currentTime = player.getCurrentTime();
//         player.seekTo(Math.max(currentTime - 5, 0), true);
//     });

//     forwardBtn.addEventListener('click', () => {
//         const currentTime = player.getCurrentTime();
//         player.seekTo(Math.min(currentTime + 5, player.getDuration()), true);
//     });

//     volumeSlider.addEventListener('input', (e) => {
//         const volume = parseInt(e.target.value, 10);
//         player.setVolume(volume);
//         if (volume === 0) player.mute();
//         else player.unMute();
//     });
// }

// function setupKeyboardShortcuts() {
//     document.addEventListener('keydown', (e) => {
//         if (!player) return;
//         switch (e.code) {
//             case 'Space':
//                 e.preventDefault();
//                 const state = player.getPlayerState();
//                 if (state === YT.PlayerState.PLAYING) player.pauseVideo();
//                 else player.playVideo();
//                 break;
//             case 'ArrowLeft':
//                 player.seekTo(Math.max(player.getCurrentTime() - 5, 0), true);
//                 break;
//             case 'ArrowRight':
//                 player.seekTo(Math.min(player.getCurrentTime() + 5, player.getDuration()), true);
//                 break;
//             case 'ArrowDown':
//                 player.setVolume(Math.max(player.getVolume() - 10, 0));
//                 break;
//             case 'ArrowUp':
//                 player.setVolume(Math.min(player.getVolume() + 10, 100));
//                 break;
//         }
//     });
// }

// ipcRenderer.on('video-control', (event, action) => {
//     if (!player) return;
//     switch (action) {
//         case 'playPause':
//             const state = player.getPlayerState();
//             if (state === YT.PlayerState.PLAYING) player.pauseVideo();
//             else player.playVideo();
//             break;
//         case 'rewind':
//             player.seekTo(Math.max(player.getCurrentTime() - 5, 0), true);
//             break;
//         case 'forward':
//             player.seekTo(Math.min(player.getCurrentTime() + 5, player.getDuration()), true);
//             break;
//         case 'volumeUp':
//             player.setVolume(Math.min(player.getVolume() + 10, 100));
//             break;
//         case 'volumeDown':
//             player.setVolume(Math.max(player.getVolume() - 10, 0));
//             break;
//     }
// });

// --- End Of Custom Code ---