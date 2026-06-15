import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity, CartItemEntity, CartStatus } from '../entities';
import { Cart, CartStatuses } from '../models';
import { PutCartPayload } from 'src/order/type';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
  ) {}

  async findByUserId(userId: string): Promise<Cart> {
    const cartEntity = await this.cartRepository.findOne({
      where: { userId, status: CartStatus.OPEN },
      relations: { items: true },
    });

    return cartEntity ? this.mapEntityToModel(cartEntity) : null;
  }

  async createByUserId(userId: string): Promise<Cart> {
    const cartEntity = this.cartRepository.create({
      userId,
      status: CartStatus.OPEN,
      items: [],
    });

    const savedCart = await this.cartRepository.save(cartEntity);
    return this.mapEntityToModel(savedCart);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    let cartEntity = await this.cartRepository.findOne({
      where: { userId, status: CartStatus.OPEN },
      relations: { items: true },
    });

    if (!cartEntity) {
      cartEntity = await this.cartRepository.save(
        this.cartRepository.create({
          userId,
          status: CartStatus.OPEN,
          items: [],
        }),
      );
    }

    const existingItem = cartEntity.items.find(
      (item) => item.productId === payload.product.id,
    );

    if (existingItem) {
      if (payload.count === 0) {
        await this.cartItemRepository.remove(existingItem);
        cartEntity.items = cartEntity.items.filter((item) => item.id !== existingItem.id);
      } else {
        existingItem.count = payload.count;
        await this.cartItemRepository.save(existingItem);
      }
    } else if (payload.count > 0) {
      const newItem = this.cartItemRepository.create({
        cartId: cartEntity.id,
        productId: payload.product.id,
        count: payload.count,
      });
      const savedItem = await this.cartItemRepository.save(newItem);
      cartEntity.items.push(savedItem);
    }

    const updatedCart = await this.cartRepository.save(cartEntity);
    return this.mapEntityToModel(updatedCart);
  }

  async removeByUserId(userId: string): Promise<void> {
    await this.cartRepository.delete({ userId, status: CartStatus.OPEN });
  }

  private mapEntityToModel(cartEntity: CartEntity): Cart {
    return {
      id: cartEntity.id,
      user_id: cartEntity.userId,
      created_at: cartEntity.createdAt.getTime(),
      updated_at: cartEntity.updatedAt.getTime(),
      status: cartEntity.status as unknown as CartStatuses,
      items: cartEntity.items.map((item) => ({
        product: {
          id: item.productId,
          title: '',
          description: '',
          price: 0,
        },
        count: item.count,
      })),
    };
  }
}
