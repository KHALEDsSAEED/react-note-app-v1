import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from '../atoms/Button';

const DashboardProfile = () => {

    const { currentUser } = useSelector((state) => state.user);
    return (
        <div className="flex justify-center items-center lg:min-h-[90vh] bg-gray-100">
            <div className="max-w-lg w-full text-center shadow-lg p-6 rounded-lg">
                <h1 className="my-7 text-center font-semibold text-3xl">Profile</h1>
                <div className="flex flex-col gap-3">
                    <span className="text-lg">Name: {currentUser?.email.trim().split('@')[0].toUpperCase()}</span>
                    <span className="text-lg">Email: {currentUser?.email}</span>
                </div>
                <div className="flex justify-center mt-6">
                    {currentUser && (
                        <Link to={'/create-note'}>
                            <Button content="Create New Note" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DashboardProfile