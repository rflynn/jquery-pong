// ex: set ts=4 et:
// Based on the one by a guy named Ben White @ benwhite@columbus.rr.com
// jQuery'd by Ben Ogle. 
// add autoStart, secondComp, ballCount support: Ryan Flynn github.com/rflynn 2012

// TODO: refactor scattered ball data into a proper object
// TODO: unify separate left/right side handling

(function($){    
    $.fn.pong = function(ballImage, options) {
        
        var defaults = {
            autoStart: false, // should we wait for focus or just start?
            secondComp: false,// should the right player be a computer too
            ballCount: 1,
            profile: false,
            maxGames: 0,
            targetSpeed: 30,  //ms
            ballAngle: 45,  //degrees
            ballSpeed: 8,     //pixels per update
            compSpeed: 5,     //speed of your opponent!!
            playerSpeed: 5,   //pixels per update
            difficulty: 5,
            width: 400,       //px
            height: 300,      //px
            paddleWidth: 10,  //px
            paddleHeight: 40, //px
            paddleBuffer: 1,  //px from the edge of the play area
            ballWidth: 14,    //px
            ballHeight: 14,   //px
            playTo: 10,        //points
            interGamePause: 1000 // msecs
        }
        
        var opts = $.extend(defaults, options);

        defaults.ballAngle = [defaults.ballAngle];

        for (var i = 0; i < defaults.ballCount; i++)
            defaults.ballAngle.push(defaults.ballAngle[0] + (-5 + (Math.random() * 10)))
        
        function PositionBalls(leftBallCnt, rightBallCnt, gameData, balls, scoringBallIndexs)
        {

            if (leftBallCnt == 0 && rightBallCnt == 0)
            {
                gameData.x = []
                // start of game, populate all balls
                for (var i = 0; i < balls.length; i++)
                {
                    scoringBallIndexs.push(i);
                    gameData.x.push(Math.random() * opts.width)
                }
            }

            for (var j = 0; j < scoringBallIndexs.length; j++)
            {
                var i = scoringBallIndexs[j];
                var ball = balls[i];
                var rightScored = gameData.x[i] < opts.width / 2; // if the rightside is scored on, ball will be on the left side

                if (rightScored) {
                    gameData.x[i] = opts.width - opts.paddleWidth - opts.paddleBuffer - opts.ballWidth - (Math.random() * Math.min(100, opts.width/4));
                } else {
                    gameData.x[i] = opts.paddleWidth + opts.paddleBuffer + (Math.random() * Math.min(100, opts.width/4));
                }
                gameData.y[i] = Math.round(Math.random() * (opts.height - ball.height()));
            
                ball.css('left', gameData.x[i]);
                ball.css('top', gameData.y[i]);

                if (rightScored != (0>Math.cos(opts.ballAngle[i]*Math.PI/180)>0)) {
                    opts.ballAngle[i] += 180
                }

                ball.css('visibility', 'visible');
            }
        }

        function UpdateScore(leftScoreDiff, rightScoreDiff, gameData, balls, scoringBallIndexs)
        {

            if (leftScoreDiff == 0 && rightScoreDiff == 0)
            {
                gameData.compScore = 0;
                gameData.playerScore = 0;
            } else {
                gameData.compScore += leftScoreDiff;
                gameData.playerScore += rightScoreDiff;

                gameData.compScoreTotal +=  leftScoreDiff;
                gameData.playerScoreTotal += rightScoreDiff;
            }

            scoreTxt = '' + gameData.compScore + ' | ' + gameData.playerScore;

            if (gameData.playerScore >= opts.playTo || gameData.compScore >= opts.playTo) {
                gameData.gameOver = true;
                /* in parallel implementation it's possible to score > playTo... */
                gameData.playerScore = Math.min(opts.playTo, gameData.playerScore);
                gameData.compScore = Math.min(opts.playTo, gameData.compScore);
                /* hide all balls, we're done */
                for (var i = 0; i < balls.length; i++)
                    balls[i].css('visibility', 'hidden');

                gameData.playerWins += (gameData.playerScore == opts.playTo);
                gameData.compWins += (gameData.compScore == opts.playTo);

                if (opts.secondComp)
                {
                    scoreTxt = 
                        (gameData.playerScore < opts.playTo ? 'Winner' : gameData.compScore) +
                        ' | ' +
                        (gameData.playerScore >= opts.playTo ? 'Winner' : gameData.playerScore);
                } else {
                    if(gameData.playerScore == opts.playTo)
                        gameData.score.append('; you win!');
                    else
                        gameData.score.append('; you lose :(');
                }

            } else {
                PositionBalls(leftScoreDiff, rightScoreDiff, gameData, balls, scoringBallIndexs);
            }

            if (opts.profile)
            {
                var profTxt = '';
                var now = new Date();
                var gamecnt = gameData.playerWins + gameData.compWins;
                var pointcnt = gameData.compScoreTotal + gameData.playerScoreTotal;
                var ppg = Math.round(pointcnt / Math.max(1, gamecnt) * 100) / 100;
                var gametime = Math.round(gameData.elapsed / Math.max(1, gamecnt) * 100) / 100;
                profTxt += "<br>\n" + gamecnt + " games / " + gameData.elapsed + " secs"
                profTxt += "<br>\n sec/game:" + gametime + " ppg:" + ppg;
                gameData.profile.html(profTxt);
            }

            gameData.score.html(scoreTxt);

        }

        ///Is run by the setTimeout function. Updates the gameData object. 
        function Update(gameData, balls) {
            
            if (gameData.gameOver) {
                if (opts.autoStart)
                {
                    if (opts.maxGames == 0 || gameData.playerWins + gameData.compWins < opts.maxGames)
                        setTimeout(function(){Start(gameData, balls);}, opts.interGamePause);
                }
                else
                    gameData.msg.html('click to start!');
                return;
            }
        
            if (!opts.autoStart)
                msg.html('press ESC to stop');
            
            // Dynamically Adjust Game Speed
        
            var tmpDelay = new Date();
            var Diff = tmpDelay.valueOf() - gameData.delay.valueOf() - opts.target;
            gameData.speed += (Diff > 5)?-1:0;
            gameData.speed += (Diff < -5)?1:0;
            gameData.speed = Math.abs(gameData.speed);
            gameData.delay = tmpDelay;
        
            setTimeout(function(){Update(gameData, balls)}, gameData.speed);

            var VB = [];
            var HB = [];

            var leftScoreDiff = 0;
            var rightScoreDiff = 0;
            var scoringBallIndexs = [];
        
            // MoveBall
            var leftballi = 0;
            var rightballi = 0;
            for (var i = 0; i < balls.length; i++)
            {
                var ball = balls[i];

                if (gameData.x[i] < gameData.x[leftballi])
                    leftballi = i;
                else if (gameData.x[i] > gameData.x[rightballi])
                    rightballi = i;

                var d = opts.ballAngle[i] * Math.PI / 180;
                gameData.y[i] += Math.round(opts.ballSpeed*Math.sin(d));
                gameData.x[i] += Math.round(opts.ballSpeed*Math.cos(d));
                VB.push(180-opts.ballAngle[i]);
                HB.push(0-opts.ballAngle[i]);
            }


            // Move Computer
            
            var d = opts.ballAngle[leftballi] * Math.PI / 180;

            var LeftTop = parseInt(gameData.leftPaddle.css('top'));
            var LeftCenter = (opts.paddleHeight/2) + LeftTop
        
            if (Math.cos(d) > 0 || (gameData.x[leftballi] > opts.width/(2-(gameData.compAdj/(opts.difficulty*10))))) {
                var Center = (opts.height/2);
            } else {
                var BallTop = gameData.y[leftballi];
                var Center = (opts.ballHeight/2) +BallTop;
            }
            var MoveDiff = Math.abs(Center - LeftCenter);
            if (MoveDiff > opts.compSpeed)
                MoveDiff = opts.compSpeed;

            if (Center > LeftCenter) 
                LeftTop += MoveDiff;
            else 
                LeftTop -= MoveDiff;

            if (LeftTop < 1)
                LeftTop = 1;
                
            if ((LeftTop+opts.paddleHeight+1) > opts.height) {
                LeftTop = opts.height - opts.paddleHeight - 1;
            }

            gameData.leftPaddle.css('top', LeftTop+'px');

            // Move Player
            var d = opts.ballAngle[rightballi] * Math.PI / 180;
            if (opts.secondComp)
            {
                var RightTop = parseInt(gameData.rightPaddle.css('top'));
                var RightCenter = (opts.paddleHeight/2) + RightTop
            
                if (Math.cos(d) < 0 || (gameData.x[rightballi] < opts.width/(2-(gameData.compAdj/(opts.difficulty*10))))) {
                    /* if the rightmost ball is travelling away from me or not in my half, then go back to center */
                    var Center = (opts.height/2);
                } else {
                    /* ...otherwise, center on the incoming ball */
                    var BallTop = gameData.y[rightballi];
                    var Center = (opts.ballHeight/2) +BallTop;
                }
                var MoveDiff = Math.abs(Center - RightCenter);
                if (MoveDiff > opts.compSpeed)
                    MoveDiff = opts.compSpeed;

                if (Center > RightCenter) 
                    RightTop += MoveDiff;
                else 
                    RightTop -= MoveDiff;

                if (RightTop < 1)
                    RightTop = 1;

                if ((RightTop+opts.paddleHeight+1) > opts.height) {
                    RightTop = opts.height - opts.paddleHeight - 1;
                }

                gameData.rightPaddle.css('top', RightTop+'px');

            } else {
        
                var RightTop = parseInt(gameData.rightPaddle.css('top'));
                if (gameData.up) 
                    RightTop -= opts.playerSpeed;
                if (gameData.down) 
                    RightTop += opts.playerSpeed;
        
                if (RightTop < 1)
                    RightTop = 1;
                if ((RightTop+opts.paddleHeight+1) > opts.height) 
                    RightTop=opts.height-opts.paddleHeight-1;
    
                gameData.rightPaddle.css('top', RightTop+'px');
            }
        
            // Check Top/Bottom/Left/Right

            for (var i = 0; i < balls.length; i++)
            {
        
            if (gameData.y[i] < 1) {
                gameData.y[i] = 1;
                opts.ballAngle[i] = HB[i];
            }
            
            if (gameData.y[i] > opts.height-opts.ballHeight) {
                gameData.y[i] = opts.height - opts.ballHeight;
                opts.ballAngle[i] = HB[i];
            }
            
            if (gameData.x[i] <= 0) {
                gameData.x[i] = 0;
                //opts.ballAngle[i] = VB[i];
                if (!opts.secondComp)
                    gameData.compAdj -= opts.difficulty;
                rightScoreDiff++;
                scoringBallIndexs.push(i);
            }
            
            if (gameData.x[i] >= opts.width - Math.max(opts.ballWidth, opts.ballWidth - opts.paddleWidth)) {
                //gameData.x[i] = opts.width;
                leftScoreDiff++;
                scoringBallIndexs.push(i);
            }
        
            // Check Left Paddle
        
            var MaxLeft = opts.paddleWidth + opts.paddleBuffer;
            if (gameData.x[i] < MaxLeft) {
                if (gameData.y[i] < (opts.paddleHeight + LeftTop) && (gameData.y[i]+opts.ballHeight) > LeftTop) {
                    gameData.x[i] = MaxLeft;
                    opts.ballAngle[i] = VB[i];
                    if (!opts.secondComp)
                        gameData.compAdj++;
                }
            }
        
            // Check Right Paddle
        
            var MaxRight = opts.width - opts.ballWidth - opts.paddleWidth - opts.paddleBuffer;
            if (gameData.x[i] > MaxRight) {
                if (gameData.y[i] < (opts.paddleHeight + RightTop) && (gameData.y[i]+opts.ballHeight) > RightTop) {
                    gameData.x[i] = MaxRight;
                    opts.ballAngle[i] = VB[i];
                }
            }
        
            balls[i].css('top', gameData.y[i]);
            balls[i].css('left', gameData.x[i]);
        
            if (gameData.compAdj < 0){
                gameData.compAdj = 0;
            }

            } // ball loop

            if (leftScoreDiff > 0 || rightScoreDiff > 0)
                UpdateScore(leftScoreDiff, rightScoreDiff, gameData, balls, scoringBallIndexs);

        }

        function Start(gameData, balls) {
            
            if (gameData.gameOver) {
                gameData.gameOver = false;
                gameData.playerScore = -1;
                gameData.compScore = -1;
                setTimeout(function(){Update(gameData, balls)}, gameData.speed);
                UpdateScore(0, 0, gameData, balls, []);
            }
        }

        return this.each(function() {
            
            var gameData = {
                up: false,      // Down key pressed?
                down: false,    // Down key pressed?
                x: [],          // Ball X Pos
                y: [],          // Ball Y Pos
                compAdj: 0,     // Computer Adjust
                compScore: 0,   // Computer Score
                playerScore: 0, // Player Score
                speed: 30,      // Actual Game Speed (Dynamic)
                gameOver: true,
                delay: new Date(),
                start: new Date(),
                elapsed: 0,     // number of seconds elapsed since start
                playerScoreTotal: 0,
                compScoreTotal: 0,
                playerWins: 0,
                compWins: 0
            }
            
            var $this = $(this);
            
            function keyDownEvent(event){
                switch (event.keyCode) {
                    case 38: //Up Arrow
                        gameData.up = true;
                        break;
                    case 40: //Down Arrow
                        gameData.down = true;
                        break;
                    case 27: //Escape
                        $this.children(".ball").css('visibility', 'hidden');
                        gameData.gameOver = true;
                        break;
                }
                return false;
            }
            
            function keyUpEvent(event){
                switch (event.keyCode) {
                    case 38: //Up Arrow
                        gameData.up = false;
                        break;
                    case 40: //Down Arrow
                        gameData.down = false;
                        break;
                }
                return false;
            }
            
            $this.css('background', '#000');
            $this.css('position', 'relative');

            //$this.append('<textarea class="field" style="position:absolute;background:#000;border:0;top:-9999; left:-9999; width:0;height0;"></textarea>');
            $this.append('<div class="score" style="position:relative;color:#ffffff; font-family: sans-serif; text-align: center; font-weight: bold;">0 | 0</div>');
            $this.append('<div class="profile" style="position:relative; background-color:#000; color:#ffffff; font-family: sans-serif; text-align: center; font-size:smaller;"></div>');
            $this.append('<div class="leftPaddle" style="position:absolute;background-color:#ffffff;"></div>');
            $this.append('<div class="rightPaddle" style="position:absolute;background-color:#ffffff;"></div>');
            $this.append('<div class="msg" style="position:absolute; font-size: 8pt; color:#fff; bottom: 2px; right: 2px;"></div>');

            var leftPaddle = $this.children('.leftPaddle');
            var rightPaddle = $this.children('.rightPaddle');
            var score = $this.children('.score');
            var profile = $this.children('.profile');
            var msg = $this.children('.msg');
            var field = $this.children('.field');

            field.keydown( keyDownEvent );
            field.keyup( keyUpEvent );

            //field.css('width', 200);
            //field.css('height', 20);

            //initialize all
            $this.css('width', opts.width);
            $this.css('height', opts.height);

            leftPaddle.css('width', opts.paddleWidth);
            leftPaddle.css('height', opts.paddleHeight);
            leftPaddle.css('left', opts.paddleBuffer);
            leftPaddle.css('top', Math.round(1+(Math.random()*(opts.height-opts.paddleHeight-2))) );

            rightPaddle.css('width', opts.paddleWidth);
            rightPaddle.css('height', opts.paddleHeight);
            rightPaddle.css('left', opts.width - opts.paddleWidth - opts.paddleBuffer);
            rightPaddle.css('top', Math.round(1+(Math.random()*(opts.height-opts.paddleHeight-2))) );

            // turn off adaptive difficulty if 2 machines are playing
            if (opts.secondComp)
                opts.difficulty = 10;

            var balls = [];
            for (var i = 0; i < opts.ballCount; i++)
            {
                var ballId = "ball" + i.toString();
                $this.append('<img src="'+ballImage+'" id="'+ballId+'" class="ball" style="position:absolute;visibility:hidden;">');
                var ball = $this.children('#'+ballId);
                ball.css('width', opts.ballWidth);
                ball.css('height', opts.ballHeight);
                gameData.x.push(0);
                gameData.y.push(0);
                balls.push(ball);
            }

            gameData.leftPaddle = leftPaddle;
            gameData.rightPaddle = rightPaddle;
            gameData.score = score;
            gameData.profile = profile;
            gameData.msg = msg;

            gameData.speed = opts.targetSpeed;
            Update(gameData, balls);

            setInterval(function(){ gameData.elapsed++; }, 1000);

            if (opts.autoStart)
                Start(gameData, balls);
            else // wait for click
                $this.click(function(){
                    field.focus();
                    Start(gameData, balls);
                })
        });    
    };
})(jQuery);
