// Socket IO
var socket = io();
// Reload page if connection to server disconnects
socket.on('disconnect', function () {
    window.location.reload();
});
window.addEventListener('click', (e) => {
    if (document.body.classList.contains('colourSelect')) {
        document.body.classList.remove('colourSelect')
    }
    if (document.body.classList.contains('chat')) {
        document.body.classList.remove('chat')
    }
    return false;
});

// Chatbox functions
var chatBox = document.getElementById('chatbox');
var mini = document.getElementsByClassName('mini')[0];
var closeChat = document.getElementsByClassName('compressChat')[0];
var joinForm = document.getElementById('joinForm');
var inputMessage = document.getElementById('inputMessage');
var chatForm = document.getElementById('chatForm');
var chatList = document.getElementsByClassName('messages')[0];
var messageicon = document.getElementById('messageicon');
var userCount = document.getElementById('count');
// Event listeners - open, close and form submission
chatBox.addEventListener('click', (e) => {
    // Stop events bubbling to body
    e.stopPropagation();
});
mini.addEventListener('click', () => {
    // Open chat
    chatBoxSize(1);
});
closeChat.addEventListener('click', () => {
    // Close chat
    chatBoxSize(0);
});
joinForm.addEventListener('submit', (e) => {
    // Join chat submission
    e.preventDefault();
    var message = joinForm.elements.username.value;
    socket.emit('joinChat', message);
});
chatForm.addEventListener('submit', (e) => {
    // Submit chat submission
    e.preventDefault();
    var message = inputMessage.value;
    socket.emit('userMessage', message);
    inputMessage.value = '';
    inputMessage.focus();
});
// Socket.io listeners
socket.on('newJoin', message => {
    if (message == 'accepted') {
        chatBox.classList.remove('notJoined');
        inputMessage.focus();
        // Remove join form from the dom
        joinForm.parentNode.remove();
    }
});
socket.on('message', message => {
    showNewMessage(message);
    chatList.parentNode.scrollBy({top: chatList.parentNode.scrollHeight, behavior: 'smooth'});
});
socket.on('notice', message => {
    showNewNotice(message);
    chatList.parentNode.scrollBy({top: chatList.parentNode.scrollHeight, behavior: 'smooth'});
});
// Chatbox size
function chatBoxSize(x) {
    if (x === 1) {
        // Open chatbox
        document.body.className = "chat";
        chatList.parentNode.scrollBy({top: chatList.parentNode.scrollHeight, behavior: 'auto'});
        if (chatBox.classList.contains('notJoined')) {
            joinForm.username.focus();
        } else {
            inputMessage.focus();
        }
        messageicon.classList.remove('hasNew');
    } else {
        // Close chatbox
        if (chatBox.classList.contains('notJoined')) {
            joinForm.username.blur();
        } else {
            inputMessage.blur();
        }
        document.body.className = "";
    }
};
// Show new messages from socket.io
function showNewMessage(message) {
    const newMessage = document.createElement('li');
    if (message.username == 'You') {
        newMessage.className = 'message self';
    } else if (message.username == 'Doodlechat') {
        newMessage.className = 'message bot';
    } else {
        newMessage.className = 'message';    
    }
    var inner = `<span>${message.username} ${message.time}</span><p>`;
    inner += message.userMessage;
    inner += '</p>';
    newMessage.innerHTML = inner;
    chatList.appendChild(newMessage);
    if (!document.body.classList.contains('chat')) {
        messageicon.classList.add('hasNew');
    }
};
// Show notices from socket.io
function showNewNotice(message) {
    const newMessage = document.createElement('li');
    newMessage.className = 'notice';
    var inner = '<span>';
    inner += message.userMessage;
    inner += '</span>';
    newMessage.innerHTML = inner;
    chatList.appendChild(newMessage);
};
// Update user count
socket.on('count', message => {
    userCount.innerHTML = message;
});

// Doodle Functions
var pad = document.getElementById('penPad');
var chatterContainer = document.getElementById('chatterContainer');
var colourControl = document.getElementById('colourControl');
var colours = document.getElementsByClassName('colours');
var reset = document.getElementById('reset');
// var winH = document.documentElement.clientHeight || document.body.clientHeight;
// var winW = document.documentElement.clientWidth || document.body.clientWidth;
var winH = window.innerHeight;
var winW = window.innerWidth;
var drawing = false;
padData = [];
var current = {strokeWidth: '3',colour: 'blue'};
// Event listeners
colourControl.addEventListener('click', (e) => {
    // Colour Control
    e.stopPropagation();
    if (document.body.classList.contains('colourSelect')) {
        document.body.className = "";
    } else {
        document.body.className = "colourSelect";
    }
});
Array.from(colours).forEach(colour => {
    colour.addEventListener("click", (e) => {
        if (document.body.classList.contains('colourSelect')) {
            e.stopPropagation();
            var selected = colour.getAttribute("data-colour");
            colour.parentNode.className = selected;
            document.body.className = "";
            current.colour = selected;
        } else {
            return false;
        }
    });
});
reset.addEventListener("click", (e) => {
    // Reset doodle
    e.stopPropagation();
    if (document.body.classList.contains('colourSelect')) {
        document.body.classList.remove('colourSelect')
    }
    if (document.body.classList.contains('chat')) {
        document.body.classList.remove('chat')
    }
    socket.emit('reset', 'doodle');
});
pad.addEventListener('mousedown', startDraw, false);
pad.addEventListener('mouseup', endDraw, false);
pad.addEventListener('mouseout', endDraw, false);
pad.addEventListener('mousemove', throttle(drawMove, 10), false);
pad.addEventListener('touchstart', startDraw, false);
pad.addEventListener('touchend', endDraw, false);
pad.addEventListener('touchcancel',  endDraw, false);
pad.addEventListener('touchmove', throttle(drawMove, 10), false);
// Socket.io listeners
socket.on('doodleReset', () => {
    ctx.clearRect(0, 0, pad.width, pad.height);
    var winH = window.innerHeight;
    var winW = window.innerWidth;
    chatterContainer.style.height = winH + 'px';
    chatterContainer.style.width = winW + 'px';
    pad.width = winW;
    pad.height = winH;
});
socket.on('doodle', data => {
    // Draw other clients' doodles
    drawSocketDoodle(data);
});
socket.on('connect', () => {
    ctx.clearRect(0, 0, pad.width, pad.height);
});
// Initialise doodlepad
var ctx = pad.getContext('2d');
chatterContainer.style.height = winH + 'px';
chatterContainer.style.width = winW + 'px';
pad.width = winW;
pad.height = winH;
// Draw paths on canvas
function draw(x0, y0, x1, y1, colour, stroke, emit) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = colour;
    ctx.lineWidth = stroke;
    ctx.stroke();
    ctx.closePath();
    if (!emit) {
        return;
    }
    var w = pad.width;
    var h = pad.height;
    // Emit data to socket.io for other clients
    socket.emit("doodle", {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        colour: colour,
        stroke: stroke
    });
}
// Start Draw
function startDraw(e) {
    drawing = true;
    current.x = e.clientX || e.touches[0].clientX;
    current.y = e.clientY || e.touches[0].clientY;
}
// End Draw
function endDraw(e) {
    if (!drawing) {
        return;
    }
    drawing = false;
    try {
        draw(
            current.x,
            current.y,
            e.clientX || e.touches[0].clientX,
            e.clientY || e.touches[0].clientY,
            current.colour,
            current.strokeWidth,
            true
        );
    } catch (error) {
        return;
    }
}
// Draw Move
function drawMove(e) {
    if (!drawing) {
        return;
    }
    try {
        draw(
            current.x,
            current.y,
            e.clientX || e.touches[0].clientX,
            e.clientY || e.touches[0].clientY,
            current.colour,
            current.strokeWidth,
            true
        );
    } catch (error) {
        return;
    }
    current.x = e.clientX || e.touches[0].clientX;
    current.y = e.clientY || e.touches[0].clientY;
}
// Throttle doodle emits to socket.io
function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
        var time = new Date().getTime();

        if (time - previousCall >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
}
// Draw doodles received by socket.io
function drawSocketDoodle(data) {
    var w = pad.width;
    var h = pad.height;
    draw(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.colour, data.stroke, false);
}