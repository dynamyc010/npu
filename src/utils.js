// Verify that we are indeed on a Neptun page
function isLegacyNeptunPage() {
    return document.title.toLowerCase().indexOf("neptun.net") !== -1;
}

function isNeptunPage() {
    return document.title.toLowerCase().indexOf("neptun web") !== -1;
}

module.exports = {
    isLegacyNeptunPage,
    isNeptunPage
}