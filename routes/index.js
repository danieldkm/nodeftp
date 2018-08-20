const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const Client  = require('ssh2').Client;

/**
const connSettings = {
     host: 'host',
     username: 'user',
     password: 'pass'
};
module.exports = connSettings;
*/
const connSettings = require('connectionFTP');

const remotePathToList = '/home/oracle/fotos/londrinense';
const localPathImg = '/../imagesToLoad/';
const conn = new Client();

function renameFile (dir, filelist) {
	// var walkSync = function(dir, filelist) {
		// var fs = fs || require('fs'),
 	files = fs.readdirSync(dir);
  	filelist = filelist || [];

  	var recursiveDir = function(dir, file){
  		if (fs.statSync(dir + file).isDirectory()) {
      		filelist = renameFile(dir + file + '/', filelist);
    	} else {
      		filelist.push(file);
    	}
  	};

  	files.forEach(function(file) {
  		console.log('file:', file);
  		if(file.toUpperCase().indexOf('JPG') !== -1){
  			
  			if(file.length < 10){
  				let i = file.length;
  				let renameFile = '';
  				while (i < 10){
  					renameFile += '0';
  					i ++;
  				}
  				console.log('rename file (minus):', file, ' to: ', renameFile + file.toLowerCase());
  				fs.rename(dir + file, dir + renameFile + file.toLowerCase(), function(err) {
        			if ( err ) console.log('ERROR: ' + err);
        			file = renameFile + file.toLowerCase();
        			recursiveDir(dir, file);
    			});
  			} else {
  				console.log('rename file:', file, ' to: ', file.toLowerCase());
  				fs.rename(dir + file, dir + file.toLowerCase(), function(err) {
        			if ( err ) console.log('ERROR: ' + err);
        			file = file.toLowerCase();
        			recursiveDir(dir, file);
    			});
  			}
  		} else {
  			recursiveDir(dir, file);
  		}

  	});
  	
  	return filelist;
// };
}

function removeFile(){
	//Listando e removendo arquivos que contem JPG.
	        // sftp.readdir(remotePathToList, function(err, list) {
         //        if (err) throw err;
         //        // List the directory in the console
         //        console.log('quantidade:',list.length);
         //        for(var i = 0; i < list.length; i++){
         //        	if(list[i].filename.indexOf('JPG') !== -1){
         //        		console.log('filename::',list[i].filename);
	        //    //      	sftp.unlink(remotePathToList + "/" + list[i].filename, function(err){
				     //    //     if ( err ) {
				     //    //         console.log( "Error, problem starting SFTP: %s", err );
				     //    //     }
				     //    //     else
				     //    //     {
				     //    //         console.log( "file unlinked" );
				     //    //     }

				     //    //     // conn.close();
				     //    // });
	        //         }
         //        }
                
         //        // Do not forget to close the connection, otherwise you'll get troubles
         //        conn.end();
         // 	});
}



function sendFile(dir, file, sftp){
	// conn.on('ready', function() {
	//     conn.sftp(function(err, sftp) {
	        // if (err) console.log('errorr:', err);

	        let readStream = fs.createReadStream( dir + file );
	        let writeStream = sftp.createWriteStream( remotePathToList + "/" + file );

	        writeStream.on('close',function () {
	            console.log( "- file transferred succesfully" );
	        });

	        writeStream.on('end', function () {
	            console.log( "sftp connection closed" );
	            conn.close();
	        });

	        // initiate transfer of file
	        readStream.pipe( writeStream );

	//     });
	// }).connect(connSettings);
}

function mytimeout(tempo, lista, sftp){
	console.log(tempo, lista);
    setTimeout(function () {
    	console.log('------------------------------------------------------');
    	for(var i = 0; i < lista.length; i++){
    		console.log('enviar', lista[i]);
    		sendFile(lista[i].path, lista[i].nome, sftp);
    	}
    }, tempo * 10000);
};

router.get('/sendImg', function(req, res, next) {

	conn.on('ready', function() {
	    conn.sftp(function(err, sftp) {
	        if (err) console.log('errorr:', err);

	        // let readStream = fs.createReadStream( dir + file );
	        // let writeStream = sftp.createWriteStream( remotePathToList + "/" + file );

	        // writeStream.on('close',function () {
	        //     console.log( "- file transferred succesfully" );
	        // });

	        // writeStream.on('end', function () {
	        //     console.log( "sftp connection closed" );
	        //     conn.close();
	        // });

	        // // initiate transfer of file
	        // readStream.pipe( writeStream );

	    

			var getImagens = function(dir, filelist) {
			 	var	files = fs.readdirSync(dir);
			  	filelist = filelist || [];
			  	files.forEach(function(file) {
			    	if (fs.statSync(dir + file).isDirectory()) {
			      		filelist = getImagens(dir + file + '/', filelist);
			    	} else {
				  		let ofile = {
				  			nome: file,
				  			path: dir
				  		};
			      		filelist.push(ofile);
			    	}
			  	});
			  	
			  	return filelist;
			};

			var lista = [];
			getImagens(__dirname + localPathImg, lista);
			console.log('lista', lista);
			console.log('tamanho', lista.length);
			
			let j = 0;
			var tmpFiles = [];

			for(var i = 0; i < lista.length; i++) {
				if (j < 10) {
					tmpFiles.push(lista[i]);
				} else {
					mytimeout(((i+1) / 10), tmpFiles, sftp);
					tmpFiles = [];
					tmpFiles.push(lista[i]);
					j = 0;
				}
				j++;
			}
			if(tmpFiles.length > 0){
				mytimeout(((lista.length + 10) / 10), tmpFiles, sftp);
			}

		});
	}).connect(connSettings);
	res.render('index', { title: 'Express' });
})

router.get('/renameImg', function(req, res, next) {


	var lista = [];
	renameFile(__dirname + localPathImg, lista);
	
  	res.render('index', { title: 'Express' });
});

module.exports = router;
