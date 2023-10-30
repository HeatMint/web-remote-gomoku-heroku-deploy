window.onload = function () {
    socket = io('http://' + document.domain + ':' + '100/socket');
    abs_height = window.innerHeight;
    abs_width = window.innerWidth;

    y = abs_height>=abs_width?abs_width:abs_height*0.8;
    y = Math.floor(y)
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
    socket.emit('connected','data');

    function regret(){
        //modified
        socket.emit("regret",(stepbystep[stepbystep.length-1]),1)
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
        };
        console.log(mathboard);
    }

    socket.on('regret',function(step){
        console.log(step, stepbystep[stepbystep.length - 1])
        if (step[0]===(stepbystep[stepbystep.length - 1])[0]&&step[1]===(stepbystep[stepbystep.length - 1])[1]) {
        console.log("can regret")
        mathboard[step[0]][step[1]]=-1
        stepbystep.pop()
        draw_over(step[0],step[1])
        round = (round + 1)%2;
}
    })

    socket.on('init',function (steps) {
        console.log(steps)
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
        boardx=x;
        boardy=y;
        var x=converter(x);
        var y=converter(y);
        var half_bet=between/2;
        ext.clearRect(x-half_bet,y-half_bet,between,between);
        ext.beginPath();
        ext.strokeStyle='#000000';
        edgex=x-half_bet;
        edgey=y-half_bet;
        finx=x+half_bet;
        finy=y+half_bet;
        if(boardx==0){
            edgex=x;
        }
        if(boardy==0){
            edgey=y;
        }
        if(boardx==14){
            finx=x;
        }
        if(boardy==14){
            finy=y;
        }
        for (var i = 0; i < 3; i++) {
            //this loop seems unreasonable but if you try to delete it
            //you will see what will happen
            ext.moveTo(edgex,y);
            ext.lineTo(finx,y);
            ext.stroke();
            ext.moveTo(x,edgey);
            ext.lineTo(x,finy);
            ext.stroke();
        }
        function dotcheck(x,y){
            if (mathboard[x][y]==-1) {
                drawc(x,y,'black');
            }
        }
        dotcheck(7,7);
        dotcheck(3,3);
        dotcheck(11,3);
        dotcheck(3,11);
        dotcheck(11,11);
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

