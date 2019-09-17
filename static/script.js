window.onload = function () {
    socket = io.connect('http://' + document.domain + ':' + '100/socket');
    y = window.screen.height * window.devicePixelRatio>=window.screen.width * window.devicePixelRatio?window.screen.width*0.65 * window.devicePixelRatio:window.screen.height*0.65 * window.devicePixelRatio;
    gamey = Math.floor(y);
    border = Math.round(gamey/20);
    between = Math.floor((gamey-2*border)/14);
    colors=['black','white'];
    round=0;
    mathboard=[];
    stepbystep=[];
    board = document.getElementById('board');
    canvas = document.createElement('canvas');
    canvas.setAttribute('onclick','');
    board.appendChild(canvas);
    canvas.width = gamey;
    canvas.height = gamey;
    canvas.style.backgroundColor = '#D5B092';
    ext = canvas.getContext("2d");
    //initial board and variables
    socket.emit('connect','data');

    function regret(){
        socket.emit("regret",(stepbystep[stepbystep.length-1]))
        console.log(stepbystep[stepbystep.length-1])
    }

    function converter(x) {
        return (x)*between+border;
    }

    function drawc(x,y,color){
        ext.beginPath();
        ext.arc(converter(x), converter(y),Math.floor(between/5),0,2*Math.PI);
        ext.fillStyle=color;
        ext.fill();
        ext.closePath();
    }

    function reset(){
        socket.emit('reset','');
    }

    var resetdiv=document.getElementById('reset');
    var resetbutton = document.createElement('input');
    resetbutton.type = 'button';
    resetbutton.onclick = reset;
    resetbutton.value='reset game';
    resetdiv.appendChild(resetbutton);

    var regretdiv=document.getElementById('regret');
    var regretbutton = document.createElement('input');
    regretbutton.type = 'button';
    regretbutton.onclick = regret;
    regretbutton.value='regret(cancel last step)';
    regretdiv.appendChild(regretbutton);
    rect = canvas.getBoundingClientRect();
    //initial completed

    //socket listener
    socket.on('step', function(info) {
        walk(info.x,info.y);
    });

    function walk(x,y) {
        drawq(x,y,colors[round]);
        mathboard[x][y]=round;
        round = (round + 1)%2;
        drawc(x,y,'red');
        stepbystep=stepbystep.concat([[x,y]]);
        try{
            drawc(stepbystep[stepbystep.length-2][0],stepbystep[stepbystep.length-2][1],colors[round]);
            drawc(stepbystep[stepbystep.length-2][0],stepbystep[stepbystep.length-2][1],colors[round]);
            drawc(stepbystep[stepbystep.length-2][0],stepbystep[stepbystep.length-2][1],colors[round]);
            drawc(stepbystep[stepbystep.length-2][0],stepbystep[stepbystep.length-2][1],colors[round]);
            drawc(stepbystep[stepbystep.length-2][0],stepbystep[stepbystep.length-2][1],colors[round]);
            drawc(stepbystep[stepbystep.length-2][0],stepbystep[stepbystep.length-2][1],colors[round]);
        }
        catch (e) {
            console.log(e.message);
        }
    }

    socket.on('regret',function(step){
        console.log(step, stepbystep[stepbystep.length - 1])
        if (step[0]===(stepbystep[stepbystep.length - 1])[0]&&step[1]===(stepbystep[stepbystep.length - 1])[1]) {
        console.log("can regret")
        stepbystep.pop()
        draw_over(step[0],step[1])
        round = (round + 1)%2;
        mathboard[step[0]][step[1]]=-1
}
    })

    socket.on('init',function (steps) {
        ext.clearRect(0,0,gamey,gamey);
        console.log('reseeeet!!!');
        round=0
        for(i=0;i<15;i++){
            ext.moveTo(border+(i*between),border);
            ext.lineTo(border+(i*between),border+(14*between));
            ext.stroke();
            ext.moveTo(border,border+(i*between));
            ext.lineTo(border+(14*between),border+(i*between));
            ext.stroke();
        }
        drawc(7,7,'black');
        drawc(3,3,'black');
        drawc(11,3,'black');
        drawc(3,11,'black');
        drawc(11,11,'black');
        stepbystep=steps[0];
        mathboard=steps[1];
        for(var index in stepbystep){
            walk(stepbystep[index][0],stepbystep[index][1]);
        }
    });

    socket.on('win',function(color){
        alert(color+"wins");
        reset();
    })
    //socket listener end

    //graphics
    function drawq(x,y,color){
        ext.beginPath();
        ext.arc(converter(x), converter(y),Math.floor(between/2.2),0,2*Math.PI);
        ext.strokeStyle="black";
        ext.fillStyle=color;
        ext.fill();
        ext.stroke();
        ext.closePath();
    }

    function draw_over(x,y){
        var x=converter(x);
        var y=converter(y);
        var half_bet=between/2;
        ext.clearRect(x-half_bet,y-half_bet,between,between);
        ext.beginPath();
        ext.strokeStyle='#000000';
        for (var i = 0; i < 3; i++) {
            //this loop seems unreasonable but if you try to delete it
            //you will see what will happen
            ext.moveTo(x-half_bet,y);
            ext.lineTo(x+half_bet,y);
            ext.stroke();
            ext.moveTo(x,y-half_bet);
            ext.lineTo(x,y+half_bet);
            ext.stroke();
        }
        drawc(7,7,'black');
        drawc(3,3,'black');
        drawc(11,3,'black');
        drawc(3,11,'black');
        drawc(11,11,'black');
        ext.closePath();
    }
    //graphics end


    //clicking event listener

    function clickPos(event) {
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        return {x:x-border,y:y-border}
    }

    document.addEventListener('click',function (ev) {
        var position=clickPos(ev);
        abx = Math.round(position.x/between);
        aby = Math.round(position.y/between);
        if(abx<15 && aby<15&&mathboard[abx][aby] ==-1){
            console.log(mathboard[abx][aby]);
            var place={x:abx,y:aby};
            socket.emit('go',place)
        }
    });

    document.addEventListener('ontouchstart',function (ev) {
        var position=clickPos(ev);
        abx = Math.round(position.x/between);
        aby = Math.round(position.y/between);
        if(abx<15 && aby<15&&mathboard[abx][aby] ==-1){
            console.log(mathboard[abx][aby]);
            var place={x:abx,y:aby};
            socket.emit('go',place)
        }
        console.log(abx,aby)
    });
    //clicking end

};

