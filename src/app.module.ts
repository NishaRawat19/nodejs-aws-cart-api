import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { CartEntity, CartItemEntity } from './cart/entities';

// Function to get database password from AWS Secrets Manager
async function getDatabasePassword(secretArn: string): Promise<string> {
  if (!secretArn) {
    return process.env.DB_PASSWORD || 'postgres';
  }

  try {
    const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
    const command = new GetSecretValueCommand({ SecretId: secretArn });
    const data = await client.send(command);

    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString);
      return secret.password;
    }
  } catch (error) {
    console.error('Error fetching secret from Secrets Manager:', error);
  }

  return process.env.DB_PASSWORD || 'postgres';
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secretArn = configService.get<string>('DB_SECRET_ARN');
        const password = await getDatabasePassword(secretArn);

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME'),
          password: password,
          database: configService.get<string>('DB_NAME'),
          entities: [CartEntity, CartItemEntity],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') !== 'production',
          ssl: {
            rejectUnauthorized: false,
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    CartModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
