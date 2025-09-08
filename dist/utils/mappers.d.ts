import { IProducto } from "../interfaces/producto";
import { Carrito, Lista, Pedido } from "../interfaces/pedido";
export declare function productodbToProducto(producto: any): IProducto;
export declare function pedidodbToPedido(pedido: any): Pedido;
export declare function carritoSchematoCarrito(carrito: any): Carrito;
export declare function listaDbToLista(lista: any): Lista;
