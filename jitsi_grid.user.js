// ==UserScript==
// @name         Jitsi Video Grid
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Arrange video windows to take up as much space as possible
// @author       Michael Schroder
// @include      https://meet.*.space/*
// @match        https://meet.jit.si/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    function getBestLayout(num, innerAspect, outerAspect) {
        let best = [1, 1];
        let bestAspectPercent = 4000;
        for (let rows = 1; rows <= num; rows++) {
            let cols = Math.ceil(num / rows);
            let newAspect = innerAspect * cols / rows;
            let aspectPercent = Math.abs((newAspect / outerAspect) - 1);
            if (aspectPercent < bestAspectPercent) {
                bestAspectPercent = aspectPercent;
                best = [cols, rows];
            }
        }
        return best;
    }

    function layoutGrid(outerEl, innerEls) {
        let aspect = 1.77;
        let layout = getBestLayout(
            innerEls.length,
            aspect,
            outerEl.offsetWidth / outerEl.offsetHeight);
        outerEl.style.display = 'grid';
        outerEl.style.gridTemplateColumns = `repeat(${layout[0]}, 1fr)`;
        let outerSize = [outerEl.offsetWidth, outerEl.offsetHeight];
        let innerWidth = Math.min(outerSize[0] / layout[0], (outerSize[1] / layout[1]) * aspect);
        for (let i = 0; i < innerEls.length; i++) {
            let innerEl = innerEls[i];
            innerEl.style.width = `${innerWidth - 10}px`;
            innerEl.style.height = `${innerWidth / aspect - 10}px`;
            innerEl.style.marginLeft = '5px';
            innerEl.style.marginRight = '5px';

            let lastRowFirstIndex = Math.floor(innerEls.length / layout[0]) * layout[0];
            let numLastRow = innerEls.length % layout[0];
            if (i >= lastRowFirstIndex) {
                console.log(((layout[0] - numLastRow) * innerWidth) / 2);
                innerEl.style.marginLeft = `${((layout[0] - numLastRow) * innerWidth) / 2}px`;
                innerEl.style.marginRight = `-${((layout[0] - numLastRow) * innerWidth) / 2}px`;
            }
        }

    }

    function updateGrid() {
        /* .avatar-container
          height: 0;
          width: 18.3%;
          padding-bottom: 18.3%;

          .watermark
            width: 93px;
            height: 37px;
        */
        let videoContainer = document.querySelector('#filmstripRemoteVideosContainer');
        let containerWrapper = document.querySelector('#filmstripRemoteVideos');
        videoContainer.style.marginLeft = 'auto';
        videoContainer.style.marginRight = 'auto';
        videoContainer.style.width = 'calc(100% - 24px)';
        videoContainer.style.height = 'calc(100% - 24px)';
        videoContainer.style.overflow = 'hidden';
        containerWrapper.style.height = '100vh';
        containerWrapper.style.width = '100vw';
        containerWrapper.style.margin = '0';
        layoutGrid(videoContainer, document.querySelectorAll('span.videocontainer'));
        videoContainer.style.width = 'auto';
    }

    window.addEventListener('resize', () => {
        updateGrid();
    });

    // Options for the observer (which mutations to observe)
    const config = {
        childList: true
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(() => {
        updateGrid();
    });

    // Start observing the target node for configured mutations
    observer.observe(document.querySelector('#filmstripRemoteVideosContainer'), config);
})();
