# Polly Serverless

This project is an example of Posting text to an API to transform it into Speach MP3 available on an S3 bucket

## Install the node dependencies

    npm install -g serverless

    npm install


## Configure with your parameters

open the serverless.yml

set the following values

    custom: 
        accountId: 70818383 #Your unique AWS ID (needed for the SNS ARN)
        s3BucketName: unique-name #Give some string to make s3 bucket unique

## Setup your AWS CLI in your bash

    export AWS_PROFILE=your_iam_user

## Deploy

    sls deploy