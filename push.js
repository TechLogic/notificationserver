var fs = require("fs");
var PushBullet = require("./plugins/node-pushbullet/lib/pushbullet.js");	
var conf = null;
 var result = fs.readFileSync("conf.json",{encoding: "utf8"})
 if(result != undefined){
 conf = JSON.parse(result);
 console.log("Loaded config");
 initPush();
 }else{
  if(err)console.log("Could not read config!");
 }
 
 

var pusher = null;
var devices = null;


function initPush(){

 this.pusher = new PushBullet(conf.api_key);
 if(process.argv[2] == "init"){
 console.log("Start init");
  pusher.createDevice("Raspberry Pi",function(err,data){
   if(err) throw err;
   console.log("Init succesful");
   fs.writeFile("conf.json",'{ "iden":"'+ data.iden+'"}',function(err,data){
     if(err)throw err;
      console.log("Configuration was saved !");	
   });
  });
 }

 this.pusher.devices(function(err,data){
  if(err) throw err;	
  devices = data.devices;
  var toDelete = [];
  for( i = 0;i<devices.length;i++){
   if(devices[i].pushable == false){
    toDelete.push(i);
   }
  }
  for(var j =0;j<toDelete.length;j++){
   devices.splice(toDelete[j]-j,1);
  }
  startStream();
});

}




function startStream(){
var stream = this.pusher.stream();
pusher = this.pusher;
stream.on("tickle",function(message){
if(message == "push"){
 pusher.history({limit: 1},function(err,data){
	if(err)throw err;
	if(data.pushes[0].active == true && data.pushes[0].target_device_iden == conf.iden){
	console.log(data.pushes);
	notifyAll("PUSH RECIVED!",data.pushes[0].body);
	}
 });
}
});
stream.on("connect",function(){
console.log("Listening for notifications!");
});
stream.on("close",function(){
console.log("Stop listening for notifications!");
});
stream.on("error",function(error){
throw error;
});


stream.connect();
}

function notifyAll(noteTitle,noteBody){
 for(var i = 0;i<devices.length;i++){
	if(devices[i].iden != conf.iden && devices[i].pushable == true){
	this.pusher.note(devices[i].iden,noteTitle,noteBody,function(err,data){
		if(err)throw err;
	});
	}
}

}
