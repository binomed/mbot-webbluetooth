'use strict'

var scores = {},
	index = 0, 
	hideQuestion = true,
	questionUsers = {},
	serverPrez = null;


function callBackGame(msg){
	console.log(msg);
	switch (msg.eventType){
		case 'newResp':
		case 'reSend':{
			let currentScore = scores[`question_${index}`];
			if (msg.eventType === 'reSend'){
				let previousRep = currentScore.users[msg.id];
				resp: switch(previousRep){
					case 'A':
						currentScore.repA--;
						break resp;
					case 'B':
						currentScore.repB--;
						break resp;
					case 'C':
						currentScore.repC--;
						break resp;
					case 'D':
						currentScore.repD--;
						break resp;
				}
			}
			currentScore.users[msg.id] = msg.resp;
			questionUsers[msg.id] = msg;
			switch(msg.resp){
				case 'A':
					currentScore.repA++;
					break;
				case 'B':
					currentScore.repB++;
					break;
				case 'C':
					currentScore.repC++;
					break;
				case 'D':
					currentScore.repD++;
					break;
			}
			break;
		}
		case 'changeQuestion':
			questionUsers = {};
			hideQuestion = false;
			index = msg.index;
			if (!scores[`question_${index}`]){				
				scores[`question_${index}`] = {
					users : {},
					repA : 0,
					repB : 0,
					repC : 0,
					repD : 0,
				};
			}
		break;
		case 'hideQuestion':
			hideQuestion = true;
		break;
		case 'calculateWinners':
			if(questionUsers){
				let sortUsers = [];
				Object.keys(questionUsers).forEach((key)=>{
				    sortUsers.push(questionUsers[key]);  
				});

				console.log(sortUsers);
				let idResults = sortUsers.sort((a, b)=>{
				    if (a.resp != msg.value){
				        return 1;
				    }else if (b.resp != msg.value){
				        return -1;
				    }else{
				        return a.timestamp - b.timestamp;
				    }
				})
				.slice(0, msg.numberWinners)
				.filter((entry)=>{
					return entry.resp === msg.value;
				})
				.map((entry)=>{
					return entry.id;
				});

				/*sortUsers.sort((a, b)=>{
				    if (a.resp != msg.value){
				        return 1;
				    }else if (b.resp != msg.value){
				        return -1;
				    }else{
				        return a.timestamp - b.timestamp;
				    }
				});
				let sliceUsers = sortUsers.slice(0, msg.numberWinners);
				if (sliceUsers.length <2){
					console.log('ça va pas ! ');
				}else{
					console.log(sliceUsers[0]);
					console.log(sliceUsers[1]);
					console.log(sliceUsers.map((entry)=>{
						return entry.id;
					}));
				}*/

				serverPrez.broadcast('config', {
					type: 'game',
					eventType: 'winners',
					value: idResults
				});

			}
		break;
	}
	
}


function initGameServer(server){
	serverPrez = server;
	server.registerEvent('gameServer','game', callBackGame);

	server.specifyRoute('/score/:index', function(req, res){

		let questionIndex = req.params.index;
		let currentScore = scores[`question_${questionIndex}`];
		if (currentScore){
			res.json(currentScore);
		}else{
			res.send({type:'error unkown index'});
		}
	});

	server.specifyRoute('/currentState', function(req, res){

		res.json({
			'index' : index,
			'hideQuestion' : hideQuestion,
			score : index ? scores[`question_${index}`] : {}
		});
		
	});
}

module.exports = {
	initGameServer : initGameServer
};