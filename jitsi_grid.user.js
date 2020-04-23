// ==UserScript==
// @name         Jitsi Video Grid
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Arrange video windows to take up as much space as possible
// @author       Michael Schroder
// @include      https://meet.*.space/*
// @match        https://meet.jit.si/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addStyle(css) {
        const style = document.getElementById("GM_addStyleContainer") || (function() {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.id = "GM_addStyleContainer";
            document.head.appendChild(style);
            return style;
        })();
        const sheet = style.sheet;
        sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
    }

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
        outerEl.style.gridTemplateColumns = `repeat(${layout[0]}, 1fr)`;
        let outerSize = [outerEl.offsetWidth, outerEl.offsetHeight];
        let innerWidth = Math.min(outerSize[0] / layout[0], (outerSize[1] / layout[1]) * aspect);
        for (let i = 0; i < innerEls.length; i++) {
            let innerEl = innerEls[i];
            innerEl.style.width = `${innerWidth - 10}px`;
            innerEl.style.height = `${innerWidth / aspect - 10}px`;

            let lastRowFirstIndex = Math.floor(innerEls.length / layout[0]) * layout[0];
            let numLastRow = innerEls.length % layout[0];
            if (i >= lastRowFirstIndex) {
                innerEl.style.marginLeft = `${((layout[0] - numLastRow) * innerWidth) / 2}px`;
                innerEl.style.marginRight = `-${((layout[0] - numLastRow) * innerWidth) / 2}px`;
            } else {
                innerEl.style.marginLeft = '';
                innerEl.style.marginRight = '';
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
        let conferencePage = document.querySelector('#videoconference_page');
        let videos = document.querySelectorAll('span.videocontainer');
        if (conferencePage.className == "tile-view") {
            let videoContainer = document.querySelector('#filmstripRemoteVideosContainer');
            videoContainer.style.width = 'calc(100% - 24px)';
            layoutGrid(videoContainer, document.querySelectorAll('span.videocontainer'));
            videoContainer.style.width = '';
        } else {
            for (let video of videos) {
                video.style.width = '';
                video.style.height = '';
                video.style.marginLeft = '';
                video.style.marginRight = '';
            }
        }
    }

    addStyle(`
        .tile-view #filmstripRemoteVideosContainer {
            margin-left: auto;
            margin-right: auto;
            overflow: hidden;
            height: calc(100% - 24px);
            width: auto;
            display: grid;
        }
    `);

    addStyle(`
        .tile-view #filmstripRemoteVideos {
            margin: 0;
            height: 100vh;
            width: 100vw;
        }
    `);

    addStyle(`
        .tile-view span.videocontainer {
            margin-left: 5px;
            margin-right: 5px;
        }
    `);

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

    // Update when switching between views
    new MutationObserver(() => {
        updateGrid();
    }).observe(document.querySelector('#videoconference_page'), {
        attributes: true
    });
})();
