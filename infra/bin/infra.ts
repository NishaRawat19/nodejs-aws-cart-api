#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import { NestjsStack } from '../lib/nestjs-stack';

const app = new cdk.App();

new NestjsStack(app, 'NestjsStack', {
});