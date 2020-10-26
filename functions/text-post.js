'use strict';

//Include all the librairies needed

const AWS = require('aws-sdk');
const https = require('https');
const uuid = require('uuid');  //needed to generate Unique ID

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


const moment = require('moment'); //needed to manage the timestamp
const DynamoDB = new AWS.DynamoDB.DocumentClient({
    api_version: '2012-08-10',
    region: 'eu-west-1'
}); //setup of our DynamoDb
const sns = new AWS.SNS({apiVersion: '2010-03-31'}); // setup of SNS topics
const tableName = process.env.tableName; //Get the Environnement Variable for the DynamoDB Table Name
const snsTopic = process.env.snsTopic; //Get the Environnement Variable for the SNS topic ARN


// Entry point , the Event is an AWS API Gateway Event
module.exports.handler = async (event, context) => {

    console.log(event);
    let body = JSON.parse(event.body); //Convert the Payload into JSON Object
    let text = body.text;
    let uuiItem = uuid.v4(); //Generate an Unique ID
    let date = (Math.floor(moment().format('x') / 1000)); //Generate the current date

    console.log(tableName+' '+uuiItem+ ' '+ date+' '+text);

    //Preparing Message to store into the DynamoDB
    let dbParams = {
        TableName: tableName,
        Item: {
            item_id: uuiItem,
            creation_date: date,
            text: text,
            processing_status: 'PROCESSING'
        }
    };

    //Prepare the Message to be sent into SNS topics at the same time
    let message = JSON.stringify({
        item_id: uuiItem,
        creation_date: date,
        text: text});

    let snsParams = {
        TopicArn: snsTopic,
        Message: message
    }

    //try catch
    try {
        const start = new Date().getTime();
        let dataDb = await DynamoDB.put(dbParams).promise(); //Persist message into DynamoDB
        const end = new Date().getTime();
        console.log(end - start +" ms");
        let dataSns = await sns.publish(snsParams).promise(); //Send the message into the SNS topics

        return {
            statusCode: 200, //send back HTTP status 200
            body: JSON.stringify({dbParams, dataDb, dataSns}) // send a Json response with the response from DB and SNS
        };
    } catch (error) {
        console.log("ko ");
        console.log(error.stack);
        return {
            statusCode: 400,
            body: `Could not post: ${error.stack}`
        };
    }
};
