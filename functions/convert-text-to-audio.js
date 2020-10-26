'use strict';
const AWS = require('aws-sdk');
const moment = require('moment');
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
const pollyAws = new AWS.Polly(
    {
        signatureVersion: 'v4',
        region: 'eu-west-1'
    }
);
const DynamoDB = new AWS.DynamoDB.DocumentClient({
    api_version: '2012-08-10',
    region: 'eu-west-1'
});
const s3Bucket = process.env.s3MP3folder;
const tableName = process.env.tableName;

module.exports.handler = async (event, context) => {
    let message = JSON.parse(event.Records[0].Sns.Message);
    let text = message.text;
    let item_id = message.item_id;
    let date = (Math.floor(moment().format('x') / 1000));

    console.log("In convert function");
    let params = {
        OutputFormat: "mp3",
        OutputS3BucketName: s3Bucket,
        OutputS3KeyPrefix: "polly",
        Text: text,
        VoiceId: "Joanna"
    };





    try {
        return pollyAws.startSpeechSynthesisTask(params).promise().then(audio => {
            if (audio) {
                let dbParams = {
                    TableName: tableName,
                    Key:{
                        "item_id": item_id
                    },
                    UpdateExpression: 'set audio_file = :u, processing_status = :s, update_date= :d',
                    ExpressionAttributeValues: {
                        ':u' : JSON.stringify(audio.SynthesisTask.OutputUri),
                        ':s' : 'DONE',
                        ':d' : date
                    }
                };
                return DynamoDB.update(dbParams).promise();
            } else {
                console.log('error');
            }
            return audio;
        });
    }catch(err){

        return "error "+err.stack;
    }

};
