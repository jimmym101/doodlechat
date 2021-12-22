const moment = require('moment');
const messages = [];
const doodlePaths = [];

function messageFormat(username, userMessage, saveMessage) {
    const message = {username, userMessage, time: moment().format('h:mm a')};
    if (saveMessage) {
        messages.push(message);
    }
    return message;
}

function noticeFormat(username, userMessage) {
    const message = {username, userMessage, time: moment().format('h:mm a')};
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