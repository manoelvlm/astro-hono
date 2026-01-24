import { ProductRepository } from './products.repository';
import { NewProduct } from '@repo/db';

export class ProductService {
  constructor(private repository: ProductRepository) {}

  async getAllProducts() {
    return await this.repository.findAll();
  }

  async getProductById(id: number) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new Error('Produto não encontrado');
    }
    return product;
  }

  async createNewProduct(data: NewProduct) {
    // Verificação de duplicidade por nome
    const existingProduct = await this.repository.findByName(data.name);
    if (existingProduct) {
      throw new Error('Já existe um produto com este nome');
    }

    // Regra de negócio: Garantir que o estoque não seja negativo na criação
    if (data.stock !== undefined && data.stock < 0) {
      throw new Error('O estoque inicial não pode ser negativo');
    }

    return await this.repository.create(data);
  }
}
