import { useState, useEffect, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/menu')
            .then(res => res.json())
            .then(data => {
                setMenu(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching menu:', err);
                setLoading(false);
            });
    }, []);

    const handleAddToCart = (item) => {
        if (!user) {
            // Require login before adding to cart
            navigate('/login');
            return;
        }
        addToCart(item);
    };

    if (loading) {
        return <div className="text-center mt-20 text-xl text-gray-600">Loading delicious food...</div>;
    }

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Our Delicious Menu</h1>
            
            {menu.length === 0 ? (
                <div className="text-center text-gray-500">The menu is currently empty. Check back later!</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {menu.map(item => (
                        <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl transition-shadow duration-300">
                            {/* Food Image */}
                            {item.image_url ? (
                                <img 
                                    src={`http://localhost:5000${item.image_url}`} 
                                    alt={item.name} 
                                    className="w-full h-56 object-cover" 
                                />
                            ) : (
                                <div className="w-full h-56 bg-gray-200 flex items-center justify-center text-gray-400">
                                    No Image Available
                                </div>
                            )}
                            
                            {/* Card Content */}
                            <div className="p-5 flex-grow flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
                                    <span className="text-xl text-green-600 font-bold">
                                        ₹{Number(item.price).toFixed(2)}
                                    </span>
                                </div>
                                
                                <p className="text-gray-600 mb-6 flex-grow">{item.description}</p>
                                
                                {/* Action Button */}
                                <button 
                                    onClick={() => handleAddToCart(item)}
                                    disabled={!item.is_available}
                                    className={`w-full py-3 rounded-lg font-semibold transition ${
                                        item.is_available 
                                            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {item.is_available ? 'Add to Cart' : 'Sold Out'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
