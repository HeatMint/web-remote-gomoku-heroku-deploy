from flask import Flask
from flask import send_file
from flask import redirect
from flask import request

from flask_socketio import SocketIO
from flask_socketio import send, emit

app = Flask(__name__)
socketio = SocketIO(app)
color = 0

users = []
row = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
board = []
step_by_step = []
from copy import deepcopy

for i in range(0, 15):
    board.append(deepcopy(row))
print(len(board))


# socket start
# connection
@socketio.on('connect', namespace='/socket')
def connect():
    sid = request.sid
    users.append(sid)
    emit('sid', sid)
    emit('init', [step_by_step,board])
    print(board)
    print(users)


@socketio.on('disconnect', namespace='/socket')
def disconnect():
    users.remove(request.sid)
    print(users)


# connection end

# processor start
def iswin(x,y):
    global board
    print(board)
    count=max(search(x,y,[1,0])+search(x,y,[-1,0]),search(x,y,[0,1])+search(x,y,[0,-1]),search(x,y,[1,1])+search(x,y,[-1,-1]),search(x,y,[1,-1])+search(x,y,[-1,1]))
    print(count)
    if count>=6:
        print("win")
        return True


def search(x,y, position):
    global board
    global color
    count = 1
    for i in range(1, 5):
        try:
            status = board[x + i*position[0]][y+i*position[1]]
        except IndexError:
            status = -1
        if status == color:
            count += 1
        else:
            print(str(count)+str(position))
            return count
    print(str(count) + str(position))
    return count

@socketio.on('go', namespace='/socket')
def go(place):
    global color
    global step_by_step
    print(place)
    x = place['x']
    y = place['y']
    global board
    if [x, y] in step_by_step:
        return
    board[x][y] = color
    step_by_step.append([x,y])
    for i in users:
        emit('step', place, room=i)

    if iswin(x,y):
        if color==0:
            co="black"
        else:
            co="white"
        for i in users:
            emit('win', co, room=i)


    print(step_by_step)
    color = (color + 1) % 2



@socketio.on('reset', namespace='/socket')
def reset(password):
    row = [-1, -1, -1, -1, -1,-1, -1, -1, -1, -1,-1, -1, -1, -1, -1]
    global board, step_by_step, color
    color=0
    step_by_step=[]
    board = []
    for i in xrange(0, 15):
        board.append(deepcopy(row))
    for i in users:
        emit('init', [step_by_step,board],room=i)
        emit('init', [step_by_step,board],room=i)#do not delete this line or you will see weird thing, trust me
    print(board)
    print('reset')


@socketio.on('regret', namespace='/socket')
def regret(place):
    x=place[0]
    y=place[1]
    if place == step_by_step[-1]:
        print("regret on "+str(step_by_step[-1]))
        for i in users:
            emit('regret',step_by_step[-1],room=i)
        step_by_step.pop()
        board[x][y]=-1
        print(board)

# processor end


# static files start
@app.route('/')
def index():
    return send_file("static/index.html")


@app.route('/<path:path>')
def statics(path):
    try:
        return send_file("static/" + path)
    except IOError:
        try:
            return send_file("static/" + path + ".html")
        except IOError:
            pass


socketio.run(app, port=100, host='0.0.0.0')
