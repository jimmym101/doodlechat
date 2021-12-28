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

// Chat
// Socket.io listeners
socket.on('newJoin', message => {
    chat.joinedChat(message);
});
socket.on('message', message => {
    chat.showNewMessage(message);
});
socket.on('notice', message => {
    chat.showNewNotice(message);
});
socket.on('count', message => {
    chat.userCount(message);
});
// Chat Object
function Chat() {
    // Dom elements
    const chatBox = document.getElementById('chatbox');
    const mini = document.getElementsByClassName('mini')[0];
    const closeChat = document.getElementsByClassName('compressChat')[0];
    const chatList = document.getElementsByClassName('messages')[0];
    const joinForm = document.getElementById('joinForm');
    const inputMessage = document.getElementById('inputMessage');
    const chatForm = document.getElementById('chatForm');
    const messageicon = document.getElementById('messageicon');
    const userCount = document.getElementById('count');
    // User count
    this.userCount = (message) => {
        userCount.innerHTML = "";
        setTimeout(() => {
            userCount.innerHTML = message;
        }, 50 );
    }
    // Joined chat
    this.joinedChat = (message) => {
        if (message == 'accepted') {
            chatBox.classList.remove('notJoined');
            inputMessage.focus();
            // Remove join form from the dom
            joinForm.parentNode.remove();
        }
    }
    // Show new messages from socket.io
    this.showNewMessage = (message) => {
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
        chatList.parentNode.scrollBy({top: chatList.parentNode.scrollHeight, behavior: 'smooth'});
    }
    // Show notices from socket.io
    this.showNewNotice = (message) => {
        const newMessage = document.createElement('li');
        newMessage.className = 'notice';
        var inner = '<span>';
        inner += message.userMessage;
        inner += '</span>';
        newMessage.innerHTML = inner;
        chatList.appendChild(newMessage);
        chatList.parentNode.scrollBy({top: chatList.parentNode.scrollHeight, behavior: 'smooth'});  
    }
    // Chatbox size
    this.chatBoxSize = (x) => {
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
    }
    // Initialise event listeners
    chatBox.addEventListener('click', (e) => {
        // Stop events bubbling to body
        e.stopPropagation();
    });
    mini.addEventListener('click', () => {
        // Open chat
        this.chatBoxSize(1);
    });
    closeChat.addEventListener('click', () => {
        // Close chat
        this.chatBoxSize(0);
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
}

// Doodle
// Socket.io listeners
socket.on('doodleReset', () => {
    doodle.padSize();
    doodle.padReset();
});
socket.on('doodle', data => {
    doodle.drawSocketDoodle(data);
});
socket.on('connect', () => {
    doodle.padSize();
    doodle.padReset();
});

// Doodle Object
function Doodle() {
    // Dom elements
    const pad = document.getElementById('penPad');
    const chatterContainer = document.getElementById('chatterContainer');
    const colourControl = document.getElementById('colourControl');
    const colours = document.getElementsByClassName('colours');
    const reset = document.getElementById('reset');
    // Drawing variables
    var ctx = pad.getContext('2d');
    var drawing = false;
    this.current = {strokeWidth: '3',colour: 'blue'};
    // Initialise doodle event listeners
    this.initEL = () => {
    }
    // Reset pad - from socket.io
    this.padReset = () => {
        ctx.clearRect(0, 0, pad.width, pad.height);
    }
    // Set pad dimensions
    this.padSize = () => {
        var winH = window.innerHeight;
        var winW = window.innerWidth;
        chatterContainer.style.height = winH + 'px';
        chatterContainer.style.width = winW + 'px';
        pad.width = winW;
        pad.height = winH;
    }
    // Throttle doodle emits to socket.io
    this.throttle = (callback, delay) => {
        var previousCall = new Date().getTime();
        return function () {
            var time = new Date().getTime();

            if (time - previousCall >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }
    // Draw paths on canvas
    this.draw = (x0, y0, x1, y1, colour, stroke, emit) => {
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
    this.startDraw = (e) => {
        drawing = true;
        this.current.x = e.clientX || e.touches[0].clientX;
        this.current.y = e.clientY || e.touches[0].clientY;
    }
    // End Draw
    this.endDraw = (e) => {
        if (!drawing) {
            return;
        }
        drawing = false;
        try {
            this.draw(
                this.current.x,
                this.current.y,
                e.clientX || e.touches[0].clientX,
                e.clientY || e.touches[0].clientY,
                this.current.colour,
                this.current.strokeWidth,
                true
            );
        } catch (error) {
            return;
        }
    }
    // Draw Move
    this.drawMove = (e) => {
        if (!drawing) {
            return;
        }
        try {
            this.draw(
                this.current.x,
                this.current.y,
                e.clientX || e.touches[0].clientX,
                e.clientY || e.touches[0].clientY,
                this.current.colour,
                this.current.strokeWidth,
                true
            );
        } catch (error) {
            return;
        }
        this.current.x = e.clientX || e.touches[0].clientX;
        this.current.y = e.clientY || e.touches[0].clientY;
    }
    // Draw doodles received by socket.io
    this.drawSocketDoodle = (data) => {
        var w = pad.width;
        var h = pad.height;
        this.draw(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.colour, data.stroke, false);  
    }
    // Initialise event listeners
    colourControl.addEventListener('click', (e) => {
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
                this.current.colour = selected;
            } else {
                return false;
            }
        });
    });
    reset.addEventListener("click", (e) => {
        e.stopPropagation();
        if (document.body.classList.contains('colourSelect')) {
            document.body.classList.remove('colourSelect')
        }
        if (document.body.classList.contains('chat')) {
            document.body.classList.remove('chat')
        }
        socket.emit('reset', 'doodle');
    });
    pad.addEventListener('mousedown', this.startDraw, false);
    pad.addEventListener('mouseup', this.endDraw, false);
    pad.addEventListener('mouseout', this.endDraw, false);
    pad.addEventListener('mousemove', this.throttle(this.drawMove, 10), false);
    pad.addEventListener('touchstart', this.startDraw, false);
    pad.addEventListener('touchend', this.endDraw, false);
    pad.addEventListener('touchcancel',  this.endDraw, false);
    pad.addEventListener('touchmove', this.throttle(this.drawMove, 10), false);
}

// Initialise instance of Doodle & Chat
const doodle = new Doodle();
const chat = new Chat();
