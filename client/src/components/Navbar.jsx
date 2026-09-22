import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">Foodie Central</Link>
                <div className="flex gap-4 items-center">
                    <Link to="/" className="hover:text-blue-200">Menu</Link>
                    
                    {user ? (
                        <>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="hover:text-blue-200">Admin Dashboard</Link>
                            )}
                            <Link to="/cart" className="hover:text-blue-200">Cart</Link>
                            <span className="text-blue-200">| Hello, {user.name}</span>
                            <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600">Logout</button>
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
