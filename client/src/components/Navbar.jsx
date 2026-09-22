import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const { cartCount } = useContext(CartContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-orange-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold tracking-wide">🍽️ Foodie Central</Link>
                <div className="flex gap-6 items-center font-medium">
                    <Link to="/" className="hover:text-orange-200 transition">Menu</Link>
                    
                    {user ? (
                        <>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="hover:text-orange-200 transition">Admin Dashboard</Link>
                            )}
                            <Link to="/cart" className="hover:text-orange-200 transition relative">
                                Cart
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-4 bg-white text-orange-600 rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold shadow">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            <span className="text-orange-200 ml-2 border-l border-orange-400 pl-4">Hello, {user.name}</span>
                            <button onClick={handleLogout} className="bg-red-500 px-4 py-1.5 rounded-lg hover:bg-red-600 transition shadow">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-blue-200">Login</Link>
                            <Link to="/register" className="bg-green-500 px-3 py-1 rounded hover:bg-green-600">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
