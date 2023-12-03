const { Server } = require('socket.io');

interface dataType {
    room?: boolean,
    message?: string
    user: number
    roomName?: string
}

const io = new Server();
let userDataArray: any[] = [];
let roomDataArray = {};


io.on('connection', async (socket: any) => {

    let socketIds: any = [];

    socket.on('nodeJSEvent', (data: dataType) => {
        console.log("data", data);
        const user = data.user;
        const obj = {
            [user]: socket.id
        }
        const userData = userDataArray.filter(o => Object.keys(o).includes(String([data.user])));
        if (userData.length === 0) {
            userDataArray.push(obj);
        }
        
        
        if (roomDataArray.hasOwnProperty(data.roomName ? data.roomName : "")) {
            roomDataArray[data.roomName ? data.roomName : ""].push({ socketId: socket.id, userId: data.user });
        }
        else {
            roomDataArray[data.roomName ? data.roomName : ""] = [{ socketId: socket.id, userId: data.user }];
        };


        console.log("🚀 userDataArray:", userDataArray)
        if (data.room === true && data.roomName) {
            console.log("CONDITION :- For Joining Room");
            socket.join(data.roomName);
            socketIds = (roomDataArray[data.roomName]).map((value: any) => {
                if (value.socketId !== socket.id) {
                    return value.socketId;
                }
            });
            console.log("socketIds to sending welcome message", socketIds);
            io.to(socketIds).emit('clientEvent', `${socket.id} had joined in ${data.roomName} room.`);
        }
        else if (data.room === false && data.roomName) {
            console.log("CONDITION :- For Leaving Room");
            socket.leave(data.roomName);
            io.to(socketIds).emit('clientEvent', `${socket.id} had left the ${data.roomName} room.`);
        }
        else if (data.user && data.message && !data.roomName) {
            let user = userDataArray.filter((obj) => {
                if (Object.keys(obj).includes(String(data.user))) {
                    return obj;
                }
                else {
                    return;
                }
            });
            user = (user.map(user => Object.values(user))).flat();
            if (user) {
                io.to(user).emit('personal', data.message);
            }
            else {
                io.to(socket.id).emit('personal', 'No User Found!')
            }
        } else {
            console.log("CONDITION :- For Room Message");
            socketIds = (roomDataArray[data.roomName ? data.roomName : ""]).map((obj: any) => {
                return obj.socketId
            })
            console.log("socketIds ", socketIds);
            socket.to(socketIds).emit('clientEvent', data.message);
        }
    });

    socket.on('disconnected', () => {
        console.log(`connection disconnected: ${socket.id}`)
    });
});

io.listen(3000, () => {
    console.log("Server is up on 3000");
})