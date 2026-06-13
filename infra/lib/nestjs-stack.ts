import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class NestjsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nestLambda = new lambda.Function(this, 'NestApi', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'dist/src/lambda.handler',
      code: lambda.Code.fromAsset('..', {
        exclude: [
          'infra',
          'src',
          'test',
          '.git',
          '.vscode',
          'coverage',
          'lambda-package',
          'lambda-deployment.zip',
          '__azurite*',
          '__queuestorage__',
          '*.md',
          '.env*',
          'node_modules/@types',
          'node_modules/**/test',
          'node_modules/**/tests',
          'node_modules/**/*.md',
          'node_modules/**/.git',
        ],
      }),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        APP_PORT: '4000',
      },
    });

    new apigateway.LambdaRestApi(this, 'NestApiGateway', {
      handler: nestLambda,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
  }
}