#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NestJsLambdaStack } from '../lib/nestjs-lambda-stack';

const app = new cdk.App();

new NestJsLambdaStack(app, 'NestJsCartApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'NestJS Cart API with Lambda, RDS PostgreSQL, and API Gateway',
});

app.synth();
