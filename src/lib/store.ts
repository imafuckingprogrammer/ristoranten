import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CartItem, OrderWithItems, Restaurant, User } from './types';

interface AppState {
  // User & Auth
  user: User | null;
  restaurant: Restaurant | null;
  isAuthenticated: boolean;
  
  // Cart (for customer interface)
  cart: CartItem[];
  tableToken: string | null;
  
  // Orders (for staff interfaces)
  orders: OrderWithItems[];
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Debug mode
  debugMode: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setRestaurant: (restaurant: Restaurant | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  
  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartItem: (menuItemId: string, quantity: number, specialInstructions?: string) => void;
  clearCart: () => void;
  setTableToken: (token: string | null) => void;
  
  // Order actions
  setOrders: (orders: OrderWithItems[]) => void;
  addOrder: (order: OrderWithItems) => void;
  updateOrder: (orderId: string, updates: Partial<OrderWithItems>) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Debug actions
  setDebugMode: (debugMode: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        restaurant: null,
        isAuthenticated: false,
        cart: [],
        tableToken: null,
        orders: [],
        loading: false,
        error: null,
        debugMode: false,
        
        // User & Auth actions
        setUser: (user) => set({ user }),
        setRestaurant: (restaurant) => set({ restaurant }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        
        // Cart actions
        addToCart: (item) => {
          const { cart } = get();
          const existingItem = cart.find(cartItem => cartItem.menu_item.id === item.menu_item.id);
          
          if (existingItem) {
            set({
              cart: cart.map(cartItem =>
                cartItem.menu_item.id === item.menu_item.id
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem
              )
            });
          } else {
            set({ cart: [...cart, item] });
          }
        },
        
        removeFromCart: (menuItemId) => {
          set({
            cart: get().cart.filter(item => item.menu_item.id !== menuItemId)
          });
        },
        
        updateCartItem: (menuItemId, quantity, specialInstructions) => {
          set({
            cart: get().cart.map(item =>
              item.menu_item.id === menuItemId
                ? { ...item, quantity, special_instructions: specialInstructions }
                : item
            )
          });
        },
        
        clearCart: () => set({ cart: [] }),
        setTableToken: (token) => set({ tableToken: token }),
        
        // Order actions
        setOrders: (orders) => set({ orders }),
        addOrder: (order) => set({ orders: [...get().orders, order] }),
        updateOrder: (orderId, updates) => {
          set({
            orders: get().orders.map(order =>
              order.id === orderId ? { ...order, ...updates } : order
            )
          });
        },
        
        // UI actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        // Debug actions
        setDebugMode: (debugMode) => set({ debugMode }),
      }),
      {
        name: 'restaurant-saas-store',
        partialize: (state) => ({
          user: state.user,
          restaurant: state.restaurant,
          isAuthenticated: state.isAuthenticated,
          cart: state.cart,
          tableToken: state.tableToken,
        }),
      }
    )
  )
);