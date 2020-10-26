'use strict';
const AWS = require('aws-sdk');
const https = require('https');
const sslAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: true
});
sslAgent.setMaxListeners(0)
AWS.config.update({
  httpOptions: {
    agent: sslAgent
  }
});

const DynamoDB = new AWS.DynamoDB.DocumentClient({
  api_version: '2012-08-10',
  region: 'eu-west-1'
});

const tableName = process.env.tableName;

module.exports.handler = async (event, context) => {
  let localEvent = JSON.stringify(event);
  console.log(localEvent);
  let params= {
    TableName: tableName
  }

//If we pass the UUID of the record, we retrieve only one Item , if no paramter passed to DynamoDB, we do a Scan on the Table
  if(event.queryStringParameters != null && event.queryStringParameters.postid != null ){
      let postId = event.queryStringParameters.postid;
      console.log(postId);
     params= {
       TableName: tableName,
       KeyConditionExpression: 'item_id = :paramid',
       ExpressionAttributeValues: {
         ':paramid': postId
       }

    }
    let result = await DynamoDB.query(params).promise();

    return{
        statusCode: 200,
        body: JSON.stringify(result)
    }

  }else{

    let result = await DynamoDB.scan(params).promise();

    return{
      statusCode: 200,
      body: JSON.stringify(result)
    }

  }


};
