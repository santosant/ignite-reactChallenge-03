import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
      const storagedCart = localStorage.getItem('@RocketShoes:cart')
   
       if (storagedCart) {
       return JSON.parse(storagedCart);
      }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const { data: {amount: productInStock} } = await api.get<Stock>(`/stock/${productId}`);

      const productInCart:Product|undefined = cart.find(product => product.id === productId);
      if (productInCart) {
        
        if ((productInCart.amount + 1) > productInStock) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        productInCart.amount++;
        setCart([...cart]);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart));

      } else {

        const { data: product } = await api.get<Product>(`/products/${productId}`);

        if (productInStock < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = [...cart, { ...product, amount: 1 }];
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
      }      

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productInCart = cart.some(product => product.id === productId);

      if(!productInCart) {
        toast.error('Erro na remoção do produto')
      return
      }

      const newCart = cart.filter(product => product.id !== productId)
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return
      }

      const { data: { amount: productInStock }} = await api.get<Stock>(`/stock/${String(productId)}`)
      if (amount > productInStock) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const productInCart: Product|undefined = cart.find(product => product.id === productId)
      if(!productInCart) {
        toast.error('Erro na alteração de quantidade do produto')
        return
      }

      productInCart.amount = amount
      setCart([...cart]);
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))  
  } catch {
    toast.error('Erro na alteração de quantidade do produto')
  }
}
  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
