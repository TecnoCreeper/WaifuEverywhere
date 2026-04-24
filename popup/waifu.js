// Replace onClick event since it's blocked in webextension
document.addEventListener("DOMContentLoaded", function () {
    const generateButton = document.getElementById("new-waifu");
    const infoButton = document.getElementById("info");
    // onClick's logic below:
    generateButton.addEventListener("click", function () {
        getWaifu();
    });
    infoButton.addEventListener("click", function () {
        toggleInfo();
    });
});

// when popup is opened, load image and description from local storage
restoreState();

// generate new image and set description
function getWaifu() {
    // set loading gif
    const imgTag = document.getElementById("waifu");
    imgTag.setAttribute("src", "Spin-1s-200px.gif");

    // api request
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.waifu.im/images/?IsNsfw=False");
    xhr.setRequestHeader("Accept-Version", "v7");
    xhr.send();
    xhr.onload = function () {
        if (xhr.status !== 200) {
            throw new Error();
        }

        const response = JSON.parse(xhr.responseText).items[0];

        let source = response.source;
        // if it's a reddit url and it's broken it gets fixed
        const shortlink = handleRedditUrl(response.source);
        if (shortlink) {
            source = shortlink;
        }

        const dominant_color = response.dominantColor;
        const tags = response.tags.map((t) => t.name).join(", ");

        let artist;
        if (response.artists.length !== 0) {
            artist = getArtistDetails(response);
        }

        // set description
        const description = document.getElementById("description");
        description.innerHTML = DOMPurify.sanitize(
            crateInfoHTML(source, tags, dominant_color, artist),
        );

        // set image
        imgTag.setAttribute("src", response.url);

        const infovisibility = document
            .getElementById("description-col")
            .classList.contains("d-none")
            ? "hide"
            : "show";

        // save current state to local storage
        saveState(
            response.url,
            source,
            tags,
            dominant_color,
            artist,
            infovisibility,
        );
    };
}

function getArtistDetails(response) {
    const artist = response.artists[0];

    let link;
    if (artist.twitter) {
        link = artist.twitter;
    } else if (artist.pixiv) {
        link = artist.pixiv;
    } else if (artist.patreon) {
        link = artist.patreon;
    } else if (artist.deviantArt) {
        link = artist.deviantArt;
    }

    return { name: artist.name, link };
}

function handleRedditUrl(url) {
    const regexp = /reddit\.com\/.{6}/i;
    if (regexp.test(url)) {
        const id = regexp.exec(url)[0].split("/")[1];
        return `https://redd.it/${id}`;
    }
}

function crateInfoHTML(source, tags, dominant_color, artist) {
    let rawHTML = "<p class='text-break'>";
    if (source) {
        rawHTML += `
                <a href='${source}' target='_blank'>Source</a><br /><br />
            `;
    }

    rawHTML += `
                Tags: ${tags}<br /><br />
                Dominant color: ${dominant_color}
        `;

    if (artist) {
        if (artist.name && !artist.link) {
            rawHTML += `
                <br /><br />
                Artist: ${artist.name}
            `;
        } else if (artist.name && artist.link) {
            rawHTML += `
                <br /><br />
                Artist: <a href='${artist.link}' target='_blank'>${artist.name}</a>
            `;
        }
    }

    rawHTML += "</p>";

    return rawHTML;
}

function toggleInfo(state) {
    // things that change: min-width of 'root', info column visibility, content column width, info button color

    const descriptionCol = document.getElementById("description-col");
    const contentCol = document.getElementById("content-col");
    const infoButton = document.getElementById("info");
    const rootDiv = document.getElementById("root");

    if (
        (descriptionCol.classList.contains("d-none") && !state) ||
        state === "show"
    ) {
        // switch to show info

        rootDiv.classList.add("expanded-minwidth");

        contentCol.classList.remove("col-12");
        contentCol.classList.add("col-8");

        descriptionCol.classList.remove("d-none");

        infoButton.classList.remove("btn-outline-info");
        infoButton.classList.add("btn-info");

        browser.storage.local.set({ infovisibility: "show" });
    } else if (
        (!descriptionCol.classList.contains("d-none") && !state) ||
        state === "hide"
    ) {
        // switch to hide info

        descriptionCol.classList.add("d-none");

        contentCol.classList.remove("col-8");
        contentCol.classList.add("col-12");

        rootDiv.classList.remove("expanded-minwidth");

        infoButton.classList.remove("btn-info");
        infoButton.classList.add("btn-outline-info");

        browser.storage.local.set({ infovisibility: "hide" });
    }
}

// save current state to local storage
function saveState(
    imageURL,
    imgSource,
    tags,
    dominant_color,
    artist,
    infovisibility,
) {
    const data = {
        url: imageURL,
        source: imgSource,
        tags: tags,
        dominant_color: dominant_color,
        artist: artist,
        infovisibility: infovisibility,
    };
    browser.storage.local.set(data);
}

// when popup is opened, load image and description from local storage
function restoreState() {
    browser.storage.local.get(null).then(function (data) {
        // if there is data in local storage
        if (data.url) {
            // set description
            const description = document.getElementById("description");
            description.innerHTML = DOMPurify.sanitize(
                crateInfoHTML(
                    data.source,
                    data.tags,
                    data.dominant_color,
                    data.artist,
                ),
            );

            // set info panel
            toggleInfo(data.infovisibility);

            // set image
            const imgTag = document.getElementById("waifu");
            imgTag.setAttribute("src", data.url);
        } else {
            const imgTag = document.getElementById("waifu");
            imgTag.src = "";
            const description = document.getElementById("description");
            description.innerHTML = "<p class='text-break'>No description</p>";
            toggleInfo("hide");
        }
    });
}
