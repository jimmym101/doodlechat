const users = [];

// Join user to chat
function userJoin(id, username, room) {
    const user = {id, username, room}
    users.push(user);
    return user;
}

// Get user
function getUser(id) {
    return users.find(user => user.id === id);
}

// Remove user
function removeUser(id) {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// Get all users
function getAllUsers(room) {
    return users.filter(user => user.room === room);
}

module.exports = {
    userJoin,
    getUser,
    removeUser,
    getAllUsers
};