'use strict';

const AWS = require('aws-sdk');
const https = require('https');
const uuid = require('uuid');

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

const moment = require('moment');
const DynamoDB = new AWS.DynamoDB.DocumentClient({
    api_version: '2012-08-10',
    region: 'eu-west-1'
});
const sns = new AWS.SNS({apiVersion: '2010-03-31'});
const tableName = process.env.tableName;
const snsTopic = process.env.snsTopic;



module.exports.handler = async (event, context) => {

    console.log(event);
    let body = JSON.parse(event.body);
    let text = body.text;
    let uuiItem = uuid.v4();
    let date = (Math.floor(moment().format('x') / 1000));

    console.log(tableName+' '+uuiItem+ ' '+ date+' '+text);

    let dbParams = {
        TableName: tableName,
        Item: {
            item_id: uuiItem,
            creation_date: date,
            text: text,
            processing_status: 'PROCESSING'
        }
    };

    let message = JSON.stringify({
        item_id: uuiItem,
        creation_date: date,
        text: text});

    let snsParams = {
        TopicArn: snsTopic,
        Message: message
    }


    try {
        const start = new Date().getTime();
        let dataDb = await DynamoDB.put(dbParams).promise();
        const end = new Date().getTime();
        console.log(end - start +" ms");
        let dataSns = await sns.publish(snsParams).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({dbParams, dataDb, dataSns})
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
