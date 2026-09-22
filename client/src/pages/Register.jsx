import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Redirect to login page on success
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create an Account</h2>
            
            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        name="name"
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        name="email"
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Password</label>
                    <input 
                        type="password" 
                        name="password"
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Account Type</label>
                    <select 
                        name="role" 
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="customer">Customer</option>
                        <option value="admin">Restaurant Admin</option>
                    </select>
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-green-600 text-white font-bold p-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
            </p>
        </div>
    );
}
