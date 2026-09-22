import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Cart() {
    const { cart, removeFromCart, clearCart, cartTotal } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    // Helper function to dynamically load the Razorpay SDK script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleCheckout = async () => {
        setIsProcessing(true);
        const token = localStorage.getItem('token');

        try {
            // 1. Load Razorpay script
            const resScript = await loadRazorpayScript();
            if (!resScript) {
                alert('Razorpay SDK failed to load. Are you online?');
                setIsProcessing(false);
                return;
            }

            // 2. Ask our backend to create a Razorpay Order
            const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ amount: cartTotal })
            });
            
            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.error);

            // 3. Open Razorpay Checkout Modal
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key', // Get from client/.env
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Foodie Central',
                description: 'Delicious Food Order',
                order_id: orderData.id, // This is the Razorpay Order ID from backend
                
                // 4. Handle Payment Success
                handler: async function (response) {
                    try {
                        // Verify Signature on Backend
                        const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        
                        if (verifyData.success) {
                            // 5. If verification succeeds, officially place the order in our Database
                            const placeOrderRes = await fetch('http://localhost:5000/api/orders', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}` 
                                },
                                body: JSON.stringify({
                                    items: cart,
                                    total_amount: cartTotal
                                })
                            });

                            if (placeOrderRes.ok) {
                                alert('Payment verified! Your food is being prepared 🍔');
                                clearCart();
                                navigate('/'); // Redirect to Home or an Order Status page
                            } else {
                                alert('Payment verified, but failed to save order to our database.');
                            }
                        } else {
                            alert('Payment verification failed. Potential fraud detected.');
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        alert('Error verifying payment.');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: '#ea580c' // Tailwind orange-600
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
            
        } catch (err) {
            console.error('Checkout error:', err);
            alert(err.message || 'Error during checkout');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your Cart</h1>
            
            {cart.length === 0 ? (
                <div className="text-center bg-white p-10 rounded-xl shadow-md border border-gray-100">
                    <p className="text-gray-500 mb-4">Your cart is completely empty.</p>
                    <Link to="/" className="text-orange-600 font-bold hover:underline">← Go back to Menu</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Cart Items List */}
                    <div className="md:col-span-2 space-y-4">
                        {cart.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <div>
                                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-green-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    <button 
                                        onClick={() => removeFromCart(item.menu_item_id)}
                                        className="text-red-500 hover:text-red-700 font-bold text-xl px-2"
                                        title="Remove item"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={clearCart}
                            className="text-gray-500 text-sm font-semibold hover:text-gray-800 hover:underline pt-2"
                        >
                            Clear Entire Cart
                        </button>
                    </div>

                    {/* Checkout Summary */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-fit">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">Order Summary</h2>
                        <div className="flex justify-between mb-2 text-gray-600">
                            <span>Subtotal</span>
                            <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-4 text-gray-600">
                            <span>Taxes & Fees</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl mb-6 text-gray-800 border-t pt-2">
                            <span>Total</span>
                            <span className="text-green-600">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        
                        <button 
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className="w-full bg-orange-600 text-white font-bold p-3 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 shadow-md"
                        >
                            {isProcessing ? 'Processing...' : 'Pay securely with Razorpay'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
