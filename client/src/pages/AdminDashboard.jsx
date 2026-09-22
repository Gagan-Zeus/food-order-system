import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    
    // Menu Form State
    const [menuData, setMenuData] = useState({ name: '', description: '', price: '', is_available: true });
    const [imageFile, setImageFile] = useState(null);
    const [menuMsg, setMenuMsg] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = localStorage.getItem('token');

    // Fetch all orders on component mount
    const fetchOrders = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setOrders(data);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Handle Menu Form Submission
    const handleMenuSubmit = async (e) => {
        e.preventDefault();
        setMenuMsg({ type: '', text: '' });
        setIsSubmitting(true);
        
        // We use FormData instead of JSON because we are sending a File (Image)
        const formData = new FormData();
        formData.append('name', menuData.name);
        formData.append('description', menuData.description);
        formData.append('price', menuData.price);
        formData.append('is_available', menuData.is_available);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const res = await fetch('http://localhost:5000/api/menu', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, 
                // Note: Do not set Content-Type header manually when sending FormData, 
                // the browser will set it automatically with the correct boundary!
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setMenuMsg({ type: 'success', text: 'Menu item added successfully!' });
                setMenuData({ name: '', description: '', price: '', is_available: true });
                setImageFile(null);
                document.getElementById('imageInput').value = '';
            } else {
                setMenuMsg({ type: 'error', text: data.error || 'Failed to add item' });
            }
        } catch (err) {
            setMenuMsg({ type: 'error', text: 'Server error while adding item.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Order Status Update
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Update local state to reflect change instantly
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            } else {
                alert("Failed to update status.");
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        preparing: 'bg-blue-100 text-blue-800',
        out_for_delivery: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Add Menu Item Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-100 h-fit">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Add New Menu Item</h2>
                    
                    {menuMsg.text && (
                        <div className={`p-3 rounded mb-4 text-sm ${menuMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {menuMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleMenuSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium text-sm">Item Name</label>
                            <input 
                                type="text" required
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                value={menuData.name}
                                onChange={(e) => setMenuData({...menuData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium text-sm">Description</label>
                            <textarea 
                                required rows="3"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                value={menuData.description}
                                onChange={(e) => setMenuData({...menuData, description: e.target.value})}
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium text-sm">Price (₹)</label>
                            <input 
                                type="number" step="0.01" required min="0"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                value={menuData.price}
                                onChange={(e) => setMenuData({...menuData, price: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium text-sm">Image File</label>
                            <input 
                                type="file" id="imageInput" accept="image/*"
                                className="w-full p-2 border rounded bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                onChange={(e) => setImageFile(e.target.files[0])}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" id="isAvailable"
                                checked={menuData.is_available}
                                onChange={(e) => setMenuData({...menuData, is_available: e.target.checked})}
                                className="w-4 h-4 text-orange-600 rounded"
                            />
                            <label htmlFor="isAvailable" className="text-gray-700 font-medium text-sm">Item is available for order</label>
                        </div>
                        <button 
                            type="submit" disabled={isSubmitting}
                            className="w-full bg-orange-600 text-white font-bold p-2.5 rounded hover:bg-orange-700 transition disabled:opacity-50 mt-2"
                        >
                            {isSubmitting ? 'Uploading...' : 'Publish Menu Item'}
                        </button>
                    </form>
                </div>

                {/* Manage Orders Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Platform Orders</h2>
                    
                    {orders.length === 0 ? (
                        <p className="text-gray-500 italic">No orders have been placed yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="border rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between">
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg">Order #{order.id}</h3>
                                            <span className="font-bold text-green-700">₹{Number(order.total_amount).toFixed(2)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-semibold">Customer:</span> {order.customer_name} ({order.customer_email})
                                        </p>
                                        
                                        <div className="bg-white p-2 rounded border border-gray-200 mt-2">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Items</h4>
                                            <ul className="text-sm space-y-1">
                                                {order.items?.map((item, idx) => (
                                                    <li key={idx} className="flex justify-between">
                                                        <span>{item.quantity}x {item.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col justify-start md:min-w-40 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Update Status</label>
                                        <select 
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className={`w-full p-2 border rounded font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${statusColors[order.status]}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="out_for_delivery">Out for Delivery</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
