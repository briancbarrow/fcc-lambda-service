'use strict'
const AWS = require('aws-sdk');
var MongoClient = require('mongodb').MongoClient;

let atlas_connection_uri;
let cachedDb = null;

exports.handler = (event, context, callback) => {
  console.log('EVENT', event);
  console.log('CONTEXT', context);
  console.log('callback', callback);
    var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
    
    if (atlas_connection_uri != null) {
      processEvent(event, context, callback);
    } 
    else {
      const kms = new AWS.KMS();
        kms.decrypt({ CiphertextBlob: new Buffer.from(uri, 'base64') }, (err, data) => {
            if (err) {
                console.log('Decrypt error:', err);
                return callback(err);
            }
            atlas_connection_uri = data.Plaintext.toString('ascii');
            processEvent(event, context, callback);
        });
    } 
};

function processEvent(event, context, callback) {
  console.log('Calling MongoDB Atlas from AWS Lambda with event: ' + JSON.stringify(event));
  var jsonContents = JSON.parse(JSON.stringify(event));
  
  //date conversion for grades array
  if(jsonContents.grades != null) {
      for(var i = 0, len=jsonContents.grades.length; i < len; i++) {
          //use the following line if you want to preserve the original dates
          //jsonContents.grades[i].date = new Date(jsonContents.grades[i].date);
          
          //the following line assigns the current date so we can more easily differentiate between similar records
          jsonContents.grades[i].date = new Date();
      }
  }
  
  //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
  // context.callbackWaitsForEmptyEventLoop = false;
  
  try {
      if (cachedDb == null) {
          console.log('=> connecting to database', atlas_connection_uri);
          MongoClient.connect(atlas_connection_uri, function (err, client) {
            console.log("DB ERROR", err)
              cachedDb = client.db('fccslc');
              return createDoc(cachedDb, jsonContents, callback);
          });
      }
      else {
          createDoc(cachedDb, jsonContents, callback);
      }
  }
  catch (err) {
      console.error('an error occurred', err);
      throw err;
  }
}

function createDoc (db, json, callback) {
db.collection('restaurants').insertOne( json, function(err, result) {
    if(err!=null) {
        console.error("an error occurred in createDoc", err);
        callback(null, JSON.stringify(err));
    }
    else {
      console.log("Kudos! You just created an entry into the restaurants collection with id: " + result.insertedId);
      callback(null, "SUCCESS");
    }
    //we don't need to close the connection thanks to context.callbackWaitsForEmptyEventLoop = false (above)
    //this will let our function re-use the connection on the next called (if it can re-use the same Lambda container)
    //db.close();
});
}


// lambda-local -l app.js -e event.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"mongodb+srv://lambdauser:ZjhDfgBXshGezthA@cluster0-2vinq.mongodb.net/test?retryWrites=true\&w=majority\,cluster0-2vinq.mongodb.net/test?retryWrites=true\&w=majority\,cluster0-2vinq.mongodb.net/fccslc?ssl=true\&replicaSet=cluster0-2vinq\&authSource=admin\"}

// lambda-local -l app.js -e event.json -E {\"MONGODB_ATLAS_CLUSTER_URI\":\"mongodb://lambdauser:$PASSWORD@lambdademo-shard-00-00-7xh42.mongodb.net:27017\,lambdademo-shard-00-01-7xh42.mongodb.net:27017\,lambdademo-shard-00-02-7xh42.mongodb.net:27017/$DATABASE?ssl=true\&replicaSet=lambdademo-shard-0\&authSource=admin\"}