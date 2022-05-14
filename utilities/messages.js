const moment = require('moment');
const messages = [];
const doodlePaths = [];

function messageFormat(username, userMessage, saveMessage) {
    let now = new Date().getTime();

    const message = {username, userMessage, time: now};
    if (saveMessage) {
        messages.push(message);
    }
    return message;
}

function noticeFormat(username, userMessage) {
    let now = new Date().getTime();

    const message = {username, userMessage, time: now};
    return message;
}

function saveDoodlePath(data) {
    doodlePaths.push(data);
}

function resetMessages() {
    messages.length = 0;
}

function resetDoodle() {
    doodlePaths.length = 0;
}

module.exports = {
    messageFormat,
    noticeFormat,
    saveDoodlePath,
    resetMessages,
    resetDoodle,
    doodlePaths,
    messages
};