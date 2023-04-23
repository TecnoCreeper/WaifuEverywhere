// function to replace onClick event since it's blocked in webextension
document.addEventListener('DOMContentLoaded', function () {
    const generateButton = document.getElementById('new-waifu');
    const infoButton = document.getElementById('info');
    // onClick's logic below:
    generateButton.addEventListener('click', function () {
        getWaifu();
    });
    infoButton.addEventListener('click', function () {
        toggleInfo();
    });
});

// when popup is opened, load image and description from local storage
restoreImage();

// generate new image and set description
function getWaifu() {

    // set loading gif
    const imgTag = document.getElementById("waifu");
    imgTag.setAttribute("src", "Spin-1s-200px.gif");

    // api get request
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.waifu.im/search/?is_nsfw=false");
    xhr.send();
    xhr.onload = function () {

        const response = JSON.parse(xhr.responseText);

        // get wanted data from response
        const url = response.images[0].url;
        const source = response.images[0].source;
        const is_nsfw = response.images[0].is_nsfw;

        const tag_list = [];
        response.images[0].tags.forEach(element => {
            tag_list.push(element.name)
        });
        const tags = tag_list.join(", ");

        const extension = response.images[0].extension;
        const width = response.images[0].width;
        const height = response.images[0].height;
        const byte_size = response.images[0].byte_size;
        const dominant_color = response.images[0].dominant_color;


        // set description
        const description = document.getElementById('description');
        rawHTML = `<p class='text-break'>
                                    Source:
                                    <a href='${source}' target='_blank'>${getDomainName(source)}</a><br>
                                    <br>
                                    Is NSFW:
                                    ${is_nsfw}<br>
                                    <br>
                                    Tags:
                                    ${tags}<br>
                                    <br>
                                    Extension:
                                    ${extension}<br>
                                    <br>
                                    Width:
                                    ${width}<br>
                                    <br>
                                    Height:
                                    ${height}<br>
                                    <br>
                                    Byte size:
                                    ${byte_size}<br>
                                    <br>
                                    Dominant color:
                                    ${dominant_color}
                                </p>`;
        let cleanHTML = DOMPurify.sanitize(rawHTML);
        description.innerHTML = cleanHTML;

        // set image
        const img = new Image();
        img.src = url;
        img.onload = function () {
            imgTag.src = img.src;
        }

        // save current state to local storage
        saveState(url, source, is_nsfw, tags, extension, width, height, byte_size, dominant_color);
    }
}

// info column toggle
function toggleInfo() {

    // thing that change: min-width of 'root', info column visibility, content column width, info button color

    const descriptionCol = document.getElementById('description-col');
    const contentCol = document.getElementById('content-col');
    const infoButton = document.getElementById('info');
    const rootDiv = document.getElementById('root');

    // if info is hidden, then show
    if (descriptionCol.classList.contains("d-none")) {

        // info ON state

        rootDiv.classList.add("expanded-minwidth")

        descriptionCol.classList.remove("d-none");

        contentCol.classList.remove("col-12");
        contentCol.classList.add("col-8");

        infoButton.classList.remove("btn-outline-info");
        infoButton.classList.add("btn-info");
    }

    // if info is shown, then hide
    else {

        // info OFF state

        rootDiv.classList.remove("expanded-minwidth")

        descriptionCol.classList.add("d-none");

        contentCol.classList.remove("col-8");
        contentCol.classList.add("col-12");

        infoButton.classList.remove("btn-info");
        infoButton.classList.add("btn-outline-info");
    }
}

// save current state to local storage
function saveState(imageURL, imgSource, is_nsfw, tags, extension, width, height, byte_size, dominant_color) {
    const data = {
        "url": imageURL,
        "source": imgSource,
        "is_nsfw": is_nsfw,
        "tags": tags,
        "extension": extension,
        "width": width,
        "height": height,
        "byte_size": byte_size,
        "dominant_color": dominant_color
    }
    browser.storage.local.set(data)
}

// when popup is opened, load image and description from local storage
function restoreImage() {
    browser.storage.local.get(null).then(function (data) {

        // if there is data in local storage
        if (data.url) {
            // get data from local storage
            const url = data.url;
            const source = data.source;
            const is_nsfw = data.is_nsfw;
            const tags = data.tags;
            const extension = data.extension;
            const width = data.width;
            const height = data.height;
            const byte_size = data.byte_size;
            const dominant_color = data.dominant_color;

            // set description
            const description = document.getElementById('description');
            rawHTML = `<p class='text-break'>
                                        Source:
                                        <a href='${source}' target='_blank'>${getDomainName(source)}</a><br>
                                        <br>
                                        Is NSFW:
                                        ${is_nsfw}<br>
                                        <br>
                                        Tags:
                                        ${tags}<br>
                                        <br>
                                        Extension:
                                        ${extension}<br>
                                        <br>
                                        Width:
                                        ${width}<br>
                                        <br>
                                        Height:
                                        ${height}<br>
                                        <br>
                                        Byte size:
                                        ${byte_size}<br>
                                        <br>
                                        Dominant color:
                                        ${dominant_color}
                                    </p>`;
            let cleanHTML = DOMPurify.sanitize(rawHTML);
            description.innerHTML = cleanHTML;

            // set image
            const imgTag = document.getElementById("waifu");
            const img = new Image();
            img.src = url;
            img.onload = function () {
                imgTag.src = img.src;
            }
        }
        // if there is no data in local storage
        else {
            const imgTag = document.getElementById("waifu");
            imgTag.src = "";
            const description = document.getElementById('description');
            description.innerHTML = "<p class='text-break'>No description</p>";

        }
    });
}

// extract the domain name from a url
function getDomainName(url) {
    const domain = url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/)[0];
    return domain;
}