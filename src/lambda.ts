import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import * as serverless from 'serverless-http';
import helmet from 'helmet';
import { Handler, Context, APIGatewayProxyEvent } from 'aws-lambda';
let server: Handler;

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);

 // const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });

  // Enable Helmet for security
  app.use(helmet());

  await app.init();

  return serverlessExpress({
    app: app.getHttpAdapter().getInstance(),
  });
}


export const handler: Handler = async (event, context, callback) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
