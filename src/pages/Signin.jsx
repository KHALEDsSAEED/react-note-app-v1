import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/atoms/Logo';
import Button from '../components/atoms/Button';
import { Label, TextInput } from 'flowbite-react';
import { useDispatch, useSelector } from 'react-redux';
import { signInSuccess, signInFailure, signInStart } from '../redux/user/userSlice';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Signin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading } = useSelector((state) => state.user);

    // state variable to store the form data
    const [formData, setFormData] = useState({});

    // function to handle form input changes
    const handleChange = (e) => {
        setFormData({
            ...formData, // keep all other form data
            [e.target.id]: e.target.value.trim() // update the form data with the new value
        });
    };

    // function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent the default form submission

        // Destructure the email and password from the form data
        const { email, password } = formData;

        // Check if the email and password are not empty
        if (!email || !password) {
            toast.error('Please fill in all fields.'); // Display error message
            return;
        }

        dispatch(signInStart()); // Start the sign-in process

        try {
            // Sign in the user using Firebase authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            dispatch(signInSuccess(userCredential.user)); // Update Redux state on success
            toast.success('Sign in successful!'); // Display success message
            navigate('/dashboard?tab=notes'); // Navigate to the dashboard on success
        } catch (err) {
            dispatch(signInFailure(err.message)); // Update Redux state on failure
            toast.error('Error during sign in: ' + err.message); // Display error message
        }
    };

    return (
        <div className='min-h-screen mt-20'>
            <div className="flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5">
                <div className="flex-1">
                    <Link to='/' className='font-bold dark:text-white text-4xl'>
                        <Logo />
                    </Link>
                    <p className='text-sm mt-5'>
                        Welcome, please sign in to continue
                    </p>
                </div>

                <div className="flex-1">
                    <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                        <div>
                            <Label value='Your Email' />
                            <TextInput
                                type='email'
                                placeholder='Email'
                                id='email'
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label value='Your Password' />
                            <TextInput
                                type='password'
                                placeholder='*********'
                                id='password'
                                onChange={handleChange}
                            />
                        </div>
                        <Button
                            type='submit'
                            content='Sign In'
                            disabled={loading}
                        />
                    </form>

                    <div className="flex gap-2 text-sm mt-5">
                        <span>Dont have an account?</span>
                        <Link to='/sign-up' className='text-blue-500'>
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signin;
